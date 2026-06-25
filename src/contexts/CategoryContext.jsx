import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import * as categoryApi from "../services/categoryApi";

/**
 * CategoryContext - Chia sẻ danh mục thu/chi giữa các component.
 * Dữ liệu lấy từ Backend (/api/v1/categories). BE tự seed danh mục mặc định
 * cho mỗi user, nên không cần default cứng ở FE.
 */

const EMPTY = { expense: [], income: [], flat: [] };

const CategoryContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useCategoryContext = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error("useCategoryContext must be used within CategoryProvider");
  }
  return context;
};

export const CategoryProvider = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState(EMPTY);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await categoryApi.getCategories();
    setCategories(data);
    return data;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategories(EMPTY);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    reload()
      .catch((err) => {
        console.error("Lỗi tải danh mục:", err);
        if (active) setCategories(EMPTY);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentUser, authLoading, reload]);

  /**
   * Thêm danh mục. Giữ chữ ký cũ addCategory(type, category)
   * với category = { name, icon?, color?, parentId? }.
   */
  const addCategory = useCallback(
    async (type, category) => {
      if (!currentUser) return;
      const created = await categoryApi.createCategory({ type, ...category });
      await reload();
      return created;
    },
    [currentUser, reload]
  );

  const updateCategory = useCallback(
    async (_type, categoryId, updates) => {
      if (!currentUser) return;
      await categoryApi.updateCategory(categoryId, updates);
      await reload();
    },
    [currentUser, reload]
  );

  const deleteCategory = useCallback(
    async (_type, categoryId) => {
      if (!currentUser) return;
      await categoryApi.deleteCategory(categoryId);
      await reload();
    },
    [currentUser, reload]
  );

  const getCategoryNames = useCallback(
    (type) => (categories[type] || []).map((cat) => cat.name),
    [categories]
  );

  const findCategoryByName = useCallback(
    (type, name) =>
      (categories[type] || []).find((cat) => cat.name === name) || null,
    [categories]
  );

  const value = {
    categories,
    expenseCategories: categories.expense || [],
    incomeCategories: categories.income || [],
    isLoading,
    reload,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryNames,
    findCategoryByName,
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};
