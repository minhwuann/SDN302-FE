import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import MetricTile from "./ui/MetricTile";

/**
 * StatsCards — ba chỉ số tổng quan với PHÂN CẤP rõ ràng:
 * - Số dư: bề mặt chính, trọng lượng thị giác mạnh nhất.
 * - Tổng thu / Tổng chi: chỉ số phụ, nhỏ hơn.
 * Bề mặt phẳng, viền 1px, số dạng tabular; màu ngữ nghĩa chỉ áp cho con số.
 *
 * @param {number} totalIncome
 * @param {number} totalExpense
 * @param {number} balance
 */
const StatsCards = ({ totalIncome, totalExpense, balance }) => {
  const balanceNegative = balance < 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Bề mặt chính: Số dư */}
      <MetricTile
        variant="primary"
        label="Số dư khả dụng"
        value={balance}
        tone="neutral"
        icon={Wallet}
        sign={balanceNegative ? "−" : ""}
        hint={balanceNegative ? "Đang âm trong kỳ" : "Trong kỳ hiện tại"}
      />

      {/* Chỉ số phụ */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <MetricTile
          label="Tổng thu"
          value={totalIncome}
          tone="income"
          icon={TrendingUp}
          sign="+"
        />
        <MetricTile
          label="Tổng chi"
          value={totalExpense}
          tone="expense"
          icon={TrendingDown}
          sign="−"
        />
      </div>
    </div>
  );
};

export default StatsCards;
