import { useState, useMemo } from "react";
import {
  Button,
  useDisclosure,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { Plus, Wallet, AlertTriangle } from "lucide-react";
import { useTransactionsContext } from "../../contexts/TransactionsContext";
import { useBudgetContext } from "../../contexts/BudgetContext";
import BudgetCard from "../../components/Budget/BudgetCard";
import CreateBudgetModal from "../../components/Budget/CreateBudgetModal";
import { formatCurrency } from "../../utils/formatCurrency";

/**
 * Tab Quản lý ngân sách (Budget)
 * Được tách ra từ trang Budget cũ để nhúng vào trang Planning
 */
const BudgetTab = () => {
  const { transactions } = useTransactionsContext();
  const { budgets, isLoading, deleteBudget } = useBudgetContext();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [editingBudget, setEditingBudget] = useState(null);

  // State cho modal xác nhận xóa
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Tính toán tổng chi tiêu theo category trong tháng hiện tại
   */
  const spendingByCategory = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filter transactions của tháng hiện tại
    const currentMonthTransactions = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return (
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear &&
        tx.type === "expense"
      );
    });

    // Group by category
    const spending = {};
    currentMonthTransactions.forEach((tx) => {
      // Logic match category: Giả định ngân sách áp dụng cho tên category chính
      budgets.forEach((budget) => {
        if (
          tx.category === budget.category ||
          tx.category.startsWith(budget.category + " > ")
        ) {
          spending[budget.category] =
            (spending[budget.category] || 0) + tx.amount;
        }
      });
    });

    return spending;
  }, [transactions, budgets]);

  /**
   * Tổng hợp thông tin ngân sách toàn bộ
   */
  const totalBudgetInfo = useMemo(() => {
    const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = Object.values(spendingByCategory).reduce(
      (sum, val) => sum + val,
      0
    );
    return { totalLimit, totalSpent };
  }, [budgets, spendingByCategory]);

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    onOpen();
  };

  // Mở modal xác nhận xóa
  const handleDelete = (budget) => {
    setBudgetToDelete(budget);
    onDeleteOpen();
  };

  // Xác nhận xóa
  const confirmDelete = async () => {
    if (!budgetToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBudget(budgetToDelete.id);
      onDeleteOpenChange(false);
      setBudgetToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingBudget(null);
    onOpen();
  };

  return (
    <div className="space-y-6">
      {/* Tổng quan ngân sách — bề mặt phẳng */}
      <div className="rounded-[14px] border border-divider bg-content1 p-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-primary-50 text-primary dark:bg-primary-500/15">
              <Wallet className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Tổng ngân sách tháng
              </h2>
              <p className="text-default-600 text-sm">
                Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-default-600">Còn lại</p>
            <p className="vvv-tnum text-xl sm:text-2xl font-bold text-foreground">
              {formatCurrency(
                Math.max(
                  0,
                  totalBudgetInfo.totalLimit - totalBudgetInfo.totalSpent
                )
              )}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="vvv-tnum flex justify-between text-sm text-default-600">
            <span>Đã chi: {formatCurrency(totalBudgetInfo.totalSpent)}</span>
            <span>Tổng hạn mức: {formatCurrency(totalBudgetInfo.totalLimit)}</span>
          </div>
          <Progress
            aria-label="Tiến độ chi tiêu tổng"
            color="primary"
            value={
              (totalBudgetInfo.totalSpent / totalBudgetInfo.totalLimit) * 100 ||
              0
            }
            className="h-2"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button
          color="primary"
          startContent={<Plus className="w-5 h-5" />}
          onPress={handleOpenCreate}
        >
          Tạo ngân sách mới
        </Button>
      </div>

      {/* Danh sách ngân sách */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            spentAmount={spendingByCategory[budget.category] || 0}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}

        {budgets.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12 bg-content1 rounded-[14px] border border-dashed border-divider">
            <p className="text-default-600 mb-4">
              Bạn chưa thiết lập ngân sách nào cho tháng này.
            </p>
            <Button variant="light" color="primary" onPress={handleOpenCreate}>
              Thiết lập ngay
            </Button>
          </div>
        )}
      </div>

      {/* Modal tạo/sửa */}
      <CreateBudgetModal
        isOpen={isOpen}
        onClose={() => onOpenChange(false)}
        editingBudget={editingBudget}
      />

      {/* Modal xác nhận xóa */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange} size="sm">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-danger">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Xác nhận xóa</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <p className="text-gray-600 dark:text-gray-300">
                  Bạn có chắc muốn xóa ngân sách cho mục{" "}
                  <strong>"{budgetToDelete?.category}"</strong>?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Hành động này không thể hoàn tác.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Hủy
                </Button>
                <Button
                  color="danger"
                  onPress={confirmDelete}
                  isLoading={isDeleting}
                >
                  Xóa ngân sách
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default BudgetTab;
