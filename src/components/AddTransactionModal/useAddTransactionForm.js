import { useState, useEffect } from "react";
import { format } from "date-fns";
import { parseAmountInput } from "../../utils/formatCurrency";

/**
 * Hook xử lý logic cho form thêm/sửa giao dịch
 * Quản lý state, validation, và xử lý submit
 * 
 * @param {Object} props - Props của hook
 * @param {Function} props.onClose - Callback khi đóng modal
 * @param {Function} props.onAdd - Callback khi thêm giao dịch mới
 * @param {Function} props.onUpdate - Callback khi cập nhật giao dịch
 * @param {Object|null} props.editingTransaction - Dữ liệu giao dịch đang sửa (null nếu là thêm mới)
 * @param {boolean} props.isOpen - Trạng thái mở/đóng của modal
 * 
 * @returns {Object} Object chứa các state và handlers
 * @returns {Object} returns.formData - Dữ liệu form hiện tại
 * @returns {Function} returns.setFormData - Hàm set state cho formData
 * @returns {string} returns.customCategory - Giá trị danh mục tùy chỉnh
 * @returns {Function} returns.setCustomCategory - Hàm set state cho customCategory
 * @returns {string} returns.customBankName - Giá trị tên ngân hàng tùy chỉnh
 * @returns {Function} returns.setCustomBankName - Hàm set state cho customBankName
 * @returns {Object} returns.errors - Object chứa các lỗi validation
 * @returns {Function} returns.handleSubmit - Hàm xử lý submit form
 * @returns {boolean} returns.isEditMode - Flag xác định đang ở chế độ sửa hay thêm mới
 */
export const useAddTransactionForm = ({
  onClose,
  onAdd,
  onUpdate,
  editingTransaction,
  isOpen,
}) => {
  // State quản lý dữ liệu form
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    type: "expense",
    category: "",
    amount: "",
    note: "",
    paymentMethod: "cash",
    bankName: "",
  });

  // State cho các trường tùy chỉnh (khi chọn "Khác")
  const [customCategory, setCustomCategory] = useState("");
  const [customBankName, setCustomBankName] = useState("");
  
  // State quản lý lỗi validation
  const [errors, setErrors] = useState({});

  // Xác định chế độ: sửa hay thêm mới
  const isEditMode = !!editingTransaction;

  /**
   * Reset form về trạng thái mặc định
   * Được gọi khi đóng modal hoặc thêm mới
   */
  const resetForm = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      type: "expense",
      category: "",
      amount: "",
      note: "",
      paymentMethod: "cash",
      bankName: "",
    });
    setCustomCategory("");
    setCustomBankName("");
    setErrors({});
  };

  /**
   * Điền form với dữ liệu từ editingTransaction
   * Xử lý logic đặc biệt cho category và bankName khi là "Khác"
   */
  const fillFormWithEditData = () => {
    // Kiểm tra category có phải là "Khác" không
    const isCategoryOther =
      editingTransaction.category === "Khác" || !editingTransaction.category;

    // Kiểm tra bankName có phải là "Khác" không (chỉ khi paymentMethod là transfer)
    const isBankOther =
      editingTransaction.paymentMethod === "transfer" &&
      (editingTransaction.bankName === "Khác" ||
        !editingTransaction.bankName);

    setFormData({
      date: editingTransaction.date,
      type: editingTransaction.type,
      category: isCategoryOther ? "other" : editingTransaction.category,
      amount: editingTransaction.amount.toString(),
      note: editingTransaction.note || "",
      paymentMethod: editingTransaction.paymentMethod || "cash",
      bankName:
        editingTransaction.paymentMethod === "transfer"
          ? isBankOther
            ? "other"
            : editingTransaction.bankName || ""
          : "",
    });

    setCustomCategory(
      isCategoryOther ? editingTransaction.category || "" : ""
    );
    setCustomBankName(
      isBankOther && editingTransaction.paymentMethod === "transfer"
        ? editingTransaction.bankName || ""
        : ""
    );
  };

  /**
   * Effect để điền form khi mở modal
   * Nếu có editingTransaction thì điền dữ liệu, ngược lại reset form
   * Chỉ chạy khi modal mở (isOpen = true) để tránh reset không cần thiết
   */
  useEffect(() => {
    if (!isOpen) return;
    
    if (editingTransaction) {
      fillFormWithEditData();
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTransaction, isOpen]);

  /**
   * Validate form trước khi submit
   * Kiểm tra các trường bắt buộc và định dạng dữ liệu
   * 
   * @returns {boolean} true nếu form hợp lệ, false nếu có lỗi
   */
  const validateForm = () => {
    const newErrors = {};

    // Kiểm tra danh mục
    if (!formData.category) {
      newErrors.category = "Vui lòng chọn danh mục";
    }

    // Kiểm tra số tiền
    const numericAmount = parseAmountInput(formData.amount);
    if (!numericAmount || parseFloat(numericAmount) <= 0) {
      newErrors.amount = "Vui lòng nhập số tiền hợp lệ";
    }

    // Kiểm tra ngân hàng (chỉ khi chọn chuyển khoản)
    if (formData.paymentMethod === "transfer" && !formData.bankName) {
      newErrors.bankName = "Vui lòng chọn ngân hàng";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Xử lý submit form
   * Validate, format dữ liệu, và gọi callback tương ứng (onAdd hoặc onUpdate)
   */
  const handleSubmit = () => {
    // Validate trước khi submit
    if (!validateForm()) {
      return;
    }

    // Parse số tiền từ chuỗi đã format
    const numericAmount = parseAmountInput(formData.amount);

    // Xác định category cuối cùng
    // Hỗ trợ format "Category > Subcategory" hoặc chỉ "Category"
    let finalCategory = "";
    if (formData.category === "other") {
      // Nếu chọn "Khác", dùng customCategory nếu có, ngược lại dùng "Khác"
      finalCategory = customCategory.trim() || "Khác";
    } else if (formData.category.includes(" > ")) {
      // Nếu có format "Category > Subcategory", giữ nguyên
      finalCategory = formData.category;
    } else {
      // Nếu chỉ có category, dùng category đó
      finalCategory = formData.category;
    }

    // Xác định bankName cuối cùng: nếu chọn "Khác" thì dùng customBankName nếu có, ngược lại dùng "Khác"
    // Chỉ thêm bankName vào object nếu paymentMethod là 'transfer'
    const finalBankName =
      formData.paymentMethod === "transfer"
        ? formData.bankName === "other"
          ? customBankName.trim() || "Khác"
          : formData.bankName
        : null;

    // Tạo object transaction hoàn chỉnh
    // Sử dụng spread operator để chỉ thêm bankName khi paymentMethod là 'transfer'
    const transaction = {
      date: formData.date,
      type: formData.type,
      category: finalCategory,
      amount: parseFloat(numericAmount),
      note: formData.note || "",
      paymentMethod: formData.paymentMethod,
      // Chỉ thêm bankName nếu paymentMethod là 'transfer' và có giá trị
      ...(formData.paymentMethod === "transfer" && finalBankName
        ? { bankName: finalBankName }
        : {}),
    };

    // Gọi callback tương ứng: update nếu đang sửa, add nếu thêm mới
    if (editingTransaction) {
      onUpdate(editingTransaction.id, transaction);
    } else {
      onAdd(transaction);
    }

    // Đóng modal sau khi submit
    onClose();
  };

  return {
    formData,
    setFormData,
    customCategory,
    setCustomCategory,
    customBankName,
    setCustomBankName,
    errors,
    setErrors,
    handleSubmit,
    isEditMode,
    resetForm,
  };
};

