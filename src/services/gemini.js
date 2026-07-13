import { GoogleGenAI, Type } from "@google/genai";

/**
 * System instruction cho AI Assistant - Tối ưu để giảm token
 * AI được tích hợp vào hệ thống ExpenseTracker và có quyền truy cập dữ liệu từ Firestore
 */
/**
 * Tạo system instruction với ngày hiện tại được inject động
 * @returns {string} System instruction với ngày hiện tại
 */
function getSystemInstruction() {
  // Lấy ngày hiện tại theo múi giờ Việt Nam (UTC+7)
  const now = new Date();
  const vietnamTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  );

  const year = vietnamTime.getFullYear();
  const month = String(vietnamTime.getMonth() + 1).padStart(2, "0");
  const day = String(vietnamTime.getDate()).padStart(2, "0");
  const currentDate = `${year}-${month}-${day}`;

  // Format ngày theo kiểu Việt Nam để dễ hiểu
  const vietnamDateFormat = `${day}/${month}/${year}`;

  // Tính ngày hôm qua và ngày hôm kia

  return `Bạn là Trợ lý Tài chính Cá nhân (Financial Companion) thông minh của Ứng dụng Quản lý Chi tiêu (Ví Vi Vu).
Bạn không chỉ là công cụ ghi chép, mà là người bạn đồng hành giúp người dùng quản lý tài chính hiệu quả, tiết kiệm và thông minh hơn.

THÔNG TIN QUAN TRỌNG VỀ THỜI GIAN:
- NGÀY HIỆN TẠI (Hôm nay): ${vietnamDateFormat} (${currentDate})
- Mọi mốc thời gian tương đối ("hôm qua", "tuần trước", "thứ 2") PHẢI được tính toán dựa trên ngày này.

QUY TRÌNH TƯ DUY (CORE THINKING PROCESS):
1. Phân tích ý định (Intent): User muốn ghi chép (Add), tra cứu (Query), hay cần lời khuyên (Advice)?
2. Trích xuất thông tin (Extraction): Tìm Số tiền, Danh mục, Thời gian, Ghi chú.
   - CHUẨN HÓA TIỀN TỆ (QUAN TRỌNG):
     * Nếu nhập số < 1000 (VD: 20, 50, 133, 237, 500): TỰ ĐỘNG HIỂU LÀ ĐƠN VỊ NGHÌN (x1000).
       -> VD: "133" = 133.000, "237" = 237.000, "50" = 50.000.
       -> Lý do: Ở Việt Nam không tiêu được dưới 1.000đ.
     * Nếu nhập "k" (50k) -> 50.000.
     * Nếu nhập "m/tr/củ" (5m) -> 5.000.000.
3. Kiểm tra thiếu (Validation): Nếu muốn thêm giao dịch mà thiếu số tiền -> HỎI NGƯỜI DÙNG.
4. Chọn hành động (Action): Gọi tool phù hợp nhất.

CÁC QUY TẮC XỬ LÝ NÂNG CAO:

1. THÊM GIAO DỊCH THÔNG MINH (Smart Adding):
   - Input: "kính lái xe shopee chuyển khoản hết 133" (Số < 1000)
     -> Gọi addTransaction({ amount: 133000, category: "Mua sắm > Phụ kiện", note: "Kính lái xe Shopee", paymentMethod: "transfer" })
   - Input: "Ăn sáng 30" (Số < 1000)
     -> Gọi addTransaction({ amount: 30000, category: "Ăn uống", note: "Ăn sáng", type: "expense" })
   - Input: "Lương về 15 triệu" 
     -> Gọi addTransaction({ amount: 15000000, category: "Thu nhập > Lương", type: "income" })
   - Input: "Vừa đổ xăng 50k" 
     -> Tự suy luận Category: "Di chuyển > Xăng xe", Note: "Đổ xăng"

   * CHIẾN LƯỢC SUY LUẬN CATEGORY (Category Inference Strategy):
     - Ăn uống: Phở, cơm, bún, trà sữa, cafe, nhậu, khao, siêu thị (thực phẩm)...
     - Di chuyển: Xăng, grab, be, taxi, gửi xe, sửa xe, rửa xe...
     - Mua sắm: Quần áo, giày dép, mỹ phẩm, shopee, lazada, tiki, đồ gia dụng...
     - Hóa đơn: Điện, nước, mạng, internet, 4g, tiền nhà, phí quản lý...
     - Giải trí: Xem phim, netflix, spotify, du lịch, đi chơi, game...
     - Y tế: Thuốc, khám bệnh, vitamin...
     - Thu nhập: Lương, thưởng, ting ting, biếu, tặng, lì xì, bán đồ, lãi ngân hàng...

2. TRA CỨU & PHÂN TÍCH (Contextual Query):
   - Input: "Tháng này tiêu gì nhiều thế?"
     -> Bước 1: Gọi getTransactionsByDateRange({ startDate: "tháng này", endDate: "tháng này" })
     -> Bước 2: Gọi getTotalExpense({ startDate: "tháng này", endDate: "tháng này" })
     -> Trả lời: Tổng hợp và liệt kê các khoản lớn nhất.
   - Input: "Còn bao nhiêu tiền?" / "Tôi có giàu không?"
     -> BẮT BUỘC gọi getBalance() trước khi trả lời.

3. KHI THIẾU THÔNG TIN (Missing Info Handling):
   - Input: "Vừa ăn sáng xong" (Thiếu tiền)
     -> Trả lời: "Bạn ăn sáng hết bao nhiêu tiền vậy? Nhập số tiền đi mình ghi cho nhen! 🍜"
     -> KHÔNG gọi hàm addTransaction khi chưa có số tiền.

4. XỬ LÝ PHỨC TẠP (Complex Scenarios):
   - "Được mẹ cho 500k đi chợ hết 200k"
     -> Tách thành 2 giao dịch: 
        1. Income 500k (Mẹ cho)
        2. Expense 200k (Đi chợ)
     -> Gọi addTransaction 2 lần (hoặc hướng dẫn user nhập lần lượt nếu tool chưa hỗ trợ bulk). 
     (Lưu ý: Hệ thống hiện tại hỗ trợ gọi hàm liên tiếp, hãy gọi addTransaction lần lượt).

5. PHONG CÁCH TRÒ CHUYỆN (Persona):
   - Ngôn ngữ: Tiếng Việt tự nhiên, thân thiện.
   - Tone: Vui vẻ, tích cực, khuyến khích tiết kiệm. 
   - Emoji: Sử dụng chừng mực để tạo cảm hứng (💰, 💸, 📊, 🚀, 🍜, 🚗).
   - "Sự thật mất lòng": Nếu user tiêu quá đà (Expense > Income), hãy cảnh báo khéo léo nhưng thẳng thắn.

LƯU Ý CUỐI CÙNG: LUÔN TRẢ LỜI BẰNG TIẾNG VIỆT VÀ GỌI HÀM KHI CẦN THIẾT.`;
}

