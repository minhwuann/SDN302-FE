import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { useTransactionsContext } from "./TransactionsContext";
import {
  getDebts,
  createDebt,
  updateDebt,
  deleteDebt,
  payDebt,
  checkOverdueDebts,
} from "../services/debtsService";

/**
 * DebtsContext - Quản lý khoản nợ (vay/cho vay) qua Backend REST.
 * Dùng sổ hiện tại (currentLedger). Mô hình refetch sau mỗi thao tác.
 */

const DebtsContext = createContext(null);

export const DebtsProvider = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const { currentLedger } = useTransactionsContext();
  const ledgerId = currentLedger?.id;

  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDebts = useCallback(async () => {
    if (authLoading) return;
    if (!currentUser || !ledgerId) {
      setDebts([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getDebts(ledgerId);
      setDebts(checkOverdueDebts(data));
      setError(null);
    } catch (err) {
      console.error("Lỗi khi tải danh sách nợ:", err);
      setError("Không thể tải danh sách nợ");
    } finally {
      setLoading(false);
    }
  }, [currentUser, authLoading, ledgerId]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const addDebt = async (debtData) => {
    if (!ledgerId) return;
    await createDebt(ledgerId, debtData);
    await fetchDebts();
  };

  const editDebt = async (debtId, updates) => {
    await updateDebt(debtId, updates);
    await fetchDebts();
  };

  const makePayment = async (debtId, amount) => {
    await payDebt(debtId, amount);
    await fetchDebts();
  };

  const removeDebt = async (debtId) => {
    await deleteDebt(debtId);
    await fetchDebts();
  };

  const stats = {
    totalLend: debts
      .filter((d) => d.type === "lend" && d.status !== "paid")
      .reduce((sum, d) => sum + (d.remainingAmount || 0), 0),
    totalBorrow: debts
      .filter((d) => d.type === "borrow" && d.status !== "paid")
      .reduce((sum, d) => sum + (d.remainingAmount || 0), 0),
    overdueCount: debts.filter((d) => d.status === "overdue").length,
    activeCount: debts.filter(
      (d) => d.status === "active" || d.status === "overdue"
    ).length,
  };

  const value = {
    debts,
    loading,
    error,
    stats,
    addDebt,
    editDebt,
    makePayment,
    removeDebt,
    refreshDebts: fetchDebts,
  };

  return (
    <DebtsContext.Provider value={value}>{children}</DebtsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDebts = () => {
  const context = useContext(DebtsContext);
  if (!context) {
    throw new Error("useDebts must be used within DebtsProvider");
  }
  return context;
};
