import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTransactionsContext } from "../contexts/TransactionsContext";
import { useCategoryContext } from "../contexts/CategoryContext";
import * as budgetApi from "../services/budgetApi";

/** Tháng hiện tại dạng YYYY-MM. */
const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * useBudgets - Ngân sách tháng qua Backend REST.
 * Ngân sách gắn với sổ hiện tại và tháng hiện tại. Resolve tên danh mục
 * (UI dùng tên) sang categoryId (BE dùng UUID).
 */
const useBudgets = () => {
  const { currentUser } = useAuth();
  const { currentLedger } = useTransactionsContext();
  const { expenseCategories } = useCategoryContext();
  const ledgerId = currentLedger?.id;
  const month = currentMonth();

  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!ledgerId) return;
    const data = await budgetApi.listBudgets(ledgerId, month);
    setBudgets(data);
  }, [ledgerId, month]);

  useEffect(() => {
    if (!currentUser || !ledgerId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBudgets([]);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    budgetApi
      .listBudgets(ledgerId, month)
      .then((data) => active && setBudgets(data))
      .catch((e) => console.error("Lỗi tải ngân sách:", e))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [currentUser, ledgerId, month]);

  /** Tìm categoryId (danh mục chi cha) theo tên. */
  const resolveCategoryId = useCallback(
    (name) => {
      const found = expenseCategories.find(
        (c) => c.name?.toLowerCase() === (name || "").toLowerCase()
      );
      return found ? found.id : null;
    },
    [expenseCategories]
  );

  const addBudget = useCallback(
    async (budgetData) => {
      if (!ledgerId) return;
      const categoryId = resolveCategoryId(budgetData.category);
      await budgetApi.createBudget({
        ledgerId,
        month,
        categoryId: categoryId || null,
        limitAmountVnd: Math.round(Number(budgetData.limit)),
        warningThreshold: budgetData.warningThreshold || 80,
      });
      await reload();
    },
    [ledgerId, month, resolveCategoryId, reload]
  );

  const updateBudget = useCallback(
    async (id, updates) => {
      const payload = {};
      if (updates.limit !== undefined)
        payload.limitAmountVnd = Math.round(Number(updates.limit));
      if (updates.warningThreshold !== undefined)
        payload.warningThreshold = updates.warningThreshold;
      await budgetApi.updateBudget(id, payload);
      await reload();
    },
    [reload]
  );

  const deleteBudget = useCallback(
    async (id) => {
      await budgetApi.deleteBudget(id);
      await reload();
    },
    [reload]
  );

  return {
    budgets,
    isLoading,
    addBudget,
    updateBudget,
    deleteBudget,
  };
};

export default useBudgets;
