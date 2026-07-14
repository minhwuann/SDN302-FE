/**
 * Số lượng danh mục lớn nhất được hiển thị trước khi gom nhóm
 * @type {number}
 */
export const TOP_CATEGORIES_COUNT = 5;

/**
 * Bảng màu categorical CỐ ĐỊNH cho biểu đồ — dùng chung, calm, phân biệt tốt
 * ở cả light & dark mode. Dẫn đầu bằng cobalt (accent sản phẩm), không rainbow.
 * Dữ liệu categorical là nơi hợp lệ để dùng nhiều sắc độ.
 */
const CHART_CATEGORICAL_LIGHT = [
  "#2563EB", // cobalt
  "#0D9488", // teal
  "#D97706", // amber
  "#7C3AED", // violet
  "#E11D48", // rose
];

const CHART_CATEGORICAL_DARK = [
  "#60A5FA",
  "#2DD4BF",
  "#FBBF24",
  "#A78BFA",
  "#FB7185",
];

export const EXPENSE_COLORS = CHART_CATEGORICAL_LIGHT;
export const INCOME_COLORS = CHART_CATEGORICAL_LIGHT;
export const EXPENSE_DARK_COLORS = CHART_CATEGORICAL_DARK;
export const INCOME_DARK_COLORS = CHART_CATEGORICAL_DARK;

/** Màu trung tính cho nhóm "Khác" được gom lại. */
export const OTHER_COLOR = "#94A3B8";
export const OTHER_COLOR_DARK = "#64748B";
