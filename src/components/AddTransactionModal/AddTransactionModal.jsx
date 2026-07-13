import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  RadioGroup,
  Radio,
} from "@heroui/react";
import { formatAmountInput } from "../../utils/formatCurrency";
import { useAddTransactionForm } from "./useAddTransactionForm";
import CategorySelector from "./CategorySelector";
import BankSelector from "./BankSelector";
import ImageScanButton from "./ImageScanButton";
import { useTransactionsContext } from "../../contexts/TransactionsContext";

/**
 * Component Modal thêm/sửa giao dịch
 * Chỉ chứa UI, logic được xử lý bởi useAddTransactionForm hook
 */
const AddTransactionModal = ({
  isOpen,
  onOpenChange,
  onAddTransaction,
  onUpdateTransaction,
  editingTransaction = null,
}) => {
  const { currentLedger } = useTransactionsContext();

  // Sử dụng hook để lấy logic và state
  const {
    formData,
    setFormData,
    setCustomCategory,
    setCustomBankName,
    errors,
    setErrors,
    handleSubmit,
    isEditMode,
    resetForm,
  } = useAddTransactionForm({
    onClose: () => {
      resetForm();
      onOpenChange(false);
    },
    onAdd: onAddTransaction,
    onUpdate: onUpdateTransaction,
    editingTransaction,
    isOpen,
  });

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="lg"
      scrollBehavior="inside"
      classNames={{
        base: "bg-white dark:bg-gray-900",
        header: "border-b border-gray-200 dark:border-gray-800",
        footer: "border-t border-gray-200 dark:border-gray-800",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? "Cập Nhật Giao Dịch" : "Thêm Giao Dịch Mới"}
              </h2>
            </ModalHeader>
            <ModalBody className="gap-3 sm:gap-4">
              {/* Khu vực quét hóa đơn - chỉ hiện khi thêm mới */}
              {!isEditMode && (
                <ImageScanButton
                  ledgerId={currentLedger?.id}
                  onExtracted={(data) => {
                    // Auto-fill form với dữ liệu từ AI
                    setFormData((prev) => ({
                      ...prev,
                      amount: data.amount
                        ? String(data.amount).replace(/\D/g, "")
                        : prev.amount,
                      date: data.date || prev.date,
                      note: data.description || prev.note,
                      category: data.category || prev.category,
                      type: data.category === "Thu nhập" ? "income" : "expense",
                    }));
                  }}
                />
              )}

              {/* Loại giao dịch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loại giao dịch
                </label>
                <RadioGroup
                  orientation="horizontal"
                  value={formData.type}
                  onValueChange={(value) => {
                    setFormData({ ...formData, type: value, category: "" });
                    setCustomCategory("");
                    setErrors({ ...errors, category: "", customCategory: "" });
                  }}
                >
                  <Radio value="income" className="text-emerald-600">
                    Thu nhập
                  </Radio>
                  <Radio value="expense" className="text-rose-600">
                    Chi tiêu
                  </Radio>
                </RadioGroup>
              </div>

              {/* Ngày */}
              <Input
                type="date"
                label="Ngày"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                variant="bordered"
                classNames={{
                  label: "text-gray-700 dark:text-gray-300",
                }}
              />

              {/* Danh mục với CategorySelector */}
              <CategorySelector
                type={formData.type}
                value={formData.category}
                onChange={(value) => {
                  setFormData({ ...formData, category: value });
                  setErrors({ ...errors, category: "", customCategory: "" });
                }}
                error={errors.category}
              />

              {/* Số tiền */}
              <Input
                type="number"
                label="Số tiền"
                placeholder="Nhập số tiền viết liền (VD: 50000)"
                value={formData.amount}
                onValueChange={(value) => {
                  if (!value) {
                    setFormData({ ...formData, amount: "" });
                    setErrors({ ...errors, amount: "" });
                    return;
                  }
                  const numericValue = value.replace(/\D/g, "");
                  setFormData({ ...formData, amount: numericValue });
                  setErrors({ ...errors, amount: "" });
                }}
                variant="bordered"
                isInvalid={!!errors.amount}
                errorMessage={errors.amount}
                description={
                  formData.amount
                    ? <span className="text-emerald-600 font-semibold text-sm">Thực tế: {formatAmountInput(formData.amount)} VND</span>
                    : null
                }
                endContent={
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    VND
                  </span>
                }
                classNames={{
                  label: "text-gray-700 dark:text-gray-300",
                }}
              />

              {/* Phương thức thanh toán */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phương thức thanh toán
                </label>
                <RadioGroup
                  orientation="horizontal"
                  value={formData.paymentMethod}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      paymentMethod: value,
                      bankName: value === "cash" ? "" : formData.bankName,
                    });
                    if (value === "cash") {
                      setCustomBankName("");
                    }
                    setErrors({ ...errors, bankName: "", customBankName: "" });
                  }}
                >
                  <Radio value="cash">Tiền mặt</Radio>
                  <Radio value="transfer">Chuyển khoản</Radio>
                </RadioGroup>
              </div>

              {/* Tên ngân hàng (chỉ hiện khi chọn chuyển khoản) */}
              {formData.paymentMethod === "transfer" && (
                <BankSelector
                  value={formData.bankName}
                  onChange={(value) => {
                    setFormData({ ...formData, bankName: value });
                    setErrors({ ...errors, bankName: "", customBankName: "" });
                  }}
                  error={errors.bankName}
                  showCustomName={false} // Có thể bật tính năng tên gợi nhớ sau
                />
              )}

              {/* Ghi chú */}
              <Textarea
                label="Ghi chú"
                placeholder="Nhập ghi chú (tùy chọn)"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                variant="bordered"
                minRows={2}
                classNames={{
                  label: "text-gray-700 dark:text-gray-300",
                }}
              />
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Hủy
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                className="active-scale"
              >
                {isEditMode ? "Lưu Thay Đổi" : "Thêm"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AddTransactionModal;
