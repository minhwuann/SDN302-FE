import { useState, useMemo } from "react";
import { format } from "date-fns";

/**
 * Hook quản lý state dateRange cho trang Statistics.
 * Các số liệu/chart giờ lấy trực tiếp từ BE (/analytics/*) theo dateRange này,
 * hook không còn tự lọc transactions ở client.
 *
 * @returns {Object} Object chứa state dateRange
 * @returns {Object|null} returns.dateRange - Khoảng thời gian đã chọn { from: Date, to: Date }
 * @returns {Function} returns.setDateRange - Hàm set state cho dateRange
 * @returns {string} returns.dateRangeText - Text tóm tắt khoảng thời gian đang xem
 */
export const useStatisticsFilter = () => {
  const [dateRange, setDateRange] = useState(null);

  /**
   * Format text tóm tắt khoảng thời gian
   * Hiển thị dạng "Dữ liệu từ dd/MM/yyyy đến dd/MM/yyyy"
   */
  const dateRangeText = useMemo(() => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      return "";
    }
    return `Dữ liệu từ ${format(dateRange.from, "dd/MM/yyyy")} đến ${format(
      dateRange.to,
      "dd/MM/yyyy"
    )}`;
  }, [dateRange]);

  return {
    dateRange,
    setDateRange,
    dateRangeText,
  };
};

