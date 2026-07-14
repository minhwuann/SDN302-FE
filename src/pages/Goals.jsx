/**
 * Trang Mục tiêu tiết kiệm (Savings Goals)
 * Hiển thị danh sách mục tiêu và cho phép CRUD
 */

import { useState } from "react";
import { Button, Spinner } from "@heroui/react";
import EmptyState from "../components/ui/EmptyState";
import { Target, Plus, TrendingUp, CheckCircle2 } from "lucide-react";
import useGoals from "../hooks/useGoals";
import GoalCard from "../components/Goals/GoalCard";
import CreateGoalModal from "../components/Goals/CreateGoalModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { formatCurrency } from "../utils/formatCurrency";

const Goals = () => {
  const {
    goals,
    isLoading,
    stats,
    createGoal,
    updateGoal,
    addMoney,
    deleteGoal,
  } = useGoals();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deletingGoal, setDeletingGoal] = useState(null);

  // Xử lý tạo/cập nhật mục tiêu
  const handleSaveGoal = async (goalData) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, goalData);
    } else {
      await createGoal(goalData);
    }
    setEditingGoal(null);
  };

  // Xử lý xóa mục tiêu
  const handleDeleteGoal = async () => {
    if (deletingGoal) {
      await deleteGoal(deletingGoal.id);
      setDeletingGoal(null);
    }
  };

  // Phân loại goals
  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" label="Đang tải mục tiêu..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-7 h-7 text-primary-500" />
            Mục tiêu tiết kiệm
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Đặt mục tiêu và theo dõi tiến độ tiết kiệm của bạn
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => setIsCreateOpen(true)}
        >
          Thêm mục tiêu
        </Button>
      </div>

      {/* Stats Cards — bề mặt phẳng */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-[14px] border border-divider bg-content1 p-4">
          <p className="text-sm text-default-600">Tổng đã tiết kiệm</p>
          <p className="vvv-tnum mt-1 text-lg sm:text-xl font-bold text-foreground break-words">
            {formatCurrency(stats.totalSaved)}
          </p>
        </div>
        <div className="rounded-[14px] border border-divider bg-content1 p-4">
          <p className="text-sm text-default-600">Mục tiêu hoàn thành</p>
          <p className="vvv-tnum mt-1 flex items-center gap-1.5 text-lg sm:text-xl font-bold text-success-600">
            <CheckCircle2 className="w-5 h-5" strokeWidth={2} />
            {stats.completed}
          </p>
        </div>
        <div className="rounded-[14px] border border-divider bg-content1 p-4">
          <p className="text-sm text-default-600">Đang thực hiện</p>
          <p className="vvv-tnum mt-1 flex items-center gap-1.5 text-lg sm:text-xl font-bold text-foreground">
            <TrendingUp className="w-5 h-5 text-primary" strokeWidth={2} />
            {stats.active}
          </p>
        </div>
        <div className="rounded-[14px] border border-divider bg-content1 p-4">
          <p className="text-sm text-default-600">Tổng mục tiêu</p>
          <p className="vvv-tnum mt-1 text-lg sm:text-xl font-bold text-foreground break-words">
            {formatCurrency(stats.totalTarget)}
          </p>
        </div>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            Đang thực hiện ({activeGoals.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onAddMoney={addMoney}
                onEdit={(g) => {
                  setEditingGoal(g);
                  setIsCreateOpen(true);
                }}
                onDelete={(g) => setDeletingGoal(g)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Đã hoàn thành ({completedGoals.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onAddMoney={addMoney}
                onEdit={(g) => {
                  setEditingGoal(g);
                  setIsCreateOpen(true);
                }}
                onDelete={(g) => setDeletingGoal(g)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <EmptyState
          icon={Target}
          title="Chưa có mục tiêu nào"
          description="Hãy tạo mục tiêu tiết kiệm đầu tiên của bạn!"
          action={
            <Button
              color="primary"
              startContent={<Plus className="w-4 h-4" />}
              onPress={() => setIsCreateOpen(true)}
            >
              Tạo mục tiêu
            </Button>
          }
        />
      )}

      {/* Create/Edit Modal */}
      <CreateGoalModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        editingGoal={editingGoal}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingGoal}
        onClose={() => setDeletingGoal(null)}
        onConfirm={handleDeleteGoal}
        title="Xóa mục tiêu"
        message={`Bạn có chắc muốn xóa mục tiêu "${deletingGoal?.name}"? Hành động này không thể hoàn tác.`}
      />
    </div>
  );
};

export default Goals;
