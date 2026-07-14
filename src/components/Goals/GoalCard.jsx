/**
 * Component hiển thị một Mục tiêu tiết kiệm
 * Bao gồm progress bar, thông tin và actions
 */

import { useState } from "react";
import {
  Card,
  CardBody,
  Progress,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
} from "@heroui/react";
import {
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  Target,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";

/**
 * Tính số ngày còn lại
 */
const getDaysRemaining = (deadline) => {
  if (!deadline) return null;
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * GoalCard Component
 * @param {Object} goal - Dữ liệu mục tiêu
 * @param {Function} onAddMoney - Callback thêm tiền
 * @param {Function} onEdit - Callback chỉnh sửa
 * @param {Function} onDelete - Callback xóa
 */
const GoalCard = ({ goal, onAddMoney, onEdit, onDelete }) => {
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const progress =
    goal.targetAmount > 0
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0;

  const daysRemaining = getDaysRemaining(goal.deadline);
  const isCompleted = goal.status === "completed";
  const isOverdue = daysRemaining !== null && daysRemaining < 0 && !isCompleted;

  const handleAddMoney = async () => {
    // Loại bỏ cả dấu chấm và phẩy (VN dùng dấu chấm phân cách nghìn)
    const cleanedAmount = addAmount.replace(/[.,]/g, "");
    const amount = parseInt(cleanedAmount, 10);
    if (isNaN(amount) || amount <= 0) return;

    setIsLoading(true);
    await onAddMoney(goal, amount);
    setIsLoading(false);
    setAddAmount("");
    setIsAddMoneyOpen(false);
  };

  return (
    <>
      <Card
        radius="lg"
        className={`bg-content1 shadow-none border ${
          isCompleted
            ? "border-success-300 dark:border-success-500/40"
            : isOverdue
            ? "border-danger-300 dark:border-danger-500/40"
            : "border-divider"
        }`}
      >
        <CardBody className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${goal.color}20` }}
              >
                {goal.icon || "🎯"}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {goal.name}
                </h3>
                {daysRemaining !== null && (
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      isCompleted
                        ? "text-green-500"
                        : isOverdue
                        ? "text-red-500"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    {isCompleted
                      ? "Hoàn thành!"
                      : isOverdue
                      ? `Quá hạn ${Math.abs(daysRemaining)} ngày`
                      : `Còn ${daysRemaining} ngày`}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Dropdown */}
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem
                  key="edit"
                  startContent={<Pencil className="w-4 h-4" />}
                  onPress={() => onEdit(goal)}
                >
                  Chỉnh sửa
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  startContent={<Trash2 className="w-4 h-4" />}
                  className="text-danger"
                  color="danger"
                  onPress={() => onDelete(goal)}
                >
                  Xóa
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Progress */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Tiến độ</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {progress.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={progress}
              color={isCompleted ? "success" : "primary"}
              className="h-2"
            />
          </div>

          {/* Amount */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Đã tiết kiệm
              </p>
              <p
                className="text-lg font-bold"
                style={{ color: goal.color || "#3B82F6" }}
              >
                {formatCurrency(goal.currentAmount)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mục tiêu
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(goal.targetAmount)}
              </p>
            </div>
          </div>

          {/* Add Money Button */}
          {!isCompleted && (
            <Button
              color="primary"
              variant="flat"
              className="w-full"
              startContent={<Plus className="w-4 h-4" />}
              onPress={() => setIsAddMoneyOpen(true)}
            >
              Bỏ tiết kiệm
            </Button>
          )}

          {isCompleted && (
            <div className="text-center py-2 text-green-500 font-medium">
              🎉 Chúc mừng! Đã đạt mục tiêu!
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Money Modal */}
      <Modal isOpen={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen} size="sm">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-500" />
            Bỏ tiết kiệm
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Thêm tiền vào mục tiêu "{goal.name}"
            </p>
            <Input
              type="text"
              label="Số tiền"
              placeholder="Nhập số tiền"
              value={addAmount}
              onChange={(e) => {
                // Format number with commas
                const value = e.target.value.replace(/\D/g, "");
                const formatted = new Intl.NumberFormat("vi-VN").format(value);
                setAddAmount(formatted);
              }}
              endContent={<span className="text-gray-400 text-sm">VND</span>}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsAddMoneyOpen(false)}>
              Hủy
            </Button>
            <Button
              color="primary"
              onPress={handleAddMoney}
              isLoading={isLoading}
              isDisabled={!addAmount}
            >
              Thêm tiền
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GoalCard;
