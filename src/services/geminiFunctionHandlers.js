import { getTransactionsByDateRange } from "../hooks/useTransactions";

/**
 * Function handlers để thực thi các function calls từ AI
 * Mỗi handler tương ứng với một function declaration trong gemini.js
 */

/**
 * Parse ngày tương đối (hôm nay, hôm qua, ngày hôm kia, tuần trước, ...) sang YYYY-MM-DD
 *
 * @param {string} dateStr - Chuỗi ngày tương đối (ví dụ: "hôm nay", "hôm qua", "3 ngày trước")
 * @returns {string} Ngày đã được format thành YYYY-MM-DD
 */
function parseRelativeDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") {
    return null;
  }

  const normalized = dateStr.toLowerCase().trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Hôm nay và các cách nói về hôm nay
  if (
    normalized === "hôm nay" ||
    normalized === "hom nay" ||
    normalized === "hồi trưa" ||
    normalized === "hoi trua" ||
    normalized === "trưa nay" ||
    normalized === "trua nay" ||
    normalized === "sáng nay" ||
    normalized === "sang nay" ||
    normalized === "chiều nay" ||
    normalized === "chieu nay" ||
    normalized === "tối nay" ||
    normalized === "toi nay"
  ) {
    return formatDate(today);
  }

  // Hôm qua (1 ngày trước)
  if (
    normalized === "hôm qua" ||
    normalized === "ngày hôm qua" ||
    normalized === "hom qua" ||
    normalized === "ngay hom qua"
  ) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday);
  }

  // Ngày hôm kia (2 ngày trước)
  if (
    normalized === "ngày hôm kia" ||
    normalized === "hôm kia" ||
    normalized === "ngay hom kia" ||
    normalized === "hom kia"
  ) {
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    return formatDate(dayBeforeYesterday);
  }

  // X ngày trước (ví dụ: "3 ngày trước", "5 ngày trước")
  const daysAgoMatch = normalized.match(/^(\d+)\s*ngày\s*trước$/);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10);
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - days);
    return formatDate(targetDate);
  }

  // X tuần trước (ví dụ: "2 tuần trước", "3 tuần trước")
  const weeksAgoMatch = normalized.match(/^(\d+)\s*tuần\s*trước$/);
  if (weeksAgoMatch) {
    const weeks = parseInt(weeksAgoMatch[1], 10);
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() - weeks * 7);
    return formatDate(targetDate);
  }

  // Tuần trước (1 tuần = 7 ngày trước)
  if (normalized === "tuần trước" || normalized === "tuan truoc") {
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    return formatDate(lastWeek);
  }

  // Thứ trong tuần trước (ví dụ: "thứ 2 tuần trước", "thứ 3 tuần trước")
  const dayOfWeekMap = {
    "chủ nhật": 0,
    "chu nhat": 0,
    "thứ 2": 1,
    "thu 2": 1,
    "thứ hai": 1,
    "thu hai": 1,
    "thứ 3": 2,
    "thu 3": 2,
    "thứ ba": 2,
    "thu ba": 2,
    "thứ 4": 3,
    "thu 4": 3,
    "thứ tư": 3,
    "thu tu": 3,
    "thứ 5": 4,
    "thu 5": 4,
    "thứ năm": 4,
    "thu nam": 4,
    "thứ 6": 5,
    "thu 6": 5,
    "thứ sáu": 5,
    "thu sau": 5,
    "thứ 7": 6,
    "thu 7": 6,
    "thứ bảy": 6,
    "thu bay": 6,
  };

  for (const [key, targetDayOfWeek] of Object.entries(dayOfWeekMap)) {
    if (normalized.includes(key) && normalized.includes("tuần trước")) {
      // Tìm thứ trong tuần trước
      // Bắt đầu từ 7 ngày trước (đầu tuần trước)
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      // Tìm ngày thứ đó trong tuần trước
      const currentDayOfWeek = lastWeekStart.getDay();
      const daysToSubtract = (currentDayOfWeek - targetDayOfWeek + 7) % 7;

      const targetDate = new Date(lastWeekStart);
      targetDate.setDate(targetDate.getDate() - daysToSubtract);

      return formatDate(targetDate);
    }
  }

  // Tháng trước (cùng ngày trong tháng trước)
  if (normalized === "tháng trước" || normalized === "thang truoc") {
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    // Nếu ngày không hợp lệ (ví dụ: 31/02), dùng ngày cuối tháng
    if (lastMonth.getDate() !== today.getDate()) {
      lastMonth.setDate(0); // Ngày cuối tháng trước
    }
    return formatDate(lastMonth);
  }

  // Năm trước (cùng ngày trong năm trước)
  if (normalized === "năm trước" || normalized === "nam truoc") {
    const lastYear = new Date(today);
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    return formatDate(lastYear);
  }

  return null; // Không phải ngày tương đối
}

