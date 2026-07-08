import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  RadioGroup,
  Radio,
  Textarea,
} from "@heroui/react";
import { User, DollarSign, Calendar, FileText } from "lucide-react";

/**
 * Modal tạo/sửa khoản nợ
 * @param {boolean} isOpen - Trạng thái mở modal
 * @param {Function} onClose - Callback đóng modal
 * @param {Function} onSubmit - Callback submit form
 * @param {Object} editingDebt - Dữ liệu debt đang sửa (null nếu tạo mới)
 */
const CreateDebtModal = ({ isOpen, onClose, onSubmit, editingDebt = null }) => {
  const [formData, setFormData] = useState({
    type: "borrow",
    personName: "",
    amount: "",
    reason: "",
    dueDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form khi mở modal hoặc thay đổi editingDebt
  useEffect(() => {
    if (isOpen) {
      if (editingDebt) {
        setFormData({
          type: editingDebt.type || "borrow",
          personName: editingDebt.personName || "",
          amount: editingDebt.amount?.toString() || "",
          reason: editingDebt.reason || "",
          dueDate: editingDebt.dueDate || "",
        });
      } else {
        setFormData({
          type: "borrow",
          personName: "",
          amount: "",
          reason: "",
          dueDate: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, editingDebt]);

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.personName.trim()) {
      newErrors.personName = "Vui lòng nhập tên người";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Vui lòng nhập số tiền hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const debtData = {
        type: formData.type,
        personName: formData.personName.trim(),
        amount: parseFloat(formData.amount),
        reason: formData.reason.trim(),
        dueDate: formData.dueDate || null,
      };

      await onSubmit(debtData, editingDebt?.id);
      onClose();
    } catch (error) {
      console.error("Lỗi khi lưu khoản nợ:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input change
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error khi user bắt đầu nhập
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" placement="center">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {editingDebt ? "Sửa khoản nợ" : "Thêm khoản nợ mới"}
        </ModalHeader>

        <ModalBody className="gap-4">
          {/* Loại nợ */}
          <RadioGroup
            label="Loại giao dịch"
            orientation="horizontal"
            value={formData.type}
            onValueChange={(value) => handleChange("type", value)}
          >
            <Radio value="borrow" color="warning">
              Đi vay (Mình nợ)
            </Radio>
            <Radio value="lend" color="success">
              Cho vay (Người ta nợ mình)
            </Radio>
          </RadioGroup>

          {/* Tên người */}
          <Input
            label={formData.type === "lend" ? "Tên người vay" : "Tên chủ nợ"}
            placeholder="Nhập tên người liên quan"
            value={formData.personName}
            onValueChange={(value) => handleChange("personName", value)}
            startContent={<User size={18} className="text-default-400" />}
            isInvalid={!!errors.personName}
            errorMessage={errors.personName}
            isRequired
          />

          {/* Số tiền */}
          <Input
            label="Số tiền"
            placeholder="Nhập số tiền"
            type="number"
            min={0}
            value={formData.amount}
            onValueChange={(value) => handleChange("amount", value)}
            startContent={<DollarSign size={18} className="text-default-400" />}
            endContent={<span className="text-default-400 text-sm">VNĐ</span>}
            isInvalid={!!errors.amount}
            errorMessage={errors.amount}
            isRequired
          />

          {/* Hạn trả */}
          <Input
            label="Hạn trả (tùy chọn)"
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={formData.dueDate}
            onValueChange={(value) => handleChange("dueDate", value)}
            startContent={<Calendar size={18} className="text-default-400" />}
          />

          {/* Lý do */}
          <Textarea
            label="Lý do / Ghi chú"
            placeholder="Vay để mua xe, cho vay ăn trưa..."
            value={formData.reason}
            onValueChange={(value) => handleChange("reason", value)}
            startContent={
              <FileText size={18} className="text-default-400 mt-2" />
            }
            minRows={2}
          />
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Hủy
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
          >
            {editingDebt ? "Cập nhật" : "Thêm"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateDebtModal;
