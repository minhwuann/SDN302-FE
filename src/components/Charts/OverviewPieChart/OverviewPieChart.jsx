import { Card, CardBody, Tabs, Tab } from "@heroui/react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency } from "../../../utils/formatCurrency";
import { FolderOpen } from "lucide-react";
import { usePieChartData } from "./usePieChartData";

/**
 * Tooltip tùy chỉnh được style giống Shadcn Charts
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
          {data.name}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">{formatCurrency(data.value)}</span>
        </p>
        {data.payload.percentage && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {data.payload.percentage.toFixed(1)}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

/**
 * Label tùy chỉnh cho các phần của biểu đồ tròn
 * Chỉ hiển thị label nếu phần trăm >= 5%
 */
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Chỉ hiển thị label nếu phần trăm >= 5%
  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/**
 * Component biểu đồ tròn hiển thị cơ cấu chi tiêu/thu nhập theo danh mục
 * Chỉ chứa UI, logic được xử lý bởi usePieChartData hook
 */
const OverviewPieChart = ({ ledgerId, dateFrom, dateTo }) => {
  const {
    selectedType,
    setSelectedType,
    chartData,
    colors,
    otherColor,
    cardTitle,
  } = usePieChartData(ledgerId, dateFrom, dateTo);

  if (chartData.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
        <CardBody className="p-6">
          {/* Tabs để chọn loại */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {cardTitle}
            </h3>
            <Tabs
              selectedKey={selectedType}
              onSelectionChange={(key) => setSelectedType(key)}
              size="sm"
              variant="bordered"
            >
              <Tab key="expense" title="Chi tiêu" />
              <Tab key="income" title="Thu nhập" />
            </Tabs>
          </div>
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
        {/* Header với Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {cardTitle}
          </h3>
          <Tabs
            selectedKey={selectedType}
            onSelectionChange={(key) => setSelectedType(key)}
            size="sm"
            variant="bordered"
          >
            <Tab key="expense" title="Chi tiêu" />
            <Tab key="income" title="Thu nhập" />
          </Tabs>
        </div>
        <div className="w-full">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                strokeWidth={2}
                stroke="rgba(255, 255, 255, 0.1)"
              >
                {chartData.map((entry, index) => {
                  // Nếu là nhóm "Khác" được gom lại (có flag isGrouped), dùng màu xám
                  const fillColor = entry.isGrouped
                    ? otherColor
                    : colors[index % colors.length];

                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={fillColor}
                      stroke="transparent"
                    />
                  );
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
};

export default OverviewPieChart;
