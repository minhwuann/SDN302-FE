/**
 * budgetApi - Ngân sách tháng. BE: /api/v1/budgets
 * BE yêu cầu ledgerId + month (YYYY-MM) khi list, categoryId (UUID) khi tạo.
 */
import apiClient from "./apiClient";

/** BE budget -> shape FE đang dùng (category theo tên, limit, spent). */
export function mapBudget(b) {
  if (!b) return null;
  return {
    ...b,
    category: b.categoryName || "Tổng",
    limit: Number(b.limitAmountVnd ?? 0),
    spent: Number(b.spentAmountVnd ?? 0),
  };
}

export const listBudgets = async (ledgerId, month) => {
  const data = await apiClient.get("/budgets", { query: { ledgerId, month } });
  return (data.budgets || []).map(mapBudget);
};

export const createBudget = async (payload) => {
  const data = await apiClient.post("/budgets", payload);
  return mapBudget(data.budget);
};

export const updateBudget = async (id, payload) => {
  const data = await apiClient.patch(`/budgets/${id}`, payload);
  return mapBudget(data.budget);
};

export const deleteBudget = async (id) => {
  const data = await apiClient.delete(`/budgets/${id}`);
  return data.budget;
};
