/**
 * goalService - Mục tiêu tiết kiệm. BE: /api/v1/goals
 * Map field BE (targetAmountVnd/currentAmountVnd) <-> FE (targetAmount/currentAmount).
 */
import apiClient from "./apiClient";

/** BE goal -> shape FE đang dùng. */
function mapGoal(g) {
  if (!g) return null;
  return {
    ...g,
    targetAmount: Number(g.targetAmountVnd ?? 0),
    currentAmount: Number(g.currentAmountVnd ?? 0),
    deadline: g.deadline || null,
  };
}

export const getGoals = async (ledgerId, status) => {
  const data = await apiClient.get("/goals", {
    query: { ledgerId, ...(status ? { status } : {}) },
  });
  return (data.goals || []).map(mapGoal);
};

export const createGoal = async (ledgerId, goalData) => {
  const payload = {
    ledgerId,
    name: goalData.name,
    targetAmountVnd: Math.round(Number(goalData.targetAmount)),
    ...(goalData.currentAmount
      ? { currentAmountVnd: Math.round(Number(goalData.currentAmount)) }
      : {}),
    deadline: goalData.deadline || null,
    icon: goalData.icon || null,
    color: goalData.color || null,
  };
  const data = await apiClient.post("/goals", payload);
  return mapGoal(data.goal);
};

export const updateGoal = async (goalId, updates) => {
  const payload = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.targetAmount !== undefined)
    payload.targetAmountVnd = Math.round(Number(updates.targetAmount));
  if (updates.currentAmount !== undefined)
    payload.currentAmountVnd = Math.round(Number(updates.currentAmount));
  if (updates.deadline !== undefined) payload.deadline = updates.deadline || null;
  if (updates.icon !== undefined) payload.icon = updates.icon;
  if (updates.color !== undefined) payload.color = updates.color;
  if (updates.status !== undefined) payload.status = updates.status;
  const data = await apiClient.patch(`/goals/${goalId}`, payload);
  return mapGoal(data.goal);
};

/** Nạp tiền vào mục tiêu (BE tự đánh dấu hoàn thành khi đạt target). */
export const addMoneyToGoal = async (goalId, amount) => {
  const data = await apiClient.post(`/goals/${goalId}/deposits`, {
    amountVnd: Math.round(Number(amount)),
  });
  return mapGoal(data.goal);
};

export const deleteGoal = async (goalId) => {
  const data = await apiClient.delete(`/goals/${goalId}`);
  return mapGoal(data.goal);
};

/** Icon mặc định cho mục tiêu */
export const DEFAULT_GOAL_ICONS = [
  "🎯", "📱", "💻", "🏠", "🚗", "✈️", "🎓", "💍",
  "👶", "🏥", "🎸", "📸", "🎮", "👗", "⌚", "🎁",
];

/** Màu mặc định cho mục tiêu */
export const DEFAULT_GOAL_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];
