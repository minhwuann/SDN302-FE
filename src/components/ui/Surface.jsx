/**
 * Surface — bề mặt phẳng chuẩn của sản phẩm.
 * Border 1px + radius 14px, không shadow (elevation chỉ dành cho modal/popover).
 * Dùng thay cho các Card gradient/shadow rải rác.
 */
const Surface = ({ className = "", padded = true, ...props }) => {
  return (
    <div
      className={[
        "rounded-[14px] border border-divider bg-content1",
        padded ? "p-4 sm:p-5" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
};

export default Surface;