/**
 * Format Date object thành YYYY-MM-DD
 *
 * @param {Date} date - Date object
 * @returns {string} Ngày đã được format thành YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse "tháng trước" thành khoảng thời gian (từ ngày 1 đến ngày cuối của tháng trước)
 *
 * @param {string} dateStr - Chuỗi ngày (ví dụ: "tháng trước", "thang truoc")
 * @returns {Object|null} Object chứa {startDate, endDate} hoặc null nếu không phải "tháng trước"
 */
function parseMonthRange(dateStr) {
  if (!dateStr || typeof dateStr !== "string") {
    return null;
  }

  const normalized = dateStr.toLowerCase().trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Tháng trước (từ ngày 1 đến ngày cuối của tháng trước)
  if (
    normalized === "tháng trước" ||
    normalized === "thang truoc" ||
    normalized === "tháng vừa rồi" ||
    normalized === "thang vua roi" ||
    normalized === "tháng rồi" ||
    normalized === "thang roi"
  ) {
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Ngày đầu tháng trước (ngày 1)
    const startDate = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      1
    );

    // Ngày cuối tháng trước
    const endDate = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth() + 1,
      0
    );

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    };
  }

  // Tháng này (từ ngày 1 đến hôm nay)
  if (normalized === "tháng này" || normalized === "thang nay") {
    const thisMonth = new Date(today);

    // Ngày đầu tháng này (ngày 1)
    const startDate = new Date(
      thisMonth.getFullYear(),
      thisMonth.getMonth(),
      1
    );

    // Ngày cuối là hôm nay
    const endDate = new Date(today);

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    };
  }

  return null;
}

/**
 * Parse ngày từ format Việt Nam (DD/MM/YY hoặc DD/MM/YYYY) sang YYYY-MM-DD
 * Hỗ trợ các format:
 * - DD/MM/YY (ví dụ: 6/12/25 -> 2025-12-06)
 * - DD/MM/YYYY (ví dụ: 6/12/2025 -> 2025-12-06)
 * - YYYY-MM-DD (giữ nguyên)
 * - DD-MM-YY, DD-MM-YYYY (dấu gạch ngang)
 *
 * @param {boolean} strict - Nếu true, trả về null nếu không parse được. Nếu false, trả về ngày hôm nay.
 * @returns {string|null} Ngày đã được format thành YYYY-MM-DD
 */
