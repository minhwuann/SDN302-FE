/**
 * shoppingApi - Kế hoạch & món mua sắm. BE: /api/v1/shopping-plans, /shopping-items
 *
 * BE chuẩn hoá plan/items thành tài nguyên riêng (FE cũ nhúng items trong plan).
 * Map budgetAmountVnd<->budget, estimatedPriceVnd<->price.
 */
import apiClient from "./apiClient";

const mapItem = (i) => ({
  id: i.id,
  name: i.name,
  price: Number(i.estimatedPriceVnd ?? 0),
  quantity: Number(i.quantity ?? 1),
  isBought: Boolean(i.isBought),
  linkedTransactionId: i.linkedTransactionId || null,
});

const mapPlanSummary = (p) => ({
  ...p,
  budget: Number(p.budgetAmountVnd ?? 0),
  estimatedTotal: Number(p.estimatedTotalVnd ?? 0),
  boughtTotal: Number(p.boughtTotalVnd ?? 0),
  itemCount: Number(p.itemCount ?? 0),
  boughtCount: Number(p.boughtCount ?? 0),
});

/** Danh sách plan (kèm tổng hợp số liệu). */
export const listPlans = async (ledgerId) => {
  const data = await apiClient.get("/shopping-plans", { query: { ledgerId } });
  return (data.shoppingPlans || []).map(mapPlanSummary);
};

/** Chi tiết plan kèm items (đã map về shape FE). */
export const getPlan = async (planId) => {
  const data = await apiClient.get(`/shopping-plans/${planId}`);
  return {
    ...mapPlanSummary(data.shoppingPlan),
    items: (data.items || []).map(mapItem),
  };
};

export const createPlan = async (ledgerId, name, budget) => {
  const data = await apiClient.post("/shopping-plans", {
    ledgerId,
    name,
    budgetAmountVnd: Math.round(Number(budget) || 0),
  });
  return mapPlanSummary(data.shoppingPlan);
};

export const deletePlan = (planId) =>
  apiClient.delete(`/shopping-plans/${planId}`);

export const addItem = async (planId, name, price) => {
  const data = await apiClient.post(`/shopping-plans/${planId}/items`, {
    name,
    quantity: 1,
    estimatedPriceVnd: Math.round(Number(price) || 0),
  });
  return mapItem(data.shoppingItem);
};

export const updateItem = async (itemId, updates) => {
  const payload = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.price !== undefined)
    payload.estimatedPriceVnd = Math.round(Number(updates.price) || 0);
  if (updates.quantity !== undefined) payload.quantity = updates.quantity;
  if (updates.isBought !== undefined) payload.isBought = updates.isBought;
  const data = await apiClient.patch(`/shopping-items/${itemId}`, payload);
  return mapItem(data.shoppingItem);
};

export const deleteItem = (itemId) =>
  apiClient.delete(`/shopping-items/${itemId}`);
