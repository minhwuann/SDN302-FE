/**
 * SectionHeader — tiêu đề khu vực bên trong trang.
 * Icon mảnh, chữ 16-18px, tùy chọn action bên phải.
 */
const SectionHeader = ({ icon: Icon, title, description, action, className = "" }) => {
  return (
    <div
      className={["flex items-center justify-between gap-3", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center gap-2 min-w-0">
        {Icon && (
          <Icon className="h-[18px] w-[18px] flex-shrink-0 text-primary" strokeWidth={2} />
        )}
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-default-600 dark:text-default-500">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

export default SectionHeader;