function parseVietnameseDate(dateStr, strict = false) {
  if (!dateStr || typeof dateStr !== "string") {
    return strict ? null : dateStr;
  }

  // Nếu đã là format YYYY-MM-DD, kiểm tra và trả về
  const yyyyMmDdPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  if (yyyyMmDdPattern.test(dateStr)) {
    return dateStr;
  }

  // Parse format DD/MM/YY hoặc DD/MM/YYYY
  // Hỗ trợ cả dấu / và dấu -
  const pattern = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/;

  const match = dateStr.trim().match(pattern);
  if (match) {
    let day = parseInt(match[1], 10);
    let month = parseInt(match[2], 10);
    let year = parseInt(match[3], 10);

    // Xử lý năm 2 chữ số: nếu < 50 thì là 20xx, nếu >= 50 thì là 19xx
    if (year < 100) {
      year = year < 50 ? 2000 + year : 1900 + year;
    }

    // Validate ngày, tháng
    if (month < 1 || month > 12) {
      if (strict) return null;
      const today = new Date();
      year = today.getFullYear();
      month = today.getMonth() + 1;
      day = today.getDate();
    }

    if (day < 1 || day > 31) {
      if (strict) return null;
      const today = new Date();
      year = today.getFullYear();
      month = today.getMonth() + 1;
      day = today.getDate();
    }

    // Format thành YYYY-MM-DD
    const formattedYear = String(year);
    const formattedMonth = String(month).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");

    return `${formattedYear}-${formattedMonth}-${formattedDay}`;
  }

  // Nếu không parse được
  if (strict) return null;

  // Trả về ngày hôm nay (fallback)
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Handler cho hàm addTransaction
 * Trả về transaction data để preview, không tự động lưu
 *
 * @param {Object} params - Parameters từ AI
 * @param {Function} addTransaction - Function từ TransactionsContext (không dùng ở đây, chỉ để preview)
 * @returns {Promise<Object>} Kết quả với transaction data để preview
 */
export const handleAddTransaction = async (params) => {
  try {
    const {
      amount,
      category = "Khác",
      note = "",
      date,
      type = "expense",
      paymentMethod = "cash",
      bankName = null,
    } = params;

    // Validate required fields
    if (!amount) {
      return {
        success: false,
        error: "Thiếu thông tin bắt buộc: amount",
      };
    }

    // Parse và normalize ngày từ format Việt Nam hoặc các format khác
    let transactionDate = date;

    if (!transactionDate) {
      // Tự động dùng ngày hôm nay nếu không có ngày
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      transactionDate = `${year}-${month}-${day}`;
    } else {
      // Thử parse ngày tương đối trước (hôm nay, hôm qua, tuần trước, ...)
      // QUAN TRỌNG: AI có thể truyền nguyên văn "ngày hôm kia" hoặc đã convert thành YYYY-MM-DD
      const relativeDate = parseRelativeDate(transactionDate);
      if (relativeDate) {
        transactionDate = relativeDate;
      } else {
        // Nếu không phải ngày tương đối, parse từ format Việt Nam (DD/MM/YY hoặc DD/MM/YYYY)
        // Hoặc nếu đã là YYYY-MM-DD thì giữ nguyên
        transactionDate = parseVietnameseDate(transactionDate);
      }
    }

    // Log để debug
    // Date parsing completed

    // Tạo transaction object (chưa lưu, chỉ để preview)
    const transaction = {
      amount: Number(amount),
      category,
      note,
      date: transactionDate, // Dùng ngày đã xử lý (có thể là ngày hôm nay)
      type,
      paymentMethod,
    };

    // Chỉ thêm bankName nếu paymentMethod là 'transfer' và có bankName
    if (paymentMethod === "transfer" && bankName) {
      transaction.bankName = bankName;
    }

    // Trả về transaction data để preview (không lưu ngay)
    // QUAN TRỌNG: Không lưu vào Firestore ở đây, chỉ tạo preview
    return {
      success: true,
      needsPreview: true, // Flag để biết cần preview - LUÔN là true
      transaction,
      // Không trả về message ở đây, để AI tự tạo message phù hợp
    };
  } catch (error) {
    console.error("Lỗi khi chuẩn bị giao dịch:", error);
    return {
      success: false,
      error: error.message || "Có lỗi xảy ra khi chuẩn bị giao dịch",
    };
  }
};

/**
 * Handler cho hàm getTransactionsByDateRange
 * Hỗ trợ parse "tháng trước", "tháng này" thành khoảng thời gian
 *
 * @param {Object} params - Parameters từ AI (startDate, endDate)
 * @param {string} userId - User ID
 * @param {string} ledgerId - Ledger ID để filter theo sổ hiện tại
 * @returns {Promise<Object>} Kết quả với danh sách transactions
 */
export const handleGetTransactionsByDateRange = async (
  params,
  userId,
  ledgerId = "main"
) => {
  try {
    let { startDate, endDate } = params;

    if (!startDate || !endDate) {
      return {
        success: false,
        error: "Thiếu thông tin: startDate và endDate",
        transactions: [],
      };
    }

    // Parse "tháng trước" hoặc "tháng này" nếu có
    const startMonthRange = parseMonthRange(startDate);
    const endMonthRange = parseMonthRange(endDate);

    if (startMonthRange) {
      // Nếu startDate là "tháng trước" hoặc "tháng này", dùng khoảng thời gian từ monthRange
      startDate = startMonthRange.startDate;
      endDate = startMonthRange.endDate;
    } else if (endMonthRange) {
      // Nếu chỉ endDate là "tháng trước" hoặc "tháng này"
      startDate = endMonthRange.startDate;
      endDate = endMonthRange.endDate;
    } else {
      // Parse ngày tương đối hoặc format Việt Nam cho startDate và endDate
      const parsedStartDate =
        parseRelativeDate(startDate) || parseVietnameseDate(startDate, true);
      const parsedEndDate =
        parseRelativeDate(endDate) || parseVietnameseDate(endDate, true);

      // Nếu không parse được ngày, trả về lỗi thay vì fallback sang hôm nay
      if (!parsedStartDate && !startMonthRange && !endMonthRange) {
        return {
          success: false,
          error: `Không thể hiểu định dạng ngày: "${startDate}". Vui lòng sử dụng DD/MM/YYYY hoặc các từ như "hôm nay", "hôm qua", "tháng trước".`,
          transactions: [],
        };
      }

      if (parsedStartDate) startDate = parsedStartDate;
      if (parsedEndDate) endDate = parsedEndDate;
    }

    const transactions = await getTransactionsByDateRange(
      userId,
      startDate,
      endDate,
      ledgerId
    );

    // Tối ưu: Chỉ gửi summary và sample (10 transactions gần nhất) để giảm token
    // Nhưng phải bao gồm ID để AI có thể sử dụng cho việc xóa
    const sampleSize = 10;
    const sample = transactions.slice(0, sampleSize);

    // Tính tổng thu và chi
    const totalIncome = transactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const totalExpense = transactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    return {
      success: true,
      count: transactions.length,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      // Bao gồm ID để AI có thể dùng cho delete
      sample: sample.map((tx) => ({
        id: tx.id, // QUAN TRỌNG: Thêm ID để hỗ trợ xóa
        date: tx.date,
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        note: tx.note || "",
        paymentMethod: tx.paymentMethod || "cash",
      })),
      // Gợi ý: Nếu user muốn xóa, có thể dùng ID từ danh sách này
    };
  } catch (error) {
    console.error("Lỗi khi lấy giao dịch:", error);
    return {
      success: false,
      error: error.message || "Có lỗi xảy ra khi lấy giao dịch",
      transactions: [],
    };
  }
};

/**
 * Handler cho hàm getTotalIncome
 * Tính tổng thu nhập từ transactions
 *
 * @param {Object} params - Parameters từ AI (startDate, endDate optional)
 * @param {Array} allTransactions - Tất cả transactions của user
 * @returns {Promise<Object>} Kết quả với tổng thu nhập
 */
export const handleGetTotalIncome = async (params, allTransactions) => {
  try {
    let { startDate, endDate } = params || {};

    let filteredTransactions = allTransactions;

    // Parse date range nếu có
    if (startDate || endDate) {
      // Parse "tháng trước" hoặc "tháng này" nếu có
      const startMonthRange = parseMonthRange(startDate);
      const endMonthRange = parseMonthRange(endDate);

      if (startMonthRange) {
        startDate = startMonthRange.startDate;
        endDate = startMonthRange.endDate;
      } else if (endMonthRange) {
        startDate = endMonthRange.startDate;
        endDate = endMonthRange.endDate;
      } else {
        // Parse ngày tương đối hoặc format Việt Nam
        const parsedStartDate =
          parseRelativeDate(startDate) ||
          parseVietnameseDate(startDate, true) ||
          startDate;
        const parsedEndDate =
          parseRelativeDate(endDate) ||
          parseVietnameseDate(endDate, true) ||
          endDate;

        if (parsedStartDate) startDate = parsedStartDate;
        if (parsedEndDate) endDate = parsedEndDate;
      }

      // Filter theo date range
      if (startDate && endDate) {
        filteredTransactions = allTransactions.filter((tx) => {
          const txDate = tx.date || "";
          return txDate >= startDate && txDate <= endDate;
        });
      }
    }

    // Tính tổng thu nhập
    const incomeTransactions = filteredTransactions.filter(
      (tx) => tx.type === "income"
    );
    const totalIncome = incomeTransactions.reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0),
      0
    );

    return {
      success: true,
      totalIncome,
      count: incomeTransactions.length,
      period:
        startDate && endDate
          ? `${startDate} đến ${endDate}`
          : "tất cả thời gian",
      message: `Tổng thu nhập: ${totalIncome.toLocaleString("vi-VN")} VND`,
    };
  } catch (error) {
    console.error("Lỗi khi tính tổng thu nhập:", error);
    return {
      success: false,
      error: error.message || "Có lỗi xảy ra khi tính tổng thu nhập",
      totalIncome: 0,
    };
  }
};

