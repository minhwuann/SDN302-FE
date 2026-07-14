import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
} from "date-fns";
import { vi } from "date-fns/locale";
import * as analyticsApi from "../../services/analyticsApi";
import { useTransactionsContext } from "../../contexts/TransactionsContext";

// Format tiền VND - không dùng style:currency để tránh hiển thị "đ"
const formatCurrency = (value) => {
  if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + " tỷ";
  }
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + " tr";
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + " N";
  }
  return new Intl.NumberFormat("vi-VN").format(value) + " VND";
};

// Format tiền VND đầy đủ cho tooltip
const formatFullCurrency = (value) =>
  new Intl.NumberFormat("vi-VN").format(value) + " VND";

/**
 * Custom Tooltip Component - Định nghĩa bên ngoài để tránh re-render
 */
const CustomTooltipContent = ({ active, payload, label, viewMode }) => {
  if (active && payload && payload.length) {
    const income = payload.find((p) => p.dataKey === "Thu nhập")?.value || 0;
    const expense = payload.find((p) => p.dataKey === "Chi tiêu")?.value || 0;
    const balance = income - expense;

    return (
      <div className="bg-content1 p-3 rounded-[10px] shadow-md border border-divider">
        <p className="font-semibold text-slate-700 dark:text-white mb-2">
          {viewMode === "daily" ? `Ngày ${label}` : label}
        </p>
        <div className="space-y-1 text-sm">
          <p className="text-green-600">
            Thu nhập: {formatFullCurrency(income)}
          </p>
          <p className="text-red-500">
            Chi tiêu: {formatFullCurrency(expense)}
          </p>
          <hr className="border-slate-200 dark:border-slate-600 my-1" />
          <p
            className={`font-semibold ${
              balance >= 0 ? "text-blue-600" : "text-orange-500"
            }`}
          >
            Còn lại: {formatFullCurrency(balance)}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * Biểu đồ Biến động Thu Chi
 * Hiển thị so sánh thu nhập vs chi tiêu theo từng ngày (tháng hiện tại)
 * hoặc theo tháng (6 tháng gần nhất).
 * Theo tháng: nguồn /analytics/monthly-trend (SUM sẵn ở BE).
 * Theo ngày: BE không có endpoint thu+chi theo ngày, nên tự tính từ
 * transactions đã tải sẵn ở client (TransactionsContext).
 * @param {string} ledgerId
 * @param {string} viewMode - 'daily' hoặc 'monthly'
 */
const FluctuationChart = ({ ledgerId, viewMode = "daily" }) => {
  const { transactions } = useTransactionsContext();
  const [monthlyTrend, setMonthlyTrend] = useState([]);

  // Tải xu hướng theo tháng (6 tháng gần nhất)
  useEffect(() => {
    if (!ledgerId) return undefined;
    let active = true;
    const now = new Date();
    analyticsApi
      .getMonthlyTrend({
        ledgerId,
        dateFrom: analyticsApi.toApiDate(startOfMonth(subMonths(now, 5))),
        dateTo: analyticsApi.toApiDate(endOfMonth(now)),
      })
      .then((data) => {
        if (active) setMonthlyTrend(data);
      })
      .catch((err) => {
        console.error("Lỗi khi tải biến động theo tháng:", err);
        if (active) setMonthlyTrend([]);
      });
    return () => {
      active = false;
    };
  }, [ledgerId]);

  // Gộp dữ liệu theo ngày trong tháng hiện tại (từ transactions đã tải sẵn), lấp khoảng trống bằng 0
  const dailyData = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const days = eachDayOfInterval({ start, end });

    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayTransactions = transactions.filter((tx) => tx.date === dayStr);

      const income = dayTransactions
        .filter((tx) => tx.type === "income")
        .reduce((sum, tx) => sum + tx.amount, 0);
      const expense = dayTransactions
        .filter((tx) => tx.type === "expense")
        .reduce((sum, tx) => sum + tx.amount, 0);

      return {
        date: format(day, "dd", { locale: vi }),
        fullDate: dayStr,
        "Thu nhập": income,
        "Chi tiêu": expense,
        balance: income - expense,
      };
    });
  }, [transactions]);

  // Gộp dữ liệu theo tháng (6 tháng gần nhất), lấp khoảng trống bằng 0
  const monthlyData = useMemo(() => {
    const now = new Date();
    const byMonthKey = new Map(
      monthlyTrend.map((m) => [m.month.slice(0, 7), m])
    );
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthKey = format(monthDate, "yyyy-MM");
      const row = byMonthKey.get(monthKey);

      months.push({
        date: format(monthDate, "T.MM", { locale: vi }),
        fullDate: monthKey,
        "Thu nhập": row?.totalIncomeVnd || 0,
        "Chi tiêu": row?.totalExpenseVnd || 0,
        balance: row?.balanceVnd || 0,
      });
    }

    return months;
  }, [monthlyTrend]);

  const data = viewMode === "daily" ? dailyData : monthlyData;

  // Wrapper để truyền viewMode vào CustomTooltip
  const renderTooltip = useCallback(
    (props) => <CustomTooltipContent {...props} viewMode={viewMode} />,
    [viewMode]
  );

  return (
    <div className="w-full h-80">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={100}
        minHeight={200}
      >
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#cbd5e1" }}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#cbd5e1" }}
            width={70}
          />
          <Tooltip content={renderTooltip} />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            formatter={(value) => (
              <span className="text-slate-600 dark:text-slate-300">
                {value}
              </span>
            )}
          />
          <Bar
            dataKey="Thu nhập"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="Chi tiêu"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FluctuationChart;
