import { useState, useMemo } from "react";
import { parse, format, isValid } from "date-fns";
import { useAuth } from "../../contexts/AuthContext";
import { useTransactionsContext } from "../../contexts/TransactionsContext";
import {
  DATE_FORMATS,
  AMOUNT_CLEANUP_REGEX,
  DEFAULT_CATEGORY,
  DEFAULT_TYPE,
} from "./constants";

/**
 * Hook xử lý logic cho BulkImport
 * Bao gồm: Parse dữ liệu, validation, preview, và lưu vào Firestore
 *
 * @returns {Object} Object chứa state và handlers
 */
export const useBulkImport = () => {
  const { currentUser } = useAuth();
  const { bulkAddTransactions } = useTransactionsContext();
  const [rawData, setRawData] = useState("");
  const [parsedData, setParsedData] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

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
          type: DEFAULT_TYPE,
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
        type: DEFAULT_TYPE,
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
   * Cập nhật một transaction trong preview
   *
   * @param {string} id - ID của transaction cần cập nhật
   * @param {Object} updates - Object chứa các field cần cập nhật
   */
  const updateParsedItem = (id, updates) => {
    setParsedData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          // Re-validate sau khi cập nhật
          const errors = [];
          if (!parseDate(updated.date)) {
            errors.push("Ngày không hợp lệ");
          }
          if (!parseAmount(updated.amount?.toString())) {
            errors.push("Số tiền không hợp lệ");
          }
          updated.errors = errors;
          updated.isValid = errors.length === 0;
          return updated;
        }
        return item;
      })
    );
  };

  /**
   * Lưu tất cả các transaction hợp lệ vào Firestore
   * Sử dụng Batch Write để tối ưu hiệu suất
   */
  const handleSaveAll = async () => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để lưu dữ liệu");
      return;
    }

    // Lọc chỉ lấy các transaction hợp lệ
    const validTransactions = parsedData.filter((item) => item.isValid);

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
        total: parsedData.length,
      });

      // Reset sau khi lưu thành công
      setRawData("");
      setParsedData([]);
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu:", error);
      setSaveResult({
        success: false,
        error: error.message || "Có lỗi xảy ra khi lưu dữ liệu",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Tính số transaction hợp lệ
   */
  const validCount = useMemo(() => {
    return parsedData.filter((item) => item.isValid).length;
  }, [parsedData]);

  /**
   * Tính số transaction không hợp lệ
   */
  const invalidCount = useMemo(() => {
    return parsedData.filter((item) => !item.isValid).length;
  }, [parsedData]);

  return {
    rawData,
    setRawData,
    parsedData,
    isAnalyzing,
    isSaving,
    saveResult,
    validCount,
    invalidCount,
    handleAnalyze,
    updateParsedItem,
    handleSaveAll,
  };
};
