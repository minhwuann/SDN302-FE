/**
 * debtsService - Khoản nợ (vay/cho vay). BE: /api/v1/debts
 *
 * Map field:
 *   FE type 'borrow' <-> BE direction 'borrowed'
 *   FE type 'lend'   <-> BE direction 'lent'
 *   personName <-> counterpartyName, amount <-> amountVnd,
 *   remainingAmount <-> remainingAmountVnd, reason <-> note
 */
import apiClient from "./apiClient";

const toDirection = (type) => (type === "lend" ? "lent" : "borrowed");
const toType = (direction) => (direction === "lent" ? "lend" : "borrow");
const today = () => new Date().toISOString().slice(0, 10);

function mapDebt(d) {
  if (!d) return null;
  return {
    ...d,
    type: toType(d.direction),
    personName: d.counterpartyName,
    amount: Number(d.amountVnd ?? 0),
    remainingAmount: Number(d.remainingAmountVnd ?? 0),
    reason: d.note || "",
    dueDate: d.dueDate || null,
  };
}

export const getDebts = async (ledgerId, status) => {
  const data = await apiClient.get("/debts", {
    query: { ledgerId, ...(status ? { status } : {}) },
  });
  return (data.debts || []).map(mapDebt);
};

export const createDebt = async (ledgerId, debtData) => {
  const payload = {
    ledgerId,
    direction: toDirection(debtData.type),
    counterpartyName: debtData.personName,
    amountVnd: Math.round(Number(debtData.amount)),
    dueDate: debtData.dueDate || null,
    note: debtData.reason || null,
  };
  const data = await apiClient.post("/debts", payload);
  return mapDebt(data.debt);
};

export const updateDebt = async (debtId, updates) => {
  const payload = {};
  if (updates.type !== undefined) payload.direction = toDirection(updates.type);
  if (updates.personName !== undefined)
    payload.counterpartyName = updates.personName;
  if (updates.amount !== undefined)
    payload.amountVnd = Math.round(Number(updates.amount));
  if (updates.remainingAmount !== undefined)
    payload.remainingAmountVnd = Math.round(Number(updates.remainingAmount));
  if (updates.reason !== undefined) payload.note = updates.reason || null;
  if (updates.dueDate !== undefined) payload.dueDate = updates.dueDate || null;
  if (updates.status !== undefined) payload.status = updates.status;
  const data = await apiClient.patch(`/debts/${debtId}`, payload);
  return mapDebt(data.debt);
};

/** Ghi nhận một lần thanh toán nợ. */
export const payDebt = async (debtId, amount, paidAt, note) => {
  const data = await apiClient.post(`/debts/${debtId}/payments`, {
    amountVnd: Math.round(Number(amount)),
    paidAt: paidAt || today(),
    ...(note ? { note } : {}),
  });
  return { payment: data.payment, debt: mapDebt(data.debt) };
};

export const deleteDebt = async (debtId) => {
  const data = await apiClient.delete(`/debts/${debtId}`);
  return mapDebt(data.debt);
};

/** Đánh dấu quá hạn ở client (BE cũng có thể tính, đây chỉ là hiển thị). */
export const checkOverdueDebts = (debts) => {
  const t = today();
  return debts.map((debt) =>
    debt.status === "active" && debt.dueDate && debt.dueDate < t
      ? { ...debt, status: "overdue" }
      : debt
  );
};
