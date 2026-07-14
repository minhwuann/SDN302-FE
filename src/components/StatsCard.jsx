import { Card, CardBody } from "@heroui/react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";

/**
 * Component hiển thị một card thống kê single
 * Thiết kế premium với gradient và animations
 */
const StatsCard = ({ title, value, type, icon: Icon, subtitle }) => {
  const getColors = () => {
    switch (type) {
      case "income":
        return {
          text: "text-emerald-600 dark:text-emerald-400",
          iconColor: "text-emerald-500",
        };
      case "expense":
        return {
          text: "text-rose-600 dark:text-rose-400",
          iconColor: "text-rose-500",
        };
      case "balance":
        return {
          text: "text-blue-600 dark:text-blue-400",
          iconColor: "text-blue-500",
        };
      default:
        return {
          text: "text-gray-900 dark:text-white",
          iconColor: "text-gray-400",
        };
    }
  };

  const colors = getColors();
  const isNegative = value < 0;

  return (
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <CardBody className="p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>
            {Icon && <Icon className={`w-4 h-4 ${colors.iconColor}`} strokeWidth={2.5} />}
          </div>
          
          <div className="flex items-baseline gap-2">
            <p className={`text-3xl font-bold ${colors.text}`}>
              {type === "income" ? "+" : type === "expense" ? "-" : type === "balance" ? (isNegative ? "-" : "") : ""}
              {formatCurrency(Math.abs(value))}
            </p>
          </div>

          {subtitle && (
            <div className="flex items-center gap-1.5 mt-1">
              {type === "income" ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              ) : type === "expense" ? (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              ) : null}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
              </span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

/**
 * Component StatsCards để hiển thị ba chỉ số thống kê
 * Layout responsive với grid system
 * @param {number} totalIncome - Tổng thu nhập
 * @param {number} totalExpense - Tổng chi tiêu
 * @param {number} balance - Số dư
 */
const StatsCards = ({ totalIncome, totalExpense, balance }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <StatsCard
        title="Tổng Thu"
        value={totalIncome}
        type="income"
        icon={TrendingUp}
        subtitle="Trong kỳ"
      />
      <StatsCard
        title="Tổng Chi"
        value={totalExpense}
        type="expense"
        icon={TrendingDown}
        subtitle="Trong kỳ"
      />
      <StatsCard
        title="Số Dư"
        value={balance}
        type="balance"
        icon={Wallet}
        subtitle={balance >= 0 ? "Dương" : "Âm"}
      />
    </div>
  );
};

export default StatsCards;
