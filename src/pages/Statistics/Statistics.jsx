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
  Receipt,
  PieChart,
  Activity,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import SectionHeader from "../../components/ui/SectionHeader";
import MetricTile from "../../components/ui/MetricTile";

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
      <PageHeader
        title="Thống kê"
        subtitle="Phân tích chi tiết thu chi của bạn"
        actions={
          <>
            <ThemeButton />
            <RefreshButton />
          </>
        }
      />

      {/* Date Filter */}
      <DateFilterBar onDateRangeChange={setDateRange} />

      {dateRangeText && (
        <p className="text-sm text-default-500 -mt-2">{dateRangeText}</p>
      )}

      {/* Summary Stats — bề mặt phẳng, màu ngữ nghĩa chỉ ở con số */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricTile
          label="Tổng thu nhập"
          value={stats.income}
          tone="income"
          icon={TrendingUp}
          sign="+"
        />
        <MetricTile
          label="Tổng chi tiêu"
          value={stats.expense}
          tone="expense"
          icon={TrendingDown}
          sign="−"
        />
        <MetricTile
          label="Chênh lệch"
          value={stats.balance}
          tone="neutral"
          icon={Wallet}
          sign={stats.balance < 0 ? "−" : ""}
        />
        <MetricTile
          label="Số giao dịch"
          value={stats.transactionCount.toLocaleString("vi-VN")}
          tone="neutral"
          icon={Receipt}
        />
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <SectionHeader icon={PieChart} title="Phân tích theo danh mục" />

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
        <SectionHeader icon={Activity} title="Biến động thu chi" className="pt-2" />

        {/* Biểu đồ Biến động Thu Chi - Full Width */}
        <Card className="bg-content1 border border-divider shadow-none" radius="lg">
          <CardHeader className="flex justify-between items-center px-5 sm:px-6 pt-5 pb-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-[18px] h-[18px] text-primary" strokeWidth={2} />
              <h3 className="text-base font-semibold text-foreground">
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
