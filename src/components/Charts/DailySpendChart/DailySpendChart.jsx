import { Card, CardBody } from "@heroui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "../../../utils/formatCurrency";
import { FolderOpen } from "lucide-react";
import { useDailyChartData } from "./useDailyChartData";

/**
 * Tooltip tùy chỉnh được style giống Shadcn Charts
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const fullDate = data.payload?.fullDate || data.payload?.date || "Ngày";
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
          {fullDate}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">
            {formatCurrency(data.value)}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

/**
 * Component biểu đồ cột hiển thị chi tiêu theo ngày/tuần/tháng
 * Chỉ chứa UI, logic được xử lý bởi useDailyChartData hook
 */
const DailySpendChart = ({ ledgerId, dateRange }) => {
  const { chartData, chartTitle, chartStyles } = useDailyChartData(
    ledgerId,
    dateRange
  );

  if (chartData.length === 0 || chartData.every((item) => item.value === 0)) {
    return (
      <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {chartTitle}
          </h3>
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <FolderOpen className="w-12 h-12 mb-3 opacity-50" />
            <p>Chưa có dữ liệu cho khoảng thời gian này</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
      <CardBody className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {chartTitle}
        </h3>
        <div className="w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartStyles.gridColor}
                strokeOpacity={0.3}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: chartStyles.tickColor, fontSize: 12 }}
                stroke={chartStyles.strokeColor}
                tickLine={{ stroke: chartStyles.strokeColor }}
              />
              <YAxis
                tick={{ fill: chartStyles.tickColor, fontSize: 12 }}
                stroke={chartStyles.strokeColor}
                tickLine={{ stroke: chartStyles.strokeColor }}
                tickFormatter={(value) => {
                  if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(1)}M`;
                  }
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(0)}K`;
                  }
                  return value.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill={chartStyles.barColor}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
};

export default DailySpendChart;

