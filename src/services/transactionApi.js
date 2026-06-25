/**
 * transactionApi - Giao dịch thu/chi. BE: /api/v1/transactions
 *
 * BE dùng các field: amountVnd, categoryId/subcategoryId (UUID),
 * transactionDate, paymentAccountId. FE (form & UI) dùng:
 * amount, category ("Cha > Con"), date, bankName.
 * Module này cung cấp cả API thô lẫn helper chuyển đổi qua lại.
 */
import apiClient from "./apiClient";

/* --------------------------------- API thô -------------------------------- */

export const listTransactions = (params) =>
  apiClient.get("/transactions", { query: params });

export const getSummary = async (params) => {
  const data = await apiClient.get("/transactions/summary", { query: params });
  return data.summary;
};

export const getCalendar = async (params) => {
  const data = await apiClient.get("/transactions/calendar", { query: params });
  return data.calendar;
};

export const createTransaction = async (payload) => {
  const data = await apiClient.post("/transactions", payload);
  return data.transaction;
};

export const updateTransaction = async (id, payload) => {
  const data = await apiClient.patch(`/transactions/${id}`, payload);
  return data.transaction;
};

export const deleteTransaction = async (id) => {
  const data = await apiClient.delete(`/transactions/${id}`);
  return data.transaction;
};

export const bulkCreate = async (transactions) => {
  const data = await apiClient.post("/transactions/bulk", { transactions });
  return data.transactions;
};

/* ------------------------------- Chuyển đổi ------------------------------- */

/**
 * BE transaction -> shape mà UI FE đang dùng.
 * @param {Object} tx - transaction từ BE
 * @param {Map<string,Object>} accountsById - map paymentAccountId -> account
 */
export function mapTxFromApi(tx, accountsById) {
  if (!tx) return null;
  const account = tx.paymentAccountId
    ? accountsById?.get(tx.paymentAccountId)
    : null;

  // Ghép tên danh mục dạng "Cha > Con" để form sửa có thể tách lại
  const category = tx.subcategoryNameSnapshot
    ? `${tx.categoryNameSnapshot} > ${tx.subcategoryNameSnapshot}`
    : tx.categoryNameSnapshot || "";

  return {
    id: tx.id,
    ledgerId: tx.ledgerId,
    type: tx.type,
    amount: tx.amountVnd,
    category,
    categoryId: tx.categoryId,
    subcategoryId: tx.subcategoryId,
    date: tx.transactionDate,
    note: tx.note || "",
    paymentMethod: tx.paymentMethod,
    paymentAccountId: tx.paymentAccountId || null,
    bankName: account ? account.name : null,
    source: tx.source,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
  };
}

/**
 * Form FE -> payload tạo/sửa giao dịch của BE.
 * @param {Object} form - { date, type, category, amount, note, paymentMethod, bankName }
 * @param {Object} ctx
 * @param {string} ctx.ledgerId
 * @param {(type:string, path:string) => {categoryId:?string, subcategoryId:?string}} ctx.resolveCategory
 * @param {(name:string) => ?string} ctx.resolveAccountId
 * @param {boolean} [ctx.partial] - chỉ map các field có mặt (cho update)
 */
export function mapTxToApi(form, ctx) {
  const { ledgerId, resolveCategory, resolveAccountId, partial = false } = ctx;
  const payload = {};

  if (!partial) payload.ledgerId = ledgerId;
  if (form.type !== undefined) payload.type = form.type;
  if (form.amount !== undefined) payload.amountVnd = Math.round(Number(form.amount));
  if (form.date !== undefined) payload.transactionDate = form.date;
  if (form.note !== undefined) payload.note = form.note || "";
  if (form.paymentMethod !== undefined) payload.paymentMethod = form.paymentMethod;

  // Danh mục: cần type để tra cứu đúng cây income/expense
  if (form.category !== undefined) {
    const type = form.type || "expense";
    const resolved = resolveCategory(type, form.category) || {};
    if (resolved.categoryId) payload.categoryId = resolved.categoryId;
    payload.subcategoryId = resolved.subcategoryId || null;
  }

  // Tài khoản thanh toán
  if (form.paymentMethod === "transfer") {
    payload.paymentAccountId = form.bankName
      ? resolveAccountId(form.bankName)
      : null;
  } else if (form.paymentMethod === "cash") {
    payload.paymentAccountId = null;
  }

  return payload;
}
