/**
 * paymentAccountApi - Tài khoản thanh toán (ngân hàng/ví/tiền mặt).
 * BE: /api/v1/payment-accounts (BE tự seed tài khoản hệ thống mặc định cho
 * mỗi user; ngoài ra user có thể tự thêm/sửa/xoá tài khoản của riêng mình).
 */
import apiClient from "./apiClient";

/** @returns {Promise<Array<{id,name,shortName,type,color}>>} */
export const listPaymentAccounts = async () => {
  const data = await apiClient.get("/payment-accounts");
  return data.paymentAccounts || [];
};

/** Tạo tài khoản thanh toán mới. payload: {name, shortName?, type, color?} */
export const createPaymentAccount = async (payload) => {
  const data = await apiClient.post("/payment-accounts", payload);
  return data.paymentAccount;
};

/** Cập nhật tài khoản thanh toán. updates: {name?, shortName?, color?} */
export const updatePaymentAccount = async (id, updates) => {
  const data = await apiClient.patch(`/payment-accounts/${id}`, updates);
  return data.paymentAccount;
};

/** Xoá mềm tài khoản thanh toán (không áp dụng cho tài khoản hệ thống). */
export const deletePaymentAccount = async (id) => {
  const data = await apiClient.delete(`/payment-accounts/${id}`);
  return data.paymentAccount;
};