/**
 * Định nghĩa các function declarations cho Function Calling
 * Mỗi function cho phép AI gọi trực tiếp các hàm trong hệ thống
 */
export const FUNCTION_DECLARATIONS = [
  {
    name: "addTransaction",
    description:
      "Chuẩn bị giao dịch mới (thu/chi) để user xác nhận. CHỈ tạo preview, KHÔNG tự động lưu vào Firestore. User phải xác nhận mới lưu thực sự.",
    parameters: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Số tiền của giao dịch (bắt buộc)",
        },
        category: {
          type: "string",
          description:
            "Danh mục của giao dịch. QUAN TRỌNG: Category phải được format dưới dạng 'Category > Subcategory' (ví dụ: 'Thu nhập > Sinh hoạt phí', 'Ăn uống > Nhà hàng') hoặc chỉ 'Category' nếu không có subcategory. Khi người dùng nói về việc NHẬN TIỀN từ người khác (mẹ cho, bố cho, gia đình cho) với mục đích cụ thể (sinh hoạt phí, tiền tiêu tháng này), bạn PHẢI dùng category: 'Thu nhập > Sinh hoạt phí' hoặc 'Thu nhập > Trợ cấp gia đình'. Các category phổ biến: 'Ăn uống', 'Di chuyển', 'Mua sắm', 'Hóa đơn', 'Giải trí', 'Y tế', 'Giáo dục', 'Tiết kiệm/Đầu tư', 'Thu nhập', 'Khác'. Mặc định là 'Khác' nếu không có",
        },
        note: {
          type: "string",
          description: "Ghi chú cho giao dịch. Có thể để trống",
        },
        date: {
          type: "string",
          description:
            "Ngày của giao dịch. Người dùng ở Việt Nam có thể nhập: (1) Format Việt Nam (DD/MM/YY hoặc DD/MM/YYYY, ví dụ: '6/12/25' = ngày 6 tháng 12 năm 2025) - bạn PHẢI convert sang YYYY-MM-DD, (2) Ngày tương đối (ví dụ: 'hôm nay', 'hôm qua', 'ngày hôm kia', '3 ngày trước', 'tuần trước', 'thứ 2 tuần trước', 'tháng trước') - bạn PHẢI truyền NGUYÊN VĂN cách nói này, KHÔNG được tự convert. Hệ thống sẽ tự động parse dựa trên ngày hiện tại. Nếu người dùng không cung cấp ngày, TỰ ĐỘNG dùng 'hôm nay' (KHÔNG phải YYYY-MM-DD). KHÔNG được để trống hoặc null.",
        },
        type: {
          type: "string",
          enum: ["income", "expense"],
          description:
            "Loại giao dịch: 'income' cho thu nhập, 'expense' cho chi tiêu. Mặc định là 'expense'",
        },
        paymentMethod: {
          type: "string",
          enum: ["cash", "transfer"],
          description:
            "Phương thức thanh toán: 'cash' cho tiền mặt, 'transfer' cho chuyển khoản. Mặc định là 'cash'",
        },
        bankName: {
          type: "string",
          description:
            "Tên ngân hàng hoặc ví điện tử (chỉ cần khi paymentMethod là 'transfer'). Các ví điện tử phổ biến: MoMo, ZaloPay, VNPay, ShopeePay. Các ngân hàng: Vietcombank, Techcombank, BIDV, Agribank, MBBank, VPBank, ACB, TPBank, Sacombank. Nếu người dùng nói 'chuyển khoản môm' hoặc 'chuyển khoản momo', dùng bankName = 'MoMo'. Nếu không có tên ngân hàng/ví, có thể để null",
        },
      },
      required: ["amount"],
    },
  },
  {
    name: "getTransactionsByDateRange",
    description:
      "Lấy danh sách các giao dịch trong một khoảng thời gian cụ thể từ cơ sở dữ liệu. QUAN TRỌNG: Khi người dùng nói 'tháng trước', bạn PHẢI truyền 'tháng trước' vào CẢ startDate và endDate (hoặc chỉ startDate), hệ thống sẽ tự động hiểu là từ ngày 1 đến ngày cuối của tháng trước. Ví dụ: startDate='tháng trước', endDate='tháng trước' sẽ lấy tất cả giao dịch từ ngày 1 đến ngày cuối của tháng trước.",
    parameters: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description:
            "Ngày bắt đầu. Có thể là: (1) Format YYYY-MM-DD, (2) Format Việt Nam DD/MM/YY hoặc DD/MM/YYYY (bạn PHẢI convert sang YYYY-MM-DD), (3) Ngày tương đối: 'hôm nay', 'hôm qua', 'ngày hôm kia', '3 ngày trước', 'tuần trước', 'thứ 2 tuần trước', (4) Khoảng thời gian: 'tháng trước' (từ ngày 1 đến ngày cuối tháng trước), 'tháng này' (từ ngày 1 tháng này đến hôm nay). QUAN TRỌNG: Nếu người dùng nói 'tháng trước', truyền NGUYÊN VĂN 'tháng trước', KHÔNG convert. Hệ thống sẽ tự động parse thành khoảng thời gian.",
        },
        endDate: {
          type: "string",
          description:
            "Ngày kết thúc. Có thể là: (1) Format YYYY-MM-DD, (2) Format Việt Nam DD/MM/YY hoặc DD/MM/YYYY (bạn PHẢI convert sang YYYY-MM-DD), (3) Ngày tương đối: 'hôm nay', 'hôm qua', 'ngày hôm kia', '3 ngày trước', 'tuần trước', (4) Khoảng thời gian: 'tháng trước' (từ ngày 1 đến ngày cuối tháng trước), 'tháng này' (từ ngày 1 tháng này đến hôm nay). QUAN TRỌNG: Nếu người dùng nói 'tháng trước', truyền NGUYÊN VĂN 'tháng trước', KHÔNG convert. Hệ thống sẽ tự động parse thành khoảng thời gian.",
        },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "getTotalIncome",
    description:
      "Tính tổng thu nhập trong một khoảng thời gian (hoặc tất cả nếu không chỉ định)",
    parameters: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description: "Ngày bắt đầu theo định dạng YYYY-MM-DD (tùy chọn)",
        },
        endDate: {
          type: "string",
          description: "Ngày kết thúc theo định dạng YYYY-MM-DD (tùy chọn)",
        },
      },
      required: [],
    },
  },
  {
    name: "getTotalExpense",
    description:
      "Tính tổng chi tiêu trong một khoảng thời gian (hoặc tất cả nếu không chỉ định)",
    parameters: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description: "Ngày bắt đầu theo định dạng YYYY-MM-DD (tùy chọn)",
        },
        endDate: {
          type: "string",
          description: "Ngày kết thúc theo định dạng YYYY-MM-DD (tùy chọn)",
        },
      },
      required: [],
    },
  },
  {
    name: "getBalance",
    description:
      "Tính số dư (tổng thu nhập - tổng chi tiêu) trong một khoảng thời gian (hoặc tất cả nếu không chỉ định)",
    parameters: {
      type: "object",
      properties: {
        startDate: {
          type: "string",
          description: "Ngày bắt đầu theo định dạng YYYY-MM-DD (tùy chọn)",
        },
        endDate: {
          type: "string",
          description: "Ngày kết thúc theo định dạng YYYY-MM-DD (tùy chọn)",
        },
      },
      required: [],
    },
  },
  {
    name: "deleteTransaction",
    description:
      "Xóa một giao dịch khỏi hệ thống. QUAN TRỌNG: Phải có transactionId chính xác. Quy trình bắt buộc: (1) Gọi getTransactionsByDateRange để tìm giao dịch và ID của nó, (2) Xác nhận với người dùng nếu cần thiết (hoặc nếu người dùng đã chỉ định rõ 'xóa giao dịch 50k vừa nhập' thì có thể xóa luôn nếu AI tìm thấy duy nhất 1 giao dịch khớp), (3) Gọi deleteTransaction với ID tìm được.",
    parameters: {
      type: "object",
      properties: {
        transactionId: {
          type: "string",
          description: "ID của giao dịch cần xóa (bắt buộc)",
        },
      },
      required: ["transactionId"],
    },
  },
  {
    name: "deleteMultipleTransactions",
    description:
      "Xóa nhiều giao dịch cùng lúc. Dùng khi user muốn xóa tất cả giao dịch, xóa các giao dịch trong khoảng thời gian, hoặc xóa nhiều giao dịch theo điều kiện. QUAN TRỌNG: (1) Trước tiên gọi getTransactionsByDateRange để lấy danh sách và IDs của các giao dịch cần xóa, (2) Xác nhận với user số lượng giao dịch sẽ bị xóa, (3) Khi user đồng ý, gọi hàm này với mảng transactionIds.",
    parameters: {
      type: "object",
      properties: {
        transactionIds: {
          type: "array",
          items: { type: "string" },
          description: "Mảng các ID giao dịch cần xóa",
        },
      },
      required: ["transactionIds"],
    },
  },
  {
    name: "getBudgets",
    description:
      "Lấy danh sách các ngân sách chi tiêu hiện tại (budget). Giúp AI kiểm tra xem người dùng đã chi tiêu vượt quá giới hạn đã đặt ra cho các danh mục hay chưa.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "getGoals",
    description:
      "Lấy danh sách các mục tiêu tiết kiệm hiện tại (savings goals). Giúp AI đánh giá tiến độ tiết kiệm của người dùng.",
    parameters: { type: "object", properties: {}, required: [] },
  },
];

