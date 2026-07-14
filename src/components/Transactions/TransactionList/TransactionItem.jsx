import { useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";
import { MoreVertical, Edit, Trash2, Package } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency";
import DeleteConfirmModal from "../../DeleteConfirmModal";
import TransactionDetailModal from "./TransactionDetailModal";
import { useCategoryContext } from "../../../contexts/CategoryContext";

/**
 * Component hiển thị một giao dịch đơn lẻ
 * Bao gồm: Icon (emoji từ CategoryContext), thông tin giao dịch, menu hành động
 */
const TransactionItem = ({ transaction, onEdit, onDelete }) => {
  const { expenseCategories, incomeCategories } = useCategoryContext();

  // Hỗ trợ category 2 cấp: "Category > Subcategory" hoặc chỉ "Category"
  const categoryMain = transaction.category?.includes(" > ")
    ? transaction.category.split(" > ")[0]
    : transaction.category;
  const categoryDisplay = transaction.category?.includes(" > ")
    ? transaction.category.split(" > ")[1]
    : transaction.category;

  // Lấy category object từ context để hiển thị emoji icon
  const categories =
    transaction.type === "income" ? incomeCategories : expenseCategories;
  const categoryData = categories.find((cat) => cat.name === categoryMain);
  const categoryEmoji = categoryData?.icon || "📦";
  const categoryColor = categoryData?.color || "#64748B";

  const isIncome = transaction.type === "income";
  const amountColor = isIncome
    ? "text-success-600 dark:text-success-500"
    : "text-danger-600 dark:text-danger-500";
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  return (
    <>
      <div
        className="flex items-center justify-between py-3 px-3 sm:px-4 hover:bg-content2 transition-colors border-b border-divider last:border-b-0 cursor-pointer"
        onClick={() => setIsDetailModalOpen(true)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Emoji Icon với background color từ category */}
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: `${categoryColor}20` }}
          >
            {categoryEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {categoryDisplay}
            </p>
            {transaction.category?.includes(" > ") && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {categoryMain}
              </p>
            )}
            {transaction.note && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {transaction.note}
              </p>
            )}
          </div>
        </div>
        <div className="ml-4 flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className={`vvv-tnum font-semibold ${amountColor}`}>
              {isIncome ? "+" : "−"}
              {formatCurrency(Math.abs(transaction.amount))}
            </p>
            {transaction.paymentMethod === "transfer" &&
              transaction.bankName && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
                  {transaction.bankName}
                </p>
              )}
          </div>
          {/* Menu hành động */}
          <Dropdown>
            <DropdownTrigger>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="text-gray-500 dark:text-gray-400"
                aria-label="Menu hành động"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Actions">
              <DropdownItem
                key="edit"
                startContent={<Edit className="w-4 h-4" />}
                onPress={() => onEdit(transaction)}
              >
                Sửa
              </DropdownItem>
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                startContent={<Trash2 className="w-4 h-4" />}
                onPress={() => setIsDeleteModalOpen(true)}
              >
                Xóa
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Modal xác nhận xóa */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={() => onDelete(transaction.id)}
        transaction={transaction}
      />

      {/* Modal chi tiết giao dịch */}
      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        transaction={transaction}
      />
    </>
  );
};

export default TransactionItem;
