import { useEffect, useMemo, useRef, useState } from "react";
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
import * as importApi from "../../services/importApi";
import * as exportApi from "../../services/exportApi";
import {
  DATE_FORMATS,
  DEFAULT_CATEGORY,
  DEFAULT_TYPE,
  SAMPLE_EXCEL_HEADERS,
  SAMPLE_EXCEL_FILENAME,
  EXPORT_EXCEL_FILENAME,
} from "./constants";
const IMPORT_CONTENT_HEADER =
  "date\tamount\tcategory\tsubcategory\tnote\ttype\tpaymentmethod";

const IMPORT_ERROR_MESSAGES = {
  INVALID_TYPE: "Loại giao dịch không hợp lệ (income/expense hoặc thu/chi)",
  INVALID_AMOUNT: "Số tiền không hợp lệ",
  INVALID_DATE: "Ngày không hợp lệ",
  INVALID_PAYMENT_METHOD: "Phương thức thanh toán không hợp lệ",
  CATEGORY_NOT_FOUND: "Không tìm thấy danh mục phù hợp",
  CATEGORY_MUST_BE_PARENT: "Danh mục phải là danh mục cha",
  CATEGORY_TYPE_MISMATCH: "Danh mục không khớp loại thu/chi",
  SUBCATEGORY_NOT_FOUND: "Không tìm thấy danh mục con phù hợp",
  SUBCATEGORY_PARENT_MISMATCH: "Danh mục con không thuộc danh mục đã chọn",
  PAYMENT_ACCOUNT_NOT_FOUND: "Không tìm thấy tài khoản thanh toán",
};

/** Bỏ tab/xuống dòng trong 1 field để không phá cấu trúc TSV gửi lên BE. */
const escapeField = (value) => String(value ?? "").replace(/[\t\r\n]/g, " ");

/**
 * BE chỉ khớp category theo TÊN DANH MỤC CHA (vd "Ăn uống"); riêng "Thu nhập"
 * chỉ có 1 danh mục cha, các nhãn quen thuộc (Lương, Freelance...) thực chất là
 * danh mục CON của nó. Nên khi type=income, đẩy giá trị người dùng chọn xuống
 * cột subcategory, còn category luôn là "Thu nhập" (hoặc "Khác" nếu để trống).
 */
const categoryColumnsFor = (type, category) => {
  const trimmed = (category || "").trim();

  if (!trimmed) {
    return { categoryName: DEFAULT_CATEGORY, subcategoryName: "" };
  }
  if (type === "income") {
    return { categoryName: "Thu nhập", subcategoryName: trimmed };
  }
  return { categoryName: trimmed, subcategoryName: "" };
};

/** Ghép các dòng {date, amount, category, note, type, paymentMethod} thành nội dung gửi /imports/preview. */
const buildImportContent = (rows) => {
  const lines = rows.map((row) => {
    const { categoryName, subcategoryName } = categoryColumnsFor(
      row.type,
      row.category
    );

    return [
      row.date,
      row.amount,
      categoryName,
      subcategoryName,
      row.note,
      row.type,
      row.paymentMethod || "",
    ]
      .map(escapeField)
      .join("\t");
  });

  return [IMPORT_CONTENT_HEADER, ...lines].join("\n");
};

/** Tách textarea paste thô (không header) thành các cột [Ngày, Số tiền, Danh mục, Ghi chú, Loại]. */
const splitRawPasteLines = (data) => {
  if (!data || !data.trim()) return [];

  return data
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [date = "", amount = "", category = "", note = "", type = ""] =
        line.split("\t").map((col) => col.trim());

      return {
        date,
        amount,
        category,
        note,
        type: type.toLowerCase() === "income" ? "income" : DEFAULT_TYPE,
      };
    });
};

/**
 * Hook xử lý logic cho DataTools
 * Bao gồm: Import (parse, validate, save), Export (Excel, Clipboard)
 *
 * @returns {Object} Object chứa state và handlers
 */