export const handleGetTotalExpense = async (params, allTransactions) => {
  try {
    let { startDate, endDate } = params || {};

    let filteredTransactions = allTransactions;

    // Parse date range nếu có
    if (startDate || endDate) {
      // Parse "tháng trước" hoặc "tháng này" nếu có
      const startMonthRange = parseMonthRange(startDate);
      const endMonthRange = parseMonthRange(endDate);

      if (startMonthRange) {
        startDate = startMonthRange.startDate;
        endDate = startMonthRange.endDate;
      } else if (endMonthRange) {
        startDate = endMonthRange.startDate;
        endDate = endMonthRange.endDate;
      } else {
        // Parse ngày tương đối hoặc format Việt Nam
        const parsedStartDate =
          parseRelativeDate(startDate) ||
          parseVietnameseDate(startDate, true) ||
          startDate;
        const parsedEndDate =
          parseRelativeDate(endDate) ||
          parseVietnameseDate(endDate, true) ||
          endDate;

        if (parsedStartDate) startDate = parsedStartDate;
        if (parsedEndDate) endDate = parsedEndDate;
      }

      // Filter theo date range
      if (startDate && endDate) {
        filteredTransactions = allTransactions.filter((tx) => {
          const txDate = tx.date || "";
          return txDate >= startDate && txDate <= endDate;
        });
      }
    }

    // Tính tổng chi tiêu
    const expenseTransactions = filteredTransactions.filter(
      (tx) => tx.type === "expense"
    );
    const totalExpense = expenseTransactions.reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0),
      0
    );

    return {
      success: true,
      totalExpense,
      count: expenseTransactions.length,
      period:
        startDate && endDate
          ? `${startDate} đến ${endDate}`
          : "tất cả thời gian",
      message: `Tổng chi tiêu: ${totalExpense.toLocaleString("vi-VN")} VND`,
    };
  } catch (error) {
    console.error("Lỗi khi tính tổng chi tiêu:", error);
    return {
      success: false,
      error: error.message || "Có lỗi xảy ra khi tính tổng chi tiêu",
      totalExpense: 0,
    };
  }
};