/**
 * Xử lý tin nhắn từ người dùng sử dụng Function Calling
 * AI có thể gọi trực tiếp các hàm trong hệ thống
 *
 * @param {string} userMessage - Tin nhắn từ người dùng
 * @param {string} apiKey - Gemini API Key
 * @param {Array} chatHistory - Lịch sử chat (để context)
 * @param {Object} functionHandlers - Object chứa các function handlers
 * @param {Object} context - Context data (userId, transactions, addTransaction function)
 * @returns {Promise<Object>} Object chứa response từ AI và function calls (nếu có)
 */
export const processUserMessage = async (
  userMessage,
  apiKey,
  chatHistory = [],
  functionHandlers = {},
  context = {},
  onStream = null,
  attachedImage = null
) => {
  if (!apiKey) {
    throw new Error("API Key chưa được cấu hình");
  }

  try {
    // Khởi tạo Gemini AI
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    // Config cho Function Calling - dùng chung cho cả initial và final call
    const config = {
      tools: [
        {
          functionDeclarations: FUNCTION_DECLARATIONS,
        },
      ],
    };

    // Chuẩn bị contents với chat history
    const contents = [];

    // Chuyển đổi chat history sang format mới
    chatHistory.forEach((msg) => {
      // Nếu message có functionCall, thêm vào contents
      if (msg.functionCall) {
        // Thêm user message gốc
        contents.push({
          role: "user",
          parts: [{ text: msg.content }],
        });
        // Thêm model's function call
        contents.push({
          role: "model",
          parts: [
            {
              functionCall: {
                name: msg.functionCall.name,
                args: msg.functionCall.args || {},
              },
            },
          ],
        });
        // Thêm user's function response
        contents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name: msg.functionCall.name,
                response: msg.functionCall.response,
              },
            },
          ],
        });
      } else {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }
    });

    const userParts = [{ text: userMessage || "Vui lòng phân tích hình ảnh đính kèm này." }];

    if (attachedImage) {
      // attachedImage.dataUrl format: "data:image/jpeg;base64,/9j/4AAQSk..."
      const mimeType = attachedImage.dataUrl.split(';')[0].split(':')[1] || 'image/jpeg';
      const base64Data = attachedImage.dataUrl.split(',')[1];
      userParts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      });
    }

    // Thêm tin nhắn hiện tại
    contents.push({
      role: "user",
      parts: userParts,
    });

    // Lấy system instruction với ngày hiện tại được inject động
    const systemInstruction = getSystemInstruction();

    // Gọi API với Function Calling và Streaming
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents: contents,
      systemInstruction: systemInstruction,
      config: config,
    });

    let functionCalls = [];
    let text = "";

    for await (const chunk of responseStream) {
      if (chunk.text) {
        text += chunk.text;
        if (onStream) onStream(chunk.text);
      }
      if (chunk.functionCalls && chunk.functionCalls.length > 0) {
        functionCalls.push(
          ...chunk.functionCalls.map((fc) => ({
            name: fc.name,
            args: fc.args || {},
          }))
        );
      }
    }

    if (functionCalls.length > 0) {
      // AI muốn gọi hàm, thực thi các hàm
      const functionResults = [];

      for (const functionCall of functionCalls) {
        const { name, args } = functionCall;

        // Tìm handler tương ứng
        let result;
        try {
          switch (name) {
            case "addTransaction":
              if (
                functionHandlers.handleAddTransaction &&
                context.addTransaction
              ) {
                result = await functionHandlers.handleAddTransaction(
                  args,
                  context.addTransaction
                );
              } else {
                result = {
                  success: false,
                  error: "Handler không khả dụng",
                };
              }
              break;

            case "getTransactionsByDateRange":
              if (
                functionHandlers.handleGetTransactionsByDateRange &&
                context.userId
              ) {
                result =
                  await functionHandlers.handleGetTransactionsByDateRange(
                    args,
                    context.userId,
                    context.ledgerId || "main"
                  );
              } else {
                result = {
                  success: false,
                  error: "Handler không khả dụng",
                };
              }
              break;

            case "getTotalIncome":
              if (
                functionHandlers.handleGetTotalIncome &&
                context.transactions
              ) {
                result = await functionHandlers.handleGetTotalIncome(
                  args,
                  context.transactions
                );
              } else {
                result = {
                  success: false,
                  error: "Handler không khả dụng",
                };
              }
              break;

            case "getTotalExpense":
              if (
                functionHandlers.handleGetTotalExpense &&
                context.transactions
              ) {
                result = await functionHandlers.handleGetTotalExpense(
                  args,
                  context.transactions
                );
              } else {
                result = {
                  success: false,
                  error: "Handler không khả dụng",
                };
              }
              break;

            case "getBalance":
              if (functionHandlers.handleGetBalance && context.transactions) {
                result = await functionHandlers.handleGetBalance(
                  args,
                  context.transactions
                );
              } else {
                result = {
                  success: false,
                  error: "Handler không khả dụng",
                };
              }
              break;

            case "deleteTransaction":
              if (
                functionHandlers.handleDeleteTransaction &&
                context.deleteTransaction
              ) {
                result = await functionHandlers.handleDeleteTransaction(
                  args,
                  context.deleteTransaction
                );
              } else {
                result = {
                  success: false,
                  error: "Handler không khả dụng",
                };
              }
              break;

            case "deleteMultipleTransactions":
              if (
                functionHandlers.handleDeleteMultipleTransactions &&
                context.deleteTransaction
              ) {
                result =
                  await functionHandlers.handleDeleteMultipleTransactions(
                    args,
                    context.deleteTransaction
                  );
              } else {
                result = {
                  success: false,
                  error: "Handler không khả dụng",
                };
              }
              break;

            case "getBudgets":
              if (functionHandlers.handleGetBudgets && context.budgets) {
                result = await functionHandlers.handleGetBudgets(args, context.budgets);
              } else {
                result = { success: false, error: "Handler không khả dụng" };
              }
              break;

            case "getGoals":
              if (functionHandlers.handleGetGoals && context.goals) {
                result = await functionHandlers.handleGetGoals(args, context.goals);
              } else {
                result = { success: false, error: "Handler không khả dụng" };
              }
              break;

            default:
              result = {
                success: false,
                error: `Hàm ${name} không được hỗ trợ`,
              };
          }

          functionResults.push({
            name: name,
            response: result,
          });
        } catch (error) {
          console.error(
            `[Function Calling] Lỗi khi thực thi hàm ${name}:`,
            error
          );
          functionResults.push({
            name: name,
            response: {
              success: false,
              error: error.message || "Có lỗi xảy ra khi thực thi hàm",
            },
          });
        }
      }

      // Gửi kết quả hàm lại cho AI để tạo phản hồi cuối cùng
      // Theo tài liệu: thêm model's function call và user's function response
      const functionResponseContents = [
        ...contents,
        // Thêm model's response với function calls
        {
          role: "model",
          parts: functionCalls.map((fc) => ({
            functionCall: {
              name: fc.name,
              args: fc.args || {},
            },
          })),
        },
        // Thêm user's function response
        {
          role: "user",
          parts: functionResults.map((fr) => ({
            functionResponse: {
              name: fr.name,
              response: fr.response,
            },
          })),
        },
      ];

      // Gọi AI để format kết quả - có fallback nếu API bị lỗi
      let finalText = "";
      try {
        const finalResponseStream = await ai.models.generateContentStream({
          model: "gemini-3.5-flash",
          contents: functionResponseContents,
          systemInstruction: systemInstruction,
          config: config,
        });

        for await (const chunk of finalResponseStream) {
          if (chunk.text) {
            finalText += chunk.text;
            if (onStream) onStream(chunk.text);
          }
        }
      } catch (finalCallError) {
        // Nếu API lỗi (503, quota, etc), tạo fallback response từ function results
        console.warn(
          "[Function Calling] Final AI call failed, using fallback:",
          finalCallError.message
        );

        // Tạo text từ kết quả function đã có
        const fallbackTexts = functionResults.map((fr) => {
          const result = fr.response;
          if (result.success) {
            if (result.message) return result.message;
            if (result.totalExpense !== undefined)
              return `Tổng chi tiêu: ${result.totalExpense.toLocaleString(
                "vi-VN"
              )} VND (${result.count || 0} giao dịch)`;
            if (result.totalIncome !== undefined)
              return `Tổng thu nhập: ${result.totalIncome.toLocaleString(
                "vi-VN"
              )} VND`;
            if (result.balance !== undefined)
              return `Số dư: ${result.balance.toLocaleString("vi-VN")} VND`;
            if (result.count !== undefined)
              return `Tìm thấy ${result.count} giao dịch`;
          }
          return result.error || "Không có dữ liệu";
        });

        finalText =
          fallbackTexts.join("\n\n") +
          "\n\n_(AI đang bận, đây là dữ liệu tóm tắt)_";
      }

      // Final fallback: Nếu vẫn không có text, tạo từ function results
      if (!finalText || finalText.trim() === "") {
        const autoTexts = functionResults.map((fr) => {
          const result = fr.response;
          if (result.success) {
            if (result.message) return result.message;
            if (result.totalExpense !== undefined)
              return `💸 Tổng chi tiêu: ${result.totalExpense.toLocaleString(
                "vi-VN"
              )} VND (${result.count || 0} giao dịch)`;
            if (result.totalIncome !== undefined)
              return `💰 Tổng thu nhập: ${result.totalIncome.toLocaleString(
                "vi-VN"
              )} VND`;
            if (result.balance !== undefined)
              return `📊 Số dư: ${result.balance.toLocaleString("vi-VN")} VND`;
            if (result.count !== undefined)
              return `📋 Tìm thấy ${result.count} giao dịch`;
          }
          return result.error || "Không có dữ liệu";
        });
        finalText = autoTexts.join("\n");
      }

      return {
        text: finalText,
        functionCalls: functionCalls.map((fc, index) => ({
          name: fc.name,
          args: fc.args || {},
          result: functionResults[index].response,
        })),
      };
    } else {
      // AI không gọi hàm, chỉ trả lời thông thường
      return {
        text: text,
        functionCalls: [],
      };
    }
  } catch (error) {
    console.error("Lỗi khi xử lý tin nhắn với AI:", error);
    throw error;
  }
};

