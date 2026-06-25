/**
 * categoryApi - Danh mục thu/chi. BE: /api/v1/categories
 *
 * BE lưu danh mục dạng cây phẳng (type + parentId). FE cũ dùng cấu trúc
 * { expense: [...], income: [...] } với mỗi mục có subcategories.
 * Module này chuyển đổi qua lại giữa hai dạng đó.
 */
import apiClient from "./apiClient";

/**
 * BE seed icon danh mục bằng tên lucide ("utensils"), trong khi UI FE render
 * icon như emoji. Map theo tên danh mục để giữ giao diện đẹp.
 */
const NAME_EMOJI = {
  "ăn uống": "🍜",
  "di chuyển": "🚗",
  "mua sắm": "🛒",
  "hóa đơn": "📄",
  "giải trí": "🎬",
  "y tế": "💊",
  "giáo dục": "📚",
  "tiết kiệm/đầu tư": "🏦",
  "thu nhập": "💰",
  khác: "📦",
};

/** Trả về true nếu chuỗi là tên icon dạng ASCII (lucide), không phải emoji. */
const isAsciiIcon = (icon) =>
  !icon || [...String(icon)].every((ch) => ch.charCodeAt(0) < 128);

/** Chuẩn hoá icon về emoji để hiển thị. */
function normalizeIcon(cat) {
  if (!isAsciiIcon(cat.icon)) return cat.icon; // đã là emoji (do user nhập)
  return NAME_EMOJI[(cat.name || "").toLowerCase()] || "📦";
}

/**
 * Lấy toàn bộ danh mục và gom thành { expense:[...], income:[...] }.
 * Mỗi phần tử là danh mục cha kèm mảng `subcategories`.
 * @returns {Promise<{expense:Array, income:Array, flat:Array}>}
 */
export const getCategories = async () => {
  const data = await apiClient.get("/categories");
  const flat = (data.categories || []).map((c) => ({
    ...c,
    icon: normalizeIcon(c),
  }));

  const byParent = new Map();
  for (const cat of flat) {
    const key = cat.parentId || "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(cat);
  }

  const buildGroup = (type) =>
    (byParent.get("root") || [])
      .filter((c) => c.type === type)
      .map((c) => ({
        ...c,
        subcategories: byParent.get(c.id) || [],
      }));

  return {
    expense: buildGroup("expense"),
    income: buildGroup("income"),
    flat,
  };
};

/** Tạo danh mục/danh mục con. payload: {type, name, parentId?, icon?, color?} */
export const createCategory = async (payload) => {
  const data = await apiClient.post("/categories", payload);
  return data.category;
};

/** Cập nhật danh mục. updates: {name?, icon?, color?} */
export const updateCategory = async (id, updates) => {
  const data = await apiClient.patch(`/categories/${id}`, updates);
  return data.category;
};

/** Xoá mềm danh mục (và danh mục con). */
export const deleteCategory = async (id) => {
  const data = await apiClient.delete(`/categories/${id}`);
  return data.deletedCategories || [];
};