/**
 * Handler cho hàm getBalance
 * Tính số dư (tổng thu - tổng chi)
 *
 * @param {Object} params - Parameters từ AI (startDate, endDate optional)
 * @param {Array} allTransactions - Tất cả transactions của user
 * @returns {Promise<Object>} Kết quả với số dư
 */
export const handleGetBalance = async (params, allTransactions) => {
  try {
    let { startDate, endDate } = params || {};

    let filteredTransactions = allTransactions;

    // Parse date range nếu có
    if (startDate || endDate) {
      // Parse "tháng trước" hoặc "tháng này" nếu có
      const startMonthRange = parseMonthRange(startDate);
      const endMonthRange = parseMonthRange(endDate);

      if (startMonthRange) {
        startDate = startMonthRange.startDate;
        endDate = startMonthRange.endDate;
      } else if (endMonthRange) {
        startDate = endMonthRange.startDate;
        endDate = endMonthRange.endDate;
      } else {
        // Parse ngày tương đối hoặc format Việt Nam
        const parsedStartDate =
          parseRelativeDate(startDate) ||
          parseVietnameseDate(startDate, true) ||
          startDate;
        const parsedEndDate =
          parseRelativeDate(endDate) ||
          parseVietnameseDate(endDate, true) ||
          endDate;

        if (parsedStartDate) startDate = parsedStartDate;
        if (parsedEndDate) endDate = parsedEndDate;
      }

      // Filter theo date range
      if (startDate && endDate) {
        filteredTransactions = allTransactions.filter((tx) => {
          const txDate = tx.date || "";
          return txDate >= startDate && txDate <= endDate;
        });
      }
    }

    // Tính tổng thu và tổng chi
    const totalIncome = filteredTransactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const totalExpense = filteredTransactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const balance = totalIncome - totalExpense;

    return {
      success: true,
      balance,
      totalIncome,
      totalExpense,
      period:
        startDate && endDate
          ? `${startDate} đến ${endDate}`
          : "tất cả thời gian",
      message: `Số dư: ${balance.toLocaleString(
        "vi-VN"
      )} VND (Thu: ${totalIncome.toLocaleString(
        "vi-VN"
      )} VND, Chi: ${totalExpense.toLocaleString("vi-VN")} VND)`,
    };
  } catch (error) {
    console.error("Lỗi khi tính số dư:", error);
    return {
      success: false,
      error: error.message || "Có lỗi xảy ra khi tính số dư",
      balance: 0,
    };
  }
};

