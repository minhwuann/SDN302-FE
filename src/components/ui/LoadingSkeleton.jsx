/**
 * LoadingSkeleton — khối skeleton phẳng, tôn trọng prefers-reduced-motion
 * (pulse tự dừng qua CSS reduced-motion global).
 */
export const SkeletonBlock = ({ className = "" }) => (
  <div
    className={["animate-pulse rounded-md bg-content2", className]
      .filter(Boolean)
      .join(" ")}
  />
);

/** Skeleton cho một dòng giao dịch (icon • nội dung • số tiền). */
export const TransactionRowSkeleton = () => (
  <div className="flex items-center gap-3 px-4 py-3">
    <SkeletonBlock className="h-10 w-10 rounded-xl" />
    <div className="flex-1 space-y-2">
      <SkeletonBlock className="h-3.5 w-2/5" />
      <SkeletonBlock className="h-3 w-1/4" />
    </div>
    <SkeletonBlock className="h-4 w-20" />
  </div>
);

/** Danh sách skeleton dùng cho list giao dịch đang tải. */
const LoadingSkeleton = ({ rows = 5 }) => (
  <div className="divide-y divide-divider">
    {Array.from({ length: rows }).map((_, i) => (
      <TransactionRowSkeleton key={i} />
    ))}
  </div>
);

export default LoadingSkeleton;
