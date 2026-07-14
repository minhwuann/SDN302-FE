/**
 * analyticsApi - Số liệu thống kê đã tổng hợp sẵn ở BE (SQL aggregation).
 * BE: /api/v1/analytics/*. Dùng thay cho việc tự tính từ toàn bộ transactions ở client.
 */
import { format } from "date-fns";
import apiClient from "./apiClient";

/** Chuẩn hoá Date -> "yyyy-MM-dd" (BE yêu cầu đúng định dạng này). */
export const toApiDate = (date) => (date ? format(date, "yyyy-MM-dd") : undefined);

/** Thẻ tổng quan: tổng thu/chi/chênh lệch/số giao dịch trong khoảng thời gian. */
export const getOverview = async ({ ledgerId, dateFrom, dateTo }) => {
  const data = await apiClient.get("/analytics/overview", {
    query: { ledgerId, dateFrom, dateTo },
  });
  return data.overview;
};

/** Cơ cấu thu/chi theo danh mục (đã tính sẵn phần trăm trên tổng thật, không chỉ trên top trả về). */
export const getCategoryBreakdown = async ({
  ledgerId,
  dateFrom,
  dateTo,
  type,
  limit,
}) => {
  const data = await apiClient.get("/analytics/category-breakdown", {
    query: { ledgerId, dateFrom, dateTo, type, limit },
  });
  return data.categories || [];
};

/** Chi tiêu theo từng ngày (chỉ expense) trong khoảng thời gian. */
export const getDailySpending = async ({ ledgerId, dateFrom, dateTo }) => {
  const data = await apiClient.get("/analytics/daily-spending", {
    query: { ledgerId, dateFrom, dateTo },
  });
  return data.days || [];
};

/** Thu/chi/chênh lệch theo từng tháng trong khoảng thời gian. */
export const getMonthlyTrend = async ({ ledgerId, dateFrom, dateTo }) => {
  const data = await apiClient.get("/analytics/monthly-trend", {
    query: { ledgerId, dateFrom, dateTo },
  });
  return data.months || [];
};

/** Biến động chi tiêu so với ngày trước đó (chỉ expense). */
export const getFluctuation = async ({ ledgerId, dateFrom, dateTo }) => {
  const data = await apiClient.get("/analytics/fluctuation", {
    query: { ledgerId, dateFrom, dateTo },
  });
  return data.points || [];
};
