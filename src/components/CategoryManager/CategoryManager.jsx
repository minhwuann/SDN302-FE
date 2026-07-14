import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { useCategoryContext } from "../../contexts/CategoryContext";

// Bảng màu có sẵn để chọn
const COLOR_PALETTE = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#0EA5E9",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#D946EF",
  "#EC4899",
  "#F43F5E",
  "#64748B",
];

// Danh sách emoji phổ biến
const EMOJI_LIST = [
  "🍜",
  "🍕",
  "🍔",
  "☕",
  "🥗",
  "🍳",
  "🚗",
  "🚌",
  "🚕",
  "✈️",
  "🚇",
  "⛽",
  "🛒",
  "👕",
  "👟",
  "💄",
  "🎁",
  "📱",
  "🎬",
  "🎮",
  "🎵",
  "📖",
  "🏋️",
  "⚽",
  "💊",
  "🏥",
  "🦷",
  "💉",
  "📚",
  "🎓",
  "💻",
  "📝",
  "📄",
  "💡",
  "🏠",
  "💧",
  "📞",
  "💰",
  "💵",
  "🎁",
  "📈",
  "🏪",
  "💳",
  "📦",
  "🔧",
  "🎯",
  "⭐",
];

/**
 * Component Quản Lý Danh Mục
 * Cho phép CRUD danh mục thu/chi
 */
const CategoryManager = () => {
  const {
    expenseCategories,
    incomeCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryContext();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    icon: "📦",
    color: "#3B82F6",
    type: "expense",
  });

  const handleOpenCreate = (type) => {
    setEditingCategory(null);
    setFormData({ name: "", icon: "📦", color: "#3B82F6", type });
    onOpen();
  };

  const handleOpenEdit = (category, type) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color,
      type,
    });
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    try {
      if (editingCategory) {
        await updateCategory(formData.type, editingCategory.id, {
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
        });
      } else {
        await addCategory(formData.type, {
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  const handleDelete = async (type, categoryId) => {
    if (!window.confirm("Bạn có chắc muốn xóa danh mục này?")) return;
    try {
      await deleteCategory(type, categoryId);
    } catch (error) {
      console.error("Lỗi xóa:", error);
    }
  };

  const renderCategoryList = (categories, type) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="flex items-center justify-between p-3 bg-content1 rounded-[10px] border border-divider hover:bg-content2 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: `${cat.color}20` }}
            >
              {cat.icon}
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {cat.name}
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => handleOpenEdit(cat, type)}
            >
              <Pencil className="w-4 h-4 text-slate-500" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              onPress={() => handleDelete(type, cat.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}

      {/* Nút thêm mới */}
      <button
        onClick={() => handleOpenCreate(type)}
        className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span>Thêm danh mục</span>
      </button>
    </div>
  );

  return (
    <Card className="bg-white dark:bg-slate-900 shadow-md">
      <CardHeader className="flex items-center gap-2 px-6 pt-5 pb-0">
        <Tag className="w-5 h-5 text-primary-500" />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
          Quản Lý Danh Mục
        </h3>
      </CardHeader>
      <CardBody className="px-6 pb-6">
        <Tabs
          aria-label="Category Types"
          color="primary"
          variant="underlined"
          classNames={{
            tabList:
              "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-primary",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-primary font-medium",
          }}
        >
          <Tab
            key="expense"
            title={
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4 text-red-500" />
                <span>Chi tiêu ({expenseCategories.length})</span>
              </div>
            }
          >
            <div className="pt-4">
              {renderCategoryList(expenseCategories, "expense")}
            </div>
          </Tab>
          <Tab
            key="income"
            title={
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-green-500" />
                <span>Thu nhập ({incomeCategories.length})</span>
              </div>
            }
          >
            <div className="pt-4">
              {renderCategoryList(incomeCategories, "income")}
            </div>
          </Tab>
        </Tabs>
      </CardBody>

      {/* Modal Thêm/Sửa */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Tên danh mục"
                  placeholder="Ví dụ: Ăn uống"
                  value={formData.name}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, name: val }))
                  }
                  autoFocus
                />

                {/* Chọn Icon */}
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Chọn biểu tượng
                  </p>
                  <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, icon: emoji }))
                        }
                        className={`w-8 h-8 text-lg rounded-md flex items-center justify-center transition-all ${
                          formData.icon === emoji
                            ? "bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500"
                            : "hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chọn Màu */}
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Chọn màu sắc
                  </p>
                  <div className="grid grid-cols-9 gap-2">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, color }))
                        }
                        className={`w-8 h-8 rounded-full transition-all ${
                          formData.color === color
                            ? "ring-2 ring-offset-2 ring-slate-500"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${formData.color}20` }}
                  >
                    {formData.icon}
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {formData.name || "Tên danh mục"}
                  </span>
                  <Chip
                    size="sm"
                    style={{
                      backgroundColor: `${formData.color}20`,
                      color: formData.color,
                    }}
                  >
                    {formData.type === "expense" ? "Chi tiêu" : "Thu nhập"}
                  </Chip>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Hủy
                </Button>
                <Button
                  color="primary"
                  onPress={handleSubmit}
                  className="active-scale"
                >
                  {editingCategory ? "Lưu" : "Thêm"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Card>
  );
};

export default CategoryManager;
