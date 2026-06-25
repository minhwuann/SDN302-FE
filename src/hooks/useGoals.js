/**
 * useGoals - Mục tiêu tiết kiệm (Savings Goals) qua Backend REST.
 * Dùng sổ hiện tại (currentLedger) từ TransactionsContext.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTransactionsContext } from "../contexts/TransactionsContext";
import {
  getGoals,
  createGoal,
  updateGoal,
  addMoneyToGoal,
  deleteGoal,
} from "../services/goalService";

export const useGoals = () => {
  const { currentUser } = useAuth();
  const { currentLedger } = useTransactionsContext();
  const ledgerId = currentLedger?.id;

  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!ledgerId) return;
    const data = await getGoals(ledgerId);
    setGoals(data);
  }, [ledgerId]);

  useEffect(() => {
    if (!currentUser || !ledgerId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGoals([]);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    getGoals(ledgerId)
      .then((data) => {
        if (active) {
          setGoals(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentUser, ledgerId]);

  const handleCreateGoal = useCallback(
    async (goalData) => {
      if (!ledgerId) return { success: false, error: "Chưa chọn sổ" };
      try {
        await createGoal(ledgerId, goalData);
        await reload();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [ledgerId, reload]
  );

  const handleUpdateGoal = useCallback(
    async (goalId, updates) => {
      try {
        await updateGoal(goalId, updates);
        await reload();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [reload]
  );

  const handleAddMoney = useCallback(
    async (goal, amount) => {
      try {
        await addMoneyToGoal(goal.id, amount);
        await reload();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [reload]
  );

  const handleDeleteGoal = useCallback(
    async (goalId) => {
      try {
        await deleteGoal(goalId);
        await reload();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },
    [reload]
  );

  const stats = {
    total: goals.length,
    active: goals.filter((g) => g.status === "active").length,
    completed: goals.filter((g) => g.status === "completed").length,
    totalSaved: goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0),
    totalTarget: goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0),
  };

  return {
    goals,
    isLoading,
    error,
    stats,
    createGoal: handleCreateGoal,
    updateGoal: handleUpdateGoal,
    addMoney: handleAddMoney,
    deleteGoal: handleDeleteGoal,
  };
};

export default useGoals;
