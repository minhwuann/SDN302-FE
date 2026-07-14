/**
 * aiApi - Trợ lý AI qua BE (/api/v1/ai). BE tự giữ Gemini API key, tự rate-limit,
 * tự audit log, và tự suy luận số tiền/ngày/danh mục từ dữ liệu thật của user -
 * thay cho việc FE gọi thẳng Gemini bằng key BYOK của user như trước.
 */
import apiClient from "./apiClient";

/** Phân tích 1 đoạn text -> preview giao dịch (không lưu). Trả { preview, previews, missingFields, clarification }. */
export const getTransactionPreview = (payload) =>
  apiClient.post("/ai/transaction-preview", payload);

/** Thực thi 1 action đã xác nhận (vd tạo giao dịch) trong tập lệnh đóng của BE. */
export const executeAction = (action, payload) =>
  apiClient.post("/ai/execute-action", { action, payload });

/** Chat hỏi-đáp tài chính, BE tự chấm dứt điểm ý định + gọi tool nội bộ khi cần. */
export const chat = (payload) => apiClient.post("/ai/chat", payload);

/** Quét ảnh hoá đơn/chuyển khoản -> preview giao dịch (không lưu). */
export const scanReceipt = (payload) => apiClient.post("/ai/receipt-scan", payload);

/** Danh sách hội thoại AI đã lưu của user, mới nhất trước. */
export const listConversations = async () => {
  const data = await apiClient.get("/ai/conversations");
  return data.conversations || [];
};

/** Lịch sử tin nhắn của 1 hội thoại. */
export const listConversationMessages = async (conversationId) => {
  const data = await apiClient.get(`/ai/conversations/${conversationId}/messages`);
  return data.messages || [];
};
