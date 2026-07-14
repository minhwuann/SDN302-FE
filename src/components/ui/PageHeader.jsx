/**
 * PageHeader — tiêu đề trang thống nhất.
 * Title là heading chính (~28-32px desktop). Eyebrow/subtitle là phụ.
 * actions: toolbar bên phải (theme, refresh, filter…).
 */
const PageHeader = ({ title, subtitle, eyebrow, actions, className = "" }) => {
  return (
    <div
      className={[
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-sm text-default-600 dark:text-default-500">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[26px] sm:text-[28px] lg:text-[30px] font-bold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-default-600 dark:text-default-500">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-shrink-0 items-center gap-1.5">{actions}</div>
      )}
    </div>
  );
};

export default PageHeader;
