import { useMemo, useState, useEffect } from "react";
import {
  format,
  parseISO,
  eachDayOfInterval,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from "date-fns";
import * as analyticsApi from "../../../services/analyticsApi";
import {
  DAYS_TO_WEEK_THRESHOLD,
  DAYS_TO_MONTH_THRESHOLD,
  BAR_COLOR_LIGHT,
  BAR_COLOR_DARK,
  GRID_COLOR_LIGHT,
  GRID_COLOR_DARK,
  TICK_COLOR_LIGHT,
  TICK_COLOR_DARK,
  STROKE_COLOR_LIGHT,
  STROKE_COLOR_DARK,
} from "./constants";

/**
 * Hook lấy chi tiêu theo ngày từ BE (/analytics/daily-spending, đã SUM sẵn)
 * rồi tự gom nhóm ngày/tuần/tháng để hiển thị (logic gom nhóm + lấp khoảng
 * trống bằng 0 vẫn giữ nguyên như trước, chỉ khác nguồn dữ liệu đầu vào).
 *
 * @param {string} ledgerId
 * @param {Object|null} dateRange - Khoảng thời gian { from: Date, to: Date }
 */
export const useDailyChartData = (ledgerId, dateRange) => {
  const [isDark, setIsDark] = useState(false);
  const [days, setDays] = useState([]);

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

  /** Tải chi tiêu theo ngày từ BE mỗi khi đổi sổ/khoảng ngày. */
  useEffect(() => {
    if (!ledgerId) return undefined;
    let active = true;
    analyticsApi
      .getDailySpending({
        ledgerId,
        dateFrom: dateRange ? analyticsApi.toApiDate(dateRange.from) : undefined,
        dateTo: dateRange ? analyticsApi.toApiDate(dateRange.to) : undefined,
      })
      .then((data) => {
        if (active) setDays(data);
      })
      .catch((err) => {
        console.error("Lỗi khi tải chi tiêu theo ngày:", err);
        if (active) setDays([]);
      });
    return () => {
      active = false;
    };
  }, [ledgerId, dateRange]);

  /**
   * Tính toán dữ liệu chi tiêu với tự động gom nhóm
   * Logic: Xác định khoảng thời gian -> Quyết định cách gom nhóm -> Nhóm dữ liệu
   */
  const chartData = useMemo(() => {
    if (!days || days.length === 0) {
      return [];
    }

    // Xác định khoảng thời gian và chuẩn hóa
    let from, to;
    if (dateRange && dateRange.from && dateRange.to) {
      from = startOfDay(dateRange.from);
      to = endOfDay(dateRange.to);
    } else {
      const dates = days.map((d) => parseISO(d.date));
      from = startOfDay(new Date(Math.min(...dates)));
      to = endOfDay(new Date(Math.max(...dates)));
    }

    // Đảm bảo from <= to
    if (from > to) {
      [from, to] = [to, from];
    }

    // Tính số ngày trong khoảng thời gian
    const daysDiff = Math.abs(differenceInDays(to, from));

    // Quyết định cách gom nhóm dựa trên khoảng thời gian
    let groupType = "day"; // day, week, month
    if (daysDiff > DAYS_TO_MONTH_THRESHOLD) {
      groupType = "month";
    } else if (daysDiff > DAYS_TO_WEEK_THRESHOLD) {
      groupType = "week";
    }

    // Map ngày (yyyy-MM-dd) -> tổng chi tiêu đã tổng hợp sẵn từ BE
    const totalsByDate = new Map(days.map((d) => [d.date, d.totalExpenseVnd]));

    const sumBetween = (start, end) => {
      let total = 0;
      totalsByDate.forEach((amount, dateStr) => {
        const d = parseISO(dateStr);
        if (d >= start && d <= end) total += amount;
      });
      return total;
    };

    // Gom nhóm theo loại đã chọn
    if (groupType === "month") {
      const months = eachMonthOfInterval({ start: from, end: to });
      return months.map((month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);

        return {
          date: format(month, "MM/yyyy"),
          fullDate: `Tháng ${format(month, "MM/yyyy")}`,
          value: sumBetween(monthStart, monthEnd),
          period: "month",
        };
      });
    } else if (groupType === "week") {
      const weeks = eachWeekOfInterval(
        { start: from, end: to },
        { weekStartsOn: 1 } // Tuần bắt đầu từ thứ 2
      );
      return weeks.map((week) => {
        const weekStart = startOfWeek(week, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(week, { weekStartsOn: 1 });

        // Đảm bảo không vượt quá khoảng thời gian đã chọn
        const actualStart = weekStart < from ? from : weekStart;
        const actualEnd = weekEnd > to ? to : weekEnd;

        return {
          date: `${format(actualStart, "dd/MM")} - ${format(actualEnd, "dd/MM")}`,
          fullDate: `Tuần ${format(actualStart, "dd/MM")} - ${format(actualEnd, "dd/MM/yyyy")}`,
          value: sumBetween(actualStart, actualEnd),
          period: "week",
        };
      });
    } else {
      // Gom theo ngày (mặc định)
      const daysList = eachDayOfInterval({ start: from, end: to });
      return daysList.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");

        return {
          date: format(day, "dd/MM"),
          fullDate: format(day, "dd/MM/yyyy"),
          value: totalsByDate.get(dayStr) || 0,
          period: "day",
        };
      });
    }
  }, [days, dateRange]);

  /**
   * Xác định tiêu đề biểu đồ dựa trên period
   */
  const chartTitle = useMemo(() => {
    if (chartData.length === 0) return "Chi Tiêu Theo Ngày";
    const period = chartData[0]?.period;
    if (period === "month") return "Chi Tiêu Theo Tháng";
    if (period === "week") return "Chi Tiêu Theo Tuần";
    return "Chi Tiêu Theo Ngày";
  }, [chartData]);

  /**
   * Object chứa các màu sắc cho biểu đồ dựa trên dark mode
   */
  const chartStyles = useMemo(
    () => ({
      barColor: isDark ? BAR_COLOR_DARK : BAR_COLOR_LIGHT,
      gridColor: isDark ? GRID_COLOR_DARK : GRID_COLOR_LIGHT,
      tickColor: isDark ? TICK_COLOR_DARK : TICK_COLOR_LIGHT,
      strokeColor: isDark ? STROKE_COLOR_DARK : STROKE_COLOR_LIGHT,
    }),
    [isDark]
  );

  return {
    chartData,
    chartTitle,
    isDark,
    chartStyles,
  };
};