export const useDataTools = () => {
  const { currentUser } = useAuth();
  const { transactions, currentLedger, bulkAddTransactions, refreshData } =
    useTransactionsContext();

  const [rawData, setRawData] = useState("");
  const [parsedData, setParsedData] = useState([]);
  const [importJobId, setImportJobId] = useState(null);
  const [isRevalidating, setIsRevalidating] = useState(false);
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
   * Gửi lại toàn bộ dòng hiện tại cho BE preview (debounce 500ms) để đồng bộ
   * lại errors/isValid sau khi user sửa 1 ô - giữ nguyên id/thứ tự cục bộ,
   * chỉ đồng bộ kết quả validate (BE trả rows theo đúng thứ tự đã gửi).
   */
  const revalidateTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (revalidateTimerRef.current) clearTimeout(revalidateTimerRef.current);
    };
  }, []);

  const revalidateParsedData = (rows) => {
    if (revalidateTimerRef.current) clearTimeout(revalidateTimerRef.current);
    if (!currentLedger || rows.length === 0) return;

    setIsRevalidating(true);
    revalidateTimerRef.current = setTimeout(async () => {
      try {
        const content = buildImportContent(rows);
        const job = await importApi.previewImport({
          ledgerId: currentLedger.id,
          sourceType: "paste_text",
          content,
        });

        setImportJobId(job.id);
        const beRows = job.summary?.rows || [];
        setParsedData((prev) =>
          prev.map((item, index) => ({
            ...item,
            errors: (beRows[index]?.errors || []).map(
              (e) => IMPORT_ERROR_MESSAGES[e.code] || e.message
            ),
            isValid: beRows[index]?.isValid ?? false,
          }))
        );
      } catch (error) {
        console.error("Lỗi khi xác thực lại dữ liệu:", error);
      } finally {
        setIsRevalidating(false);
      }
    }, 500);
  };

  /**
   * Xử lý khi người dùng bấm nút "Phân tích" - gửi nội dung đã paste lên
   * BE (/imports/preview) để parse + validate (category/tài khoản phải khớp
   * dữ liệu thật của user), thay vì tự parse rồi tin tưởng ở client.
   */
  const handleAnalyze = async () => {
    if (!currentLedger) {
      alert("Vui lòng chọn sổ thu chi trước khi phân tích dữ liệu");
      return;
    }

    const rows = splitRawPasteLines(rawData);
    if (rows.length === 0) {
      setParsedData([]);
      return;
    }

    setIsAnalyzing(true);
    setSaveResult(null);
    setImportJobId(null);

    try {
      const rowsWithPaymentMethod = rows.map((r) => ({
        ...r,
        paymentMethod: "cash",
      }));
      const content = buildImportContent(rowsWithPaymentMethod);
      const job = await importApi.previewImport({
        ledgerId: currentLedger.id,
        sourceType: "paste_text",
        content,
      });

      setImportJobId(job.id);
      const beRows = job.summary?.rows || [];
      setParsedData(
        rows.map((row, index) => ({
          id: `paste-${index}-${Date.now()}`,
          rowNumber: index + 1,
          date: row.date,
          amount: row.amount,
          category: row.category,
          note: row.note,
          type: row.type,
          paymentMethod: "cash",
          errors: (beRows[index]?.errors || []).map(
            (e) => IMPORT_ERROR_MESSAGES[e.code] || e.message
          ),
          isValid: beRows[index]?.isValid ?? false,
        }))
      );
    } catch (error) {
      console.error("Lỗi khi phân tích dữ liệu:", error);
      setParsedData([]);
      alert(error.message || "Có lỗi xảy ra khi phân tích dữ liệu");
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Cập nhật một dòng trong preview (từ paste Excel) - cập nhật cục bộ ngay
   * để gõ mượt, rồi lên lịch xác thực lại với BE (debounce).
   *
   * @param {string} id - ID của transaction cần cập nhật
   * @param {Object} updates - Object chứa các field cần cập nhật
   */
  const updateParsedItem = (id, updates) => {
    setParsedData((prev) => {
      const next = prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              amount:
                updates.amount !== undefined
                  ? Number(String(updates.amount).replace(/[^\d]/g, "")) || 0
                  : item.amount,
            }
          : item
      );
      revalidateParsedData(next);
      return next;
    });
  };

  /**
   * Xóa một dòng khỏi preview rồi xác thực lại phần còn lại với BE
   * (rowNumber của các dòng sau sẽ dịch lên).
   *
   * @param {string} id - ID của transaction cần xóa
   */
  const removeParsedItem = (id) => {
    setParsedData((prev) => {
      const next = prev.filter((item) => item.id !== id);
      revalidateParsedData(next);
      return next;
    });
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
   * Xác nhận (commit) import job hiện tại của tab Paste Excel - BE tạo giao
   * dịch cho các dòng hợp lệ, có audit log riêng cho từng lần import.
   */
  const handlePasteImportCommit = async () => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để lưu dữ liệu");
      return;
    }
    if (isRevalidating) {
      alert("Đang xác thực lại dữ liệu, vui lòng đợi rồi thử lại");
      return;
    }
    if (!importJobId) {
      alert("Chưa có dữ liệu đã phân tích để lưu");
      return;
    }

    setIsSaving(true);
    setSaveResult(null);

    try {
      const result = await importApi.commitImport(importJobId);

      setSaveResult({
        success: true,
        saved: result.transactions.length,
        total: parsedData.length,
      });

      setRawData("");
      setParsedData([]);
      setImportJobId(null);
      await refreshData();
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu import:", error);
      setSaveResult({
        success: false,
        error: error.message || "Có lỗi xảy ra khi lưu dữ liệu",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Lưu các dòng hợp lệ ở bảng nhập trực tiếp (bulk create thẳng qua
   * /transactions/bulk - không cần audit job như import file).
   */
  const handleDirectInputSaveAll = async () => {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để lưu dữ liệu");
      return;
    }

    const validItems = directInputData.filter((item) => item.isValid);

    if (validItems.length === 0) {
      alert("Không có giao dịch hợp lệ để lưu");
      return;
    }

    setIsSaving(true);
    setSaveResult(null);

    try {
      const items = validItems.map((item) => ({
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
        total: directInputData.length,
      });

      setDirectInputData([]);
    } catch (error) {
      console.error("Lỗi khi lưu dữ liệu nhập trực tiếp:", error);
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
   * Xuất dữ liệu ra file Excel - BE tự truy vấn + build file (tới 10.000
   * dòng, không giới hạn bởi số giao dịch đã tải sẵn ở client).
   */
  const handleExportToExcel = async () => {
    if (!currentLedger) {
      alert("Không có dữ liệu để xuất");
      return;
    }

    setIsExporting(true);
    setExportResult(null);

    try {
      const blob = await exportApi.exportTransactionsXlsx({
        ledgerId: currentLedger.id,
      });
      saveAs(blob, EXPORT_EXCEL_FILENAME);

      setExportResult({
        success: true,
        message: "Đã xuất file Excel thành công",
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
   * Xuất dữ liệu ra PDF - BE tự truy vấn + build file (tới 10.000 dòng).
   */
  const handleExportPDF = async () => {
    if (!currentLedger) {
      alert("Không có dữ liệu để xuất");
      return;
    }

    setIsExporting(true);
    setExportResult(null);

    try {
      const blob = await exportApi.exportTransactionsPdf({
        ledgerId: currentLedger.id,
      });
      saveAs(blob, "transactions.pdf");

      setExportResult({
        success: true,
        message: "Đã xuất file PDF thành công",
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
    isRevalidating,
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
    handlePasteImportCommit,
    handleDirectInputSaveAll,
    handleDownloadSample,
    handleExportToExcel,
    handleCopyToClipboard,
    handleExportToGoogleSheets,
    handleExportPDF,
  };
};