/**
 * Xử lý phản hồi từ AI khi có dữ liệu query
 * AI sẽ phân tích dữ liệu và trả lời câu hỏi của người dùng
 *
 * @param {string} originalQuestion - Câu hỏi gốc của người dùng
 * @param {Array} transactionsData - Dữ liệu transactions đã lấy được
 * @param {string} apiKey - Gemini API Key
 * @returns {Promise<string>} Câu trả lời từ AI
 */
export const processQueryResponse = async (
  originalQuestion,
  transactionsData,
  apiKey
) => {
  if (!apiKey) {
    throw new Error("API Key chưa được cấu hình");
  }

  try {
    // Khởi tạo Gemini AI với API mới
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    // Kiểm tra nếu không có dữ liệu
    if (!transactionsData || transactionsData.length === 0) {
      return `Không tìm thấy giao dịch nào trong khoảng thời gian được yêu cầu. Vui lòng thử lại với khoảng thời gian khác hoặc kiểm tra xem bạn đã có giao dịch nào trong hệ thống chưa.`;
    }

    const prompt = `Bạn là trợ lý tài chính cá nhân. Người dùng đã hỏi: "${originalQuestion}"

Dữ liệu giao dịch tìm thấy (${transactionsData.length} giao dịch):
${JSON.stringify(transactionsData, null, 2)}

QUAN TRỌNG: 
- Bạn CÓ QUYỀN TRUY CẬP vào dữ liệu giao dịch này vì đây là dữ liệu từ hệ thống quản lý chi tiêu của người dùng.
- Hãy phân tích dữ liệu và trả lời câu hỏi của người dùng một cách chi tiết, dễ hiểu bằng tiếng Việt.
- Tính toán các số liệu cụ thể từ dữ liệu được cung cấp (tổng thu, tổng chi, số dư, v.v.).
- Trình bày kết quả rõ ràng với số liệu cụ thể.
- Nếu có nhiều giao dịch, hãy phân tích theo danh mục, theo thời gian, v.v.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Lỗi khi xử lý phản hồi query:", error);
    throw error;
  }
};

// =============================================================================
// IMAGE RECEIPT SCANNER - Trích xuất dữ liệu từ hình ảnh hóa đơn
// =============================================================================

/**
 * Schema định nghĩa cấu trúc dữ liệu trả về từ ảnh hóa đơn
 * Sử dụng structured output để đảm bảo format JSON chính xác
 */
const receiptSchema = {
  type: Type.OBJECT,
  properties: {
    amount: {
      type: Type.NUMBER,
      description:
        "Tổng số tiền giao dịch (chỉ số, không có ký hiệu tiền tệ như đ, VND, $). Với tiền Việt, dấu chấm phân cách hàng nghìn phải được loại bỏ.",
    },
    date: {
      type: Type.STRING,
      description:
        "Ngày giao dịch theo định dạng YYYY-MM-DD. Nếu không tìm thấy ngày trong ảnh, để trống.",
    },
    description: {
      type: Type.STRING,
      description:
        "Tên người thụ hưởng, tên cửa hàng (Merchant), hoặc nội dung chuyển khoản. Ví dụ: 'Highlands Coffee', 'Nguyen Van A', 'Chuyen tien an trua'.",
    },
    category: {
      type: Type.STRING,
      description:
        "Danh mục chi tiêu phù hợp nhất dựa vào nội dung và tên người nhận",
      enum: [
        "Ăn uống",
        "Di chuyển",
        "Mua sắm",
        "Hóa đơn",
        "Giải trí",
        "Y tế",
        "Thu nhập",
        "Khác",
      ],
    },
  },
  required: ["amount", "description", "category"],
};

/**
 * Chuyển đổi File object sang Base64 string
 * @param {File} file - File object từ input type="file"
 * @returns {Promise<{base64: string, mimeType: string}>} Object chứa base64 data và mimeType
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result có dạng "data:image/jpeg;base64,/9j/4AAQ..."
      // Ta cần tách lấy phần base64 sau dấu phẩy
      const result = reader.result;
      const base64 = result.split(",")[1];
      resolve({
        base64,
        mimeType: file.type,
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Trích xuất dữ liệu từ hình ảnh hóa đơn/ảnh chụp giao dịch ngân hàng
 * Sử dụng Gemini Vision API với structured output
 *
 * @param {string} imageBase64 - Dữ liệu ảnh dạng Base64 (không bao gồm prefix data:image/...)
 * @param {string} mimeType - Loại file (image/jpeg, image/png, image/webp)
 * @param {string} apiKey - Gemini API Key
 * @returns {Promise<Object>} Object chứa: amount, date, description, category
 */
export const extractReceiptData = async (imageBase64, mimeType, apiKey) => {
  if (!apiKey) {
    throw new Error("API Key chưa được cấu hình");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash", // Optimized for Vision + Structured Output
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
          {
            text: `Bạn là một trợ lý tài chính AI chuyên nghiệp. Hãy phân tích hình ảnh hóa đơn hoặc ảnh chụp màn hình giao dịch ngân hàng này.

Trích xuất các thông tin sau:
1. amount: Tổng số tiền thanh toán (chỉ số, không có ký hiệu tiền tệ)
2. date: Ngày giao dịch (định dạng YYYY-MM-DD)
3. description: Tên người thụ hưởng, cửa hàng, hoặc nội dung chuyển khoản
4. category: Danh mục chi tiêu phù hợp nhất

Lưu ý:
- Với tiền Việt, dấu chấm (.) phân cách hàng nghìn phải được loại bỏ
- Nếu thấy Grab, Be -> Di chuyển
- Nếu thấy Coffee, Phở, cơm -> Ăn uống
- Nếu thấy Shopee, Lazada -> Mua sắm`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
      },
    });

    const jsonString = response.text;
    if (jsonString) {
      return JSON.parse(jsonString);
    }
    return null;
  } catch (error) {
    console.error("Lỗi khi trích xuất dữ liệu từ ảnh:", error);
    throw error;
  }
};
