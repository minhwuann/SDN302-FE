import { formatCurrency } from "../../utils/formatCurrency";

/**
 * MetricTile — ô chỉ số phẳng.
 * - variant="primary": bề mặt số dư nổi bật nhất (nền content1, viền, số lớn).
 * - variant="supporting": chỉ số phụ (thu/chi), nhỏ hơn.
 * Không gradient, không shadow lớn, không giả nút bấm.
 * Màu ngữ nghĩa (emerald/red) chỉ áp cho CON SỐ, không cho cả thẻ.
 */
const toneClass = {
  income: "text-success-600 dark:text-success-500",
  expense: "text-danger-600 dark:text-danger-500",
  neutral: "text-foreground",
};

const MetricTile = ({
  label,
  value,
  tone = "neutral",
  icon: Icon,
  sign,
  hint,
  variant = "supporting",
  className = "",
}) => {
  const isPrimary = variant === "primary";
  const display =
    typeof value === "number" ? formatCurrency(Math.abs(value)) : value;

  return (
    <div
      className={[
        "rounded-[14px] border border-divider bg-content1",
        isPrimary ? "p-5 sm:p-6" : "p-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center gap-2 text-default-600 dark:text-default-500">
        {Icon && <Icon className="h-4 w-4" strokeWidth={2} />}
        <span className={isPrimary ? "text-sm" : "text-[13px]"}>{label}</span>
      </div>
      <p
        className={[
          "vvv-tnum mt-2 font-bold tracking-tight break-words",
          isPrimary
            ? "text-2xl sm:text-3xl"
            : "text-lg sm:text-xl",
          toneClass[tone] || toneClass.neutral,
        ].join(" ")}
        title={typeof display === "string" ? display : undefined}
      >
        {sign}
        {display}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-default-500 dark:text-default-500">
          {hint}
        </p>
      )}
    </div>
  );
};

export default MetricTile;
