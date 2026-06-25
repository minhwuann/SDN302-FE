import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { useBudgetContext } from "../../contexts/BudgetContext";
import { useCategoryContext } from "../../contexts/CategoryContext";

const CreateBudgetModal = ({ isOpen, onClose, editingBudget }) => {
  const { addBudget, updateBudget, budgets } = useBudgetContext();
  const { expenseCategories } = useCategoryContext();
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate form if editing
  useEffect(() => {
    if (editingBudget) {
      setCategory(editingBudget.category);
      setLimit(editingBudget.limit.toString());
    } else {
      setCategory("");
      setLimit("");
    }
    setError("");
  }, [editingBudget, isOpen]);

  // Lấy danh sách danh mục chi (theo tên) chưa có budget (nếu đang tạo mới)
  const availableCategories = expenseCategories
    .map((c) => c.name)
    .filter(
      (cat) =>
        editingBudget?.category === cat ||
        !budgets.some((b) => b.category === cat)
    );

  const handleSubmit = async () => {
    if (!category || !limit) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const numericLimit = Number(limit.replace(/[^0-9]/g, ""));
    if (isNaN(numericLimit) || numericLimit <= 0) {
      setError("Hạn mức phải lớn hơn 0");
      return;
    }

    setIsLoading(true);
    try {
      const budgetData = {
        category,
        limit: numericLimit,
        period: "month",
      };

      if (editingBudget) {
        await updateBudget(editingBudget.id, budgetData);
      } else {
        await addBudget(budgetData);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Format số tiền khi nhập
   */
  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value) {
      setLimit(Number(value).toLocaleString("vi-VN"));
    } else {
      setLimit("");
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="center">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {editingBudget ? "Chỉnh sửa ngân sách" : "Tạo ngân sách mới"}
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <Select
                  label="Danh mục"
                  placeholder="Chọn danh mục"
                  selectedKeys={category ? [category] : []}
                  onChange={(e) => setCategory(e.target.value)}
                  isDisabled={!!editingBudget} // Không cho đổi category khi edit
                >
                  {(editingBudget
                    ? [editingBudget.category]
                    : availableCategories
                  ).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  label="Hạn mức chi tiêu (VNĐ)"
                  placeholder="0"
                  value={limit}
                  onChange={handleAmountChange}
                  errorMessage={error}
                  isInvalid={!!error}
                  type="text"
                  inputMode="numeric"
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Hủy
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isLoading}
              >
                {editingBudget ? "Lưu thay đổi" : "Tạo ngân sách"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CreateBudgetModal;
