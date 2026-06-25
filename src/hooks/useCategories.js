import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import * as categoryApi from "../services/categoryApi";

const EMPTY = { expense: [], income: [], flat: [] };

/**
 * Hook quản lý danh mục thu/chi (độc lập, dùng Backend).
 * Lưu ý: trong cây Provider nên dùng useCategoryContext để chia sẻ state.
 */
export const useCategories = () => {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState(EMPTY);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await categoryApi.getCategories();
    setCategories(data);
    return data;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategories(EMPTY);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    reload()
      .catch((e) => console.error("Lỗi fetch categories:", e))
      .finally(() => setIsLoading(false));
  }, [currentUser, reload]);

  const handleAddCategory = useCallback(
    async (type, category) => {
      if (!currentUser) return;
      const created = await categoryApi.createCategory({ type, ...category });
      await reload();
      return created;
    },
    [currentUser, reload]
  );

  const handleUpdateCategory = useCallback(
    async (_type, categoryId, updates) => {
      if (!currentUser) return;
      await categoryApi.updateCategory(categoryId, updates);
      await reload();
    },
    [currentUser, reload]
  );

  const handleDeleteCategory = useCallback(
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

  return {
    categories,
    expenseCategories: categories.expense || [],
    incomeCategories: categories.income || [],
    isLoading,
    addCategory: handleAddCategory,
    updateCategory: handleUpdateCategory,
    deleteCategory: handleDeleteCategory,
    getCategoryNames,
    findCategoryByName,
  };
};

export default useCategories;
