import { useMemo, useState, useEffect } from "react";
import * as analyticsApi from "../../../services/analyticsApi";
import {
  TOP_CATEGORIES_COUNT,
  EXPENSE_COLORS,
  INCOME_COLORS,
  EXPENSE_DARK_COLORS,
  INCOME_DARK_COLORS,
  OTHER_COLOR,
  OTHER_COLOR_DARK,
} from "./constants";

// BE giới hạn tối đa 20 danh mục/lần gọi - đủ dư so với TOP_CATEGORIES_COUNT (5)
// để gom phần còn lại vào "Khác" giống hệt logic cũ tính từ transactions thô.
const FETCH_LIMIT = 20;

/**
 * Hook lấy dữ liệu cơ cấu danh mục từ BE (/analytics/category-breakdown)
 * và gom Top 5 + "Khác" giống hệt logic hiển thị trước đây.
 *
 * @param {string} ledgerId
 * @param {string} [dateFrom] - "yyyy-MM-dd"
 * @param {string} [dateTo] - "yyyy-MM-dd"
 */
export const usePieChartData = (ledgerId, dateFrom, dateTo) => {
  const [selectedType, setSelectedType] = useState("expense");
  const [isDark, setIsDark] = useState(false);
  const [categories, setCategories] = useState([]);

  /**
   * Theo dõi dark mode để điều chỉnh màu sắc
   */
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    // Theo dõi thay đổi dark mode
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  /** Tải cơ cấu danh mục từ BE mỗi khi đổi sổ/khoảng ngày/loại (thu-chi). */
  useEffect(() => {
    if (!ledgerId) return undefined;
    let active = true;
    analyticsApi
      .getCategoryBreakdown({
        ledgerId,
        dateFrom,
        dateTo,
        type: selectedType,
        limit: FETCH_LIMIT,
      })
      .then((data) => {
        if (active) setCategories(data);
      })
      .catch((err) => {
        console.error("Lỗi khi tải cơ cấu danh mục:", err);
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, [ledgerId, dateFrom, dateTo, selectedType]);

  /**
   * Gom Top 5 danh mục (đã sắp xếp giảm dần từ BE) + "Khác" cho phần còn lại.
   */
  const chartData = useMemo(() => {
    if (categories.length === 0) return [];

    const data = categories.map((c) => ({
      name: c.categoryName || "Khác",
      value: c.totalAmountVnd,
      percentage: c.percentage,
    }));

    const topCategories = data.slice(0, TOP_CATEGORIES_COUNT);
    const remainingCategories = data.slice(TOP_CATEGORIES_COUNT);

    const otherValue = remainingCategories.reduce(
      (sum, item) => sum + item.value,
      0
    );
    const otherPercentage = remainingCategories.reduce(
      (sum, item) => sum + item.percentage,
      0
    );

    const otherIndex = topCategories.findIndex((item) => item.name === "Khác");
    const result = [...topCategories];

    if (otherValue > 0) {
      if (otherIndex !== -1) {
        result[otherIndex].value += otherValue;
        result[otherIndex].percentage += otherPercentage;
        result[otherIndex].isGrouped = true;
      } else {
        result.push({
          name: "Khác",
          value: otherValue,
          percentage: otherPercentage,
          isGrouped: true,
        });
      }
    }

    return result;
  }, [categories]);

  /**
   * Chọn bảng màu dựa trên loại giao dịch và dark mode
   */
  const colors = useMemo(() => {
    if (selectedType === "income") {
      return isDark ? INCOME_DARK_COLORS : INCOME_COLORS;
    }
    return isDark ? EXPENSE_DARK_COLORS : EXPENSE_COLORS;
  }, [selectedType, isDark]);

  const otherColor = isDark ? OTHER_COLOR_DARK : OTHER_COLOR;

  /**
   * Tiêu đề Card dựa trên loại giao dịch
   */
  const cardTitle =
    selectedType === "income" ? "Cơ Cấu Thu Nhập" : "Cơ Cấu Chi Tiêu";

  return {
    selectedType,
    setSelectedType,
    chartData,
    colors,
    otherColor,
    cardTitle,
  };
};
