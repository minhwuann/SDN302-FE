import { useState, useMemo } from "react";
import { parse, format, isValid } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getGoogleAccessToken } from "../../services/googleAuth";
import { useAuth } from "../../contexts/AuthContext";
import { useTransactionsContext } from "../../contexts/TransactionsContext";
import {
  createSpreadsheet,
  exportDataToSheet,
} from "../../services/googleSheets";
import {
  DATE_FORMATS,
  AMOUNT_CLEANUP_REGEX,
  DEFAULT_CATEGORY,
  DEFAULT_TYPE,
  SAMPLE_EXCEL_HEADERS,
  SAMPLE_EXCEL_FILENAME,
  EXPORT_EXCEL_FILENAME,
} from "./constants";
import { exportToPDF } from "../../utils/exportUtils";

/**
 * Hook xử lý logic cho DataTools
 * Bao gồm: Import (parse, validate, save), Export (Excel, Clipboard)
 *
 * @returns {Object} Object chứa state và handlers
 */
export const useDataTools = () => {
  const { currentUser } = useAuth();
  const { transactions, bulkAddTransactions } = useTransactionsContext();

  const [rawData, setRawData] = useState("");
  const [parsedData, setParsedData] = useState([]);
  const [directInputData, setDirectInputData] = useState([]); // Dữ liệu nhập trực tiếp vào bảng
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingToSheets, setIsExportingToSheets] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [exportResult, setExportResult] = useState(null);
  const [sheetsExportResult, setSheetsExportResult] = useState(null);

  /**
   * Parse ngày tháng từ chuỗi
   * Thử nhiều định dạng phổ biến
   *
   * @param {string} dateString - Chuỗi ngày cần parse
   * @returns {string|null} Ngày đã parse (YYYY-MM-DD) hoặc null nếu không parse được
   */
  const parseDate = (dateString) => {
    if (!dateString || !dateString.trim()) return null;

    const trimmed = dateString.trim();

    // Thử parse với các định dạng
    for (const formatStr of DATE_FORMATS) {
      try {
        const parsed = parse(trimmed, formatStr, new Date());
        if (isValid(parsed)) {
          return format(parsed, "yyyy-MM-dd");
        }
      } catch {
        // Tiếp tục thử định dạng khác
      }
    }

    // Thử parse trực tiếp với Date constructor (cho ISO format)
    try {
      const date = new Date(trimmed);
      if (isValid(date)) {
        return format(date, "yyyy-MM-dd");
      }
    } catch {
      // Không parse được
    }

    return null;
  };

  /**
   * Parse số tiền từ chuỗi
   * Loại bỏ các ký tự không phải số (đ, dấu phẩy, dấu chấm...)
   *
   * @param {string} amountString - Chuỗi số tiền cần parse
   * @returns {number|null} Số tiền đã parse hoặc null nếu không parse được
   */
  const parseAmount = (amountString) => {
    if (!amountString || !amountString.trim()) return null;

    // Loại bỏ tất cả ký tự không phải số
    const cleaned = amountString.toString().replace(AMOUNT_CLEANUP_REGEX, "");
    if (!cleaned) return null;

    const amount = parseInt(cleaned, 10);
    return isNaN(amount) || amount <= 0 ? null : amount;
  };

  /**
   * Phân tích dữ liệu raw thành mảng các transaction objects
   * Tách dòng bằng \n, tách cột bằng \t
   *
   * @param {string} data - Dữ liệu raw từ Textarea
   * @returns {Array} Mảng các transaction objects (có thể có lỗi)
   */
  const analyzeData = (data) => {
    if (!data || !data.trim()) return [];

    const lines = data.split("\n").filter((line) => line.trim());
    const results = [];

    lines.forEach((line, index) => {
      const columns = line.split("\t").map((col) => col.trim());

      // Ít nhất phải có 2 cột (Ngày và Số tiền)
      if (columns.length < 2) {
        results.push({
          id: `temp-${index}`,
          rowNumber: index + 1,
          date: columns[0] || "",
          amount: columns[1] || "",
          category: columns[2] || "",
          note: columns[3] || "",
          type: columns[4]?.toLowerCase() || DEFAULT_TYPE,
          paymentMethod: "cash",
          errors: ["Thiếu cột dữ liệu"],
          isValid: false,
        });
        return;
      }

      // Parse các giá trị
      const parsedDate = parseDate(columns[0]);
      const parsedAmount = parseAmount(columns[1]);
      const category = columns[2] || DEFAULT_CATEGORY;
      const note = columns[3] || "";
      const type = columns[4]?.toLowerCase() || DEFAULT_TYPE;

      // Validate type
      const validType =
        type === "income" || type === "expense" ? type : DEFAULT_TYPE;

      // Kiểm tra lỗi
      const errors = [];
      if (!parsedDate) {
        errors.push("Ngày không hợp lệ");
      }
      if (!parsedAmount) {
        errors.push("Số tiền không hợp lệ");
      }

      results.push({
        id: `temp-${index}`,
        rowNumber: index + 1,
        date: parsedDate || columns[0],
        amount: parsedAmount || columns[1],
        category: category,
        note: note,
        type: validType,
        paymentMethod: "cash",
        errors: errors,
        isValid: errors.length === 0,
      });
    });

    return results;
  };

  /**
   * Xử lý khi người dùng bấm nút "Phân tích"
   */
  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setSaveResult(null);

    try {
      const analyzed = analyzeData(rawData);
      setParsedData(analyzed);
    } catch (error) {
      console.error("Lỗi khi phân tích dữ liệu:", error);
      setParsedData([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Cập nhật một transaction trong preview (từ paste Excel)
   * Validate TẤT CẢ các field bắt buộc sau mỗi update
   *
   * @param {string} id - ID của transaction cần cập nhật
   * @param {Object} updates - Object chứa các field cần cập nhật
   */
  const updateParsedItem = (id, updates) => {
    setParsedData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          const errors = [];

          // === VALIDATE DATE ===
          const dateValid = parseDate(updated.date);
          if (!dateValid) {
            errors.push("Ngày không hợp lệ");
          }

          // === VALIDATE AMOUNT ===
          let numericAmount = 0;
          if (typeof updated.amount === "number") {
            numericAmount = updated.amount;
          } else if (updated.amount) {
            // Parse từ string (có thể có dấu chấm phân cách)
            const cleaned = String(updated.amount).replace(/[^\d]/g, "");
            numericAmount = parseInt(cleaned, 10) || 0;
          }

          if (numericAmount <= 0) {
            errors.push("Số tiền không hợp lệ");
          } else {
            updated.amount = numericAmount; // Lưu dạng số
          }

          // === XỬ LÝ CATEGORY ===
          if (!updated.category || updated.category.trim() === "") {
            updated.category = "Khác";
          }

          // === SET VALIDATION RESULT ===
          updated.errors = errors;
          updated.isValid = errors.length === 0;

          return updated;
        }
        return item;
      })
    );
  };

  /**
   * Xóa một dòng khỏi preview
   *
   * @param {string} id - ID của transaction cần xóa
   */
  const removeParsedItem = (id) => {
    setParsedData((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * Thêm một hàng mới vào bảng nhập trực tiếp
   */
  const addNewDirectInputRow = () => {
    const newId = `direct-${Date.now()}-${Math.random()}`;
    const newRow = {
      id: newId,
      rowNumber: directInputData.length + 1,
      date: format(new Date(), "yyyy-MM-dd"), // Mặc định là ngày hôm nay
      amount: "",
      category: DEFAULT_CATEGORY,
      note: "",
      type: DEFAULT_TYPE,
      paymentMethod: "cash",
      errors: [],
      isValid: false,
    };
    setDirectInputData((prev) => [...prev, newRow]);
  };

  /**
   * Cập nhật một dòng trong bảng nhập trực tiếp
   * Validate TẤT CẢ các field bắt buộc sau mỗi update
   *
   * @param {string} id - ID của transaction cần cập nhật
   * @param {Object} updates - Object chứa các field cần cập nhật
   */
  const updateDirectInputItem = (id, updates) => {
    setDirectInputData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          const errors = [];

          // === VALIDATE DATE ===
          const dateValid = parseDate(updated.date);
          if (!dateValid) {
            errors.push("Ngày không hợp lệ");
          }

          // === VALIDATE AMOUNT ===
          let numericAmount = 0;
          if (typeof updated.amount === "number") {
            numericAmount = updated.amount;
          } else if (updated.amount) {
            // Parse từ string (có thể có dấu chấm phân cách)
            const cleaned = String(updated.amount).replace(/[^\d]/g, "");
            numericAmount = parseInt(cleaned, 10) || 0;
          }

          if (numericAmount <= 0) {
            errors.push("Số tiền không hợp lệ");
          } else {
            updated.amount = numericAmount; // Lưu dạng số
          }

          // === SET VALIDATION RESULT ===
          updated.errors = errors;
          updated.isValid = errors.length === 0;

          return updated;
        }
        return item;
      })
    );
  };

  /**
   * Xóa một dòng khỏi bảng nhập trực tiếp
   *
   * @param {string} id - ID của transaction cần xóa
   */
  const removeDirectInputItem = (id) => {
    setDirectInputData((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * Lưu tất cả các transaction hợp lệ vào Firestore
   * Sử dụng Batch Write để tối ưu hiệu suất
   * Merge cả dữ liệu từ paste và nhập trực tiếp
   */
  const handleSaveAll = async () => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để lưu dữ liệu");
      return;
    }

    // Merge và lọc chỉ lấy các transaction hợp lệ từ cả 2 nguồn
    const allData = [...parsedData, ...directInputData];
    const validTransactions = allData.filter((item) => item.isValid);

    if (validTransactions.length === 0) {
      alert("Không có giao dịch hợp lệ để lưu");
      return;
    }

    setIsSaving(true);
    setSaveResult(null);

    try {
      const items = validTransactions.map((item) => ({
        date: item.date,
        type: item.type,
        category: item.category,
        amount: Number(item.amount),
        note: item.note || "",
        paymentMethod: item.paymentMethod || "cash",
        ...(item.paymentMethod === "transfer" && item.bankName
          ? { bankName: item.bankName }
          : {}),
      }));

      const saved = await bulkAddTransactions(items);

      setSaveResult({
        success: true,
        saved,
        total: allData.length,
      });

      // Reset sau khi lưu thành công
      setRawData("");
      setParsedData([]);
      setDirectInputData([]);
    } catch (error) {
      console.error("[DEBUG handleSaveAll] ERROR:", error);
      setSaveResult({
        success: false,
        error: error.message || "Có lỗi xảy ra khi lưu dữ liệu",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Tạo file Excel mẫu và tải về
   */
  const handleDownloadSample = () => {
    try {
      // Tạo workbook mới
      const wb = XLSX.utils.book_new();

      // Tạo worksheet với header
      const ws = XLSX.utils.aoa_to_sheet([SAMPLE_EXCEL_HEADERS]);

      // Thêm một vài dòng mẫu
      const sampleData = [
        ["01/01/2024", "50000", "Ăn uống", "Bữa trưa", "expense"],
        ["02/01/2024", "100000", "Lương", "Tháng 1", "income"],
      ];
      XLSX.utils.sheet_add_aoa(ws, sampleData, { origin: -1 });

      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(wb, ws, "Mẫu");

      // Xuất file
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, SAMPLE_EXCEL_FILENAME);
    } catch (error) {
      console.error("Lỗi khi tạo file mẫu:", error);
      alert("Có lỗi xảy ra khi tạo file mẫu");
    }
  };

  /**
   * Xuất dữ liệu ra file Excel
   */
  const handleExportToExcel = async () => {
    if (transactions.length === 0) {
      alert("Không có dữ liệu để xuất");
      return;
    }

    setIsExporting(true);
    setExportResult(null);

    try {
      // Chuẩn bị dữ liệu
      const exportData = transactions.map((tx) => ({
        Ngày: tx.date,
        Số_tiền: tx.amount,
        Danh_mục: tx.category,
        Ghi_chú: tx.note || "",
        Loại: tx.type === "income" ? "Thu" : "Chi",
        Phương_thức:
          tx.paymentMethod === "transfer" ? "Chuyển khoản" : "Tiền mặt",
        Ngân_hàng: tx.bankName || "",
      }));

      // Tạo workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Điều chỉnh độ rộng cột
      const colWidths = [
        { wch: 12 }, // Ngày
        { wch: 15 }, // Số tiền
        { wch: 20 }, // Danh mục
        { wch: 30 }, // Ghi chú
        { wch: 10 }, // Loại
        { wch: 15 }, // Phương thức
        { wch: 15 }, // Ngân hàng
      ];
      ws["!cols"] = colWidths;

      // Thêm worksheet vào workbook
      XLSX.utils.book_append_sheet(wb, ws, "Lịch sử giao dịch");

      // Xuất file
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, EXPORT_EXCEL_FILENAME);

      setExportResult({
        success: true,
        message: `Đã xuất ${transactions.length} giao dịch ra file Excel`,
      });
    } catch (error) {
      console.error("Lỗi khi xuất Excel:", error);
      setExportResult({
        success: false,
        error: error.message || "Có lỗi xảy ra khi xuất file",
      });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Xuất dữ liệu ra PDF
   */
  const handleExportPDF = async () => {
    if (transactions.length === 0) {
      alert("Không có dữ liệu để xuất");
      return;
    }
    setIsExporting(true);
    try {
      await exportToPDF(transactions);
      setExportResult({
        success: true,
        message: `Đã xuất ${transactions.length} giao dịch ra PDF`,
      });
    } catch (error) {
      console.error("Lỗi khi xuất PDF:", error);
      setExportResult({
        success: false,
        error: `Có lỗi: ${error.message || "Không xác định"}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Xuất dữ liệu ra Google Sheets
   * Yêu cầu user đăng nhập lại để lấy access token với scope mới
   */
  const handleExportToGoogleSheets = async () => {
    if (transactions.length === 0) {
      alert("Không có dữ liệu để xuất");
      return;
    }

    if (!currentUser) {
      alert("Vui lòng đăng nhập để xuất dữ liệu");
      return;
    }

    setIsExportingToSheets(true);
    setSheetsExportResult(null);

    try {
      // Bước 1: Lấy access token (scope drive.file) qua Google Identity Services
      const accessToken = await getGoogleAccessToken(
        "https://www.googleapis.com/auth/drive.file"
      );

      if (!accessToken) {
        throw new Error("Không thể lấy access token. Vui lòng thử lại.");
      }

      // Bước 2: Tạo spreadsheet mới (tên tự động: "Bảng thống kê thu chi - dd/MM/yyyy")
      const spreadsheetInfo = await createSpreadsheet(accessToken);
      const { spreadsheetId, sheetId } = spreadsheetInfo;

      // Bước 3: Xuất dữ liệu vào sheet
      await exportDataToSheet(
        accessToken,
        spreadsheetId,
        transactions,
        sheetId
      );

      // Bước 4: Lưu kết quả với link để mở sheet
      setSheetsExportResult({
        success: true,
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        message: `Đã xuất ${transactions.length} giao dịch vào Google Sheets`,
      });
    } catch (error) {
      console.error("Lỗi khi xuất Google Sheets:", error);

      // Xử lý các loại lỗi khác nhau
      let errorMessage = "Có lỗi xảy ra khi xuất dữ liệu";

      if (error.code === "auth/popup-closed-by-user") {
        errorMessage =
          "Bạn đã đóng cửa sổ đăng nhập. Vui lòng thử lại và hoàn tất quá trình đăng nhập. Lưu ý: Nếu thấy trang cảnh báo của Google, hãy nhấp 'Nâng cao' và 'Tiếp tục' để cho phép ứng dụng.";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage =
          "Cửa sổ đăng nhập bị chặn bởi trình duyệt. Vui lòng cho phép popup và thử lại.";
      } else if (error.code === "auth/cancelled-popup-request") {
        errorMessage = "Yêu cầu đăng nhập đã bị hủy. Vui lòng thử lại.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSheetsExportResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsExportingToSheets(false);
    }
  };

  /**
   * Copy dữ liệu vào clipboard dạng bảng (để paste vào Google Sheets)
   */
  const handleCopyToClipboard = async () => {
    if (transactions.length === 0) {
      alert("Không có dữ liệu để sao chép");
      return;
    }

    try {
      // Tạo header
      const headers = [
        "Ngày",
        "Số tiền",
        "Danh mục",
        "Ghi chú",
        "Loại",
        "Phương thức",
        "Ngân hàng",
      ];

      // Tạo dữ liệu dạng TSV (Tab-Separated Values)
      const rows = transactions.map((tx) => [
        tx.date,
        tx.amount,
        tx.category,
        tx.note || "",
        tx.type === "income" ? "Thu" : "Chi",
        tx.paymentMethod === "transfer" ? "Chuyển khoản" : "Tiền mặt",
        tx.bankName || "",
      ]);

      // Kết hợp header và data
      const allRows = [headers, ...rows];

      // Chuyển thành chuỗi TSV
      const tsvString = allRows
        .map((row) => row.map((cell) => String(cell || "")).join("\t"))
        .join("\n");

      // Copy vào clipboard
      await navigator.clipboard.writeText(tsvString);

      setExportResult({
        success: true,
        message: `Đã sao chép ${transactions.length} giao dịch vào clipboard`,
      });
    } catch (error) {
      console.error("Lỗi khi sao chép:", error);
      setExportResult({
        success: false,
        error: error.message || "Có lỗi xảy ra khi sao chép",
      });
    }
  };

  /**
   * Tính số transaction hợp lệ (từ cả 2 nguồn: paste và nhập trực tiếp)
   */
  const validCount = useMemo(() => {
    const allData = [...parsedData, ...directInputData];
    return allData.filter((item) => item.isValid).length;
  }, [parsedData, directInputData]);

  /**
   * Tính số transaction không hợp lệ (từ cả 2 nguồn: paste và nhập trực tiếp)
   */
  const invalidCount = useMemo(() => {
    const allData = [...parsedData, ...directInputData];
    return allData.filter((item) => !item.isValid).length;
  }, [parsedData, directInputData]);

  return {
    rawData,
    setRawData,
    parsedData,
    directInputData,
    isAnalyzing,
    isSaving,
    isExporting,
    isExportingToSheets,
    saveResult,
    exportResult,
    sheetsExportResult,
    validCount,
    invalidCount,
    transactionsCount: transactions.length,
    handleAnalyze,
    updateParsedItem,
    removeParsedItem,
    addNewDirectInputRow,
    updateDirectInputItem,
    removeDirectInputItem,
    handleSaveAll,
    handleDownloadSample,
    handleExportToExcel,
    handleCopyToClipboard,
    handleExportToGoogleSheets,
    handleExportPDF,
  };
};
