/**
 * EmptyState — trạng thái rỗng chuẩn: icon nhẹ, tiêu đề, một dòng giải thích,
 * và tối đa một hành động chính. Dùng chung cho danh sách/tab rỗng.
 */
const EmptyState = ({ icon: Icon, title, description, action, className = "" }) => {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center rounded-[14px] border border-dashed border-divider bg-content1 px-6 py-12 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-content2 text-default-500">
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-default-600 dark:text-default-500">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default EmptyState;