/**
 * Handler cho hàm deleteTransaction
 * Xóa một giao dịch khỏi Firestore
 *
 * @param {Object} params - Parameters từ AI (transactionId)
 * @param {Function} deleteTransaction - Function từ TransactionsContext
 * @returns {Promise<Object>} Kết quả xóa
 */
export const handleDeleteTransaction = async (params, deleteTransaction) => {
  try {
    const { transactionId } = params;

    if (!transactionId) {
      return {
        success: false,
        error: "Thiếu thông tin: transactionId",
      };
    }

    if (!deleteTransaction) {
      return {
        success: false,
        error: "Hàm deleteTransaction không khả dụng",
      };
    }

    await deleteTransaction(transactionId);

    return {
      success: true,
      message: `Đã xóa giao dịch thành công.`,
      transactionId,
    };
  } catch (error) {
    console.error("Lỗi khi xóa giao dịch:", error);
    return {
      success: false,
      error: error.message || "Có lỗi xảy ra khi xóa giao dịch",
    };
  }
};

/**
 * Handler cho hàm deleteMultipleTransactions
 * Xóa nhiều giao dịch cùng lúc từ Firestore
 *
 * @param {Object} params - Parameters từ AI (transactionIds)
 * @param {Function} deleteTransaction - Function từ TransactionsContext
 * @returns {Promise<Object>} Kết quả xóa
 */
export const handleDeleteMultipleTransactions = async (
  params,
  deleteTransaction
) => {
  try {
    const { transactionIds } = params;

    if (
      !transactionIds ||
      !Array.isArray(transactionIds) ||
      transactionIds.length === 0
    ) {
      return {
        success: false,
        error: "Thiếu thông tin: transactionIds phải là mảng không rỗng",
      };
    }

    if (!deleteTransaction) {
      return {
        success: false,
        error: "Hàm deleteTransaction không khả dụng",
      };
    }

    // Xóa từng giao dịch
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const transactionId of transactionIds) {
      try {
        await deleteTransaction(transactionId);
        successCount++;
        results.push({ id: transactionId, success: true });
      } catch (err) {
        failCount++;
        results.push({ id: transactionId, success: false, error: err.message });
      }
    }

    return {
      success: failCount === 0,
      message: `Đã xóa ${successCount}/${transactionIds.length} giao dịch thành công.`,
      successCount,
      failCount,
      totalRequested: transactionIds.length,
    };
  } catch (error) {
    console.error("Lỗi khi xóa nhiều giao dịch:", error);
    return {
      success: false,
      error: error.message || "Có lỗi xảy ra khi xóa nhiều giao dịch",
    };
  }
};

export const handleGetBudgets = async (params, budgets) => {
  try {
    return {
      success: true,
      budgets: budgets.map(b => ({
        category: b.category,
        amount: b.amount,
        spent: b.spent || 0,
        remaining: b.amount - (b.spent || 0)
      })),
      count: budgets.length,
      message: `Đã lấy danh sách ${budgets.length} ngân sách.`
    };
  } catch (error) {
    return { success: false, error: "Lỗi lấy ngân sách: " + error.message };
  }
};

export const handleGetGoals = async (params, goals) => {
  try {
    return {
      success: true,
      goals: goals.map(g => ({
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount || 0,
        deadline: g.deadline,
        status: g.status
      })),
      count: goals.length,
      message: `Đã lấy danh sách ${goals.length} mục tiêu.`
    };
  } catch (error) {
    return { success: false, error: "Lỗi lấy mục tiêu: " + error.message };
  }
};
