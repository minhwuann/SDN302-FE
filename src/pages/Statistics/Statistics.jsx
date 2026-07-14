import { useEffect, useMemo, useState } from "react";
import OverviewPieChart from "../../components/Charts/OverviewPieChart/OverviewPieChart";
import DailySpendChart from "../../components/Charts/DailySpendChart/DailySpendChart";
import FluctuationChart from "../../components/Charts/FluctuationChart";
import DateFilterBar from "../../components/DateFilterBar";
import RefreshButton from "../../components/RefreshButton";
import ThemeButton from "../../components/ThemeButton";
import { useTransactionsContext } from "../../contexts/TransactionsContext";
import { useStatisticsFilter } from "./useStatisticsFilter";
import TrendLineChart from "../../components/Charts/TrendLineChart/TrendLineChart";
import { Card, CardBody, CardHeader, ButtonGroup, Button } from "@heroui/react";
import * as analyticsApi from "../../services/analyticsApi";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  PieChart,
  Activity,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency";

/**
 * Component Summary Stats Card
 */
const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  textColor = "text-gray-900 dark:text-white",
  iconColor = "text-gray-500",
}) => (
  <Card className="bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-sm backdrop-blur-md">
    <CardBody className="p-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          {Icon && <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={2.5} />}
        </div>
        <div>
          <p className={`text-3xl font-bold ${textColor}`}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-1 text-xs font-medium">
              {trend === "up" ? (
                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-rose-500" />
              )}
              <span className={trend === "up" ? "text-emerald-500" : "text-rose-500"}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
      </div>
    </CardBody>
  </Card>
);

/**
 * Component trang Thống Kê
 * Hiển thị các biểu đồ phân tích thu chi
 */
function Statistics() {
  const { isLoading, currentLedger } = useTransactionsContext();
  const { dateRange, setDateRange, dateRangeText } = useStatisticsFilter();
  const [fluctuationMode, setFluctuationMode] = useState("daily");

  const ledgerId = currentLedger?.id;
  const dateFrom = dateRange ? analyticsApi.toApiDate(dateRange.from) : undefined;
  const dateTo = dateRange ? analyticsApi.toApiDate(dateRange.to) : undefined;

  // Thẻ tổng quan: lấy từ BE (SQL aggregation), không tự tính từ transactions ở client
  const [overview, setOverview] = useState(null);
  useEffect(() => {
    if (!ledgerId) return;
    let active = true;
    analyticsApi
      .getOverview({ ledgerId, dateFrom, dateTo })
      .then((data) => {
        if (active) setOverview(data);
      })
      .catch((err) => {
        console.error("Lỗi khi tải tổng quan thống kê:", err);
      });
    return () => {
      active = false;
    };
  }, [ledgerId, dateFrom, dateTo]);

  const stats = useMemo(
    () => ({
      income: overview?.totalIncomeVnd || 0,
      expense: overview?.totalExpenseVnd || 0,
      balance: overview?.balanceVnd || 0,
      transactionCount: overview?.transactionCount || 0,
    }),
    [overview]
  );

  return (
    <div
      className={`space-y-6 pb-24 md:pb-6 transition-opacity duration-300 ${
        isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-xl">
              <BarChart3 className="w-6 h-6 text-primary-500" />
            </div>
            Thống Kê
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 ml-14">
            Phân tích chi tiết thu chi của bạn
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeButton />
          <RefreshButton />
        </div>
      </div>

      {/* Date Filter */}
      <DateFilterBar onDateRangeChange={setDateRange} />

      {dateRangeText && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic -mt-2">
          {dateRangeText}
        </p>
      )}

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng thu nhập"
          value={formatCurrency(stats.income)}
          icon={TrendingUp}
          textColor="text-emerald-600 dark:text-emerald-400"
          iconColor="text-emerald-500"
        />
        <StatCard
          title="Tổng chi tiêu"
          value={formatCurrency(stats.expense)}
          icon={TrendingDown}
          textColor="text-rose-600 dark:text-rose-400"
          iconColor="text-rose-500"
        />
        <StatCard
          title="Chênh lệch"
          value={formatCurrency(stats.balance)}
          icon={Wallet}
          textColor={stats.balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"}
          iconColor={stats.balance >= 0 ? "text-blue-500" : "text-orange-500"}
        />
        <StatCard
          title="Số giao dịch"
          value={stats.transactionCount.toLocaleString("vi-VN")}
          icon={Receipt}
          textColor="text-purple-600 dark:text-purple-400"
          iconColor="text-purple-500"
        />
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Section Header - Cơ cấu & Chi tiêu hàng ngày */}
        <div className="flex items-center gap-2 pt-2">
          <PieChart className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Phân tích theo danh mục
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biểu đồ tròn */}
          <OverviewPieChart
            ledgerId={ledgerId}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />

          {/* Biểu đồ cột chi tiêu theo ngày */}
          <DailySpendChart ledgerId={ledgerId} dateRange={dateRange} />
        </div>

        {/* Section Header - Biến động */}
        <div className="flex items-center gap-2 pt-4">
          <Activity className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Biến động thu chi
          </h2>
        </div>

        {/* Biểu đồ Biến động Thu Chi - Full Width */}
        <Card className="bg-white dark:bg-slate-900 shadow-md border border-gray-100 dark:border-gray-800">
          <CardHeader className="flex justify-between items-center px-6 pt-5 pb-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                So sánh Thu - Chi
              </h3>
            </div>
            <ButtonGroup size="sm" variant="flat">
              <Button
                color={fluctuationMode === "daily" ? "primary" : "default"}
                onPress={() => setFluctuationMode("daily")}
              >
                Theo ngày
              </Button>
              <Button
                color={fluctuationMode === "monthly" ? "primary" : "default"}
                onPress={() => setFluctuationMode("monthly")}
              >
                Theo tháng
              </Button>
            </ButtonGroup>
          </CardHeader>
          <CardBody className="px-2 sm:px-6">
            <FluctuationChart ledgerId={ledgerId} viewMode={fluctuationMode} />
          </CardBody>
        </Card>

        {/* Biểu đồ xu hướng */}
        <TrendLineChart ledgerId={ledgerId} />
      </div>
    </div>
  );
}

export default Statistics;
