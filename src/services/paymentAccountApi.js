/**
 * paymentAccountApi - Tài khoản thanh toán (ngân hàng/ví/tiền mặt).
 * BE: /api/v1/payment-accounts (chỉ đọc; BE tự seed mặc định cho mỗi user)
 */
import apiClient from "./apiClient";

/** @returns {Promise<Array<{id,name,shortName,type,color}>>} */
export const listPaymentAccounts = async () => {
  const data = await apiClient.get("/payment-accounts");
  return data.paymentAccounts || [];
};
