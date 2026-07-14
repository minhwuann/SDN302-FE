/**
 * notificationApi - Hộp thông báo trong app. BE: /api/v1/notifications
 * Thông báo do BE tự sinh (nhắc ngân sách vượt ngưỡng, nợ đến/quá hạn,
 * nhắc ghi chép hàng ngày, hoàn thành mục tiêu) - FE chỉ đọc + đánh dấu đã đọc.
 */
import apiClient from "./apiClient";

/** Lấy danh sách thông báo, phân trang. */
export const listNotifications = async ({
  unreadOnly,
  page,
  pageSize,
} = {}) => {
  const data = await apiClient.get("/notifications", {
    query: {
      ...(unreadOnly ? { unreadOnly: true } : {}),
      ...(page ? { page } : {}),
      ...(pageSize ? { pageSize } : {}),
    },
  });
  return {
    notifications: data.notifications || [],
    pagination: data.pagination,
  };
};

/** Đánh dấu 1 thông báo đã đọc (idempotent ở BE). */
export const markNotificationRead = async (id) => {
  const data = await apiClient.patch(`/notifications/${id}/read`);
  return data.notification;
};
