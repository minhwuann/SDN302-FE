import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useCategoryContext } from "../contexts/CategoryContext";
import * as ledgerApi from "../services/ledgerApi";
import * as paymentAccountApi from "../services/paymentAccountApi";
import * as txApi from "../services/transactionApi";

const CURRENT_LEDGER_KEY = "currentLedgerId";
const MAX_PAGES = 50; // tối đa 50 * 100 = 5000 giao dịch / sổ

/**
 * useTransactions - Quản lý sổ (ledgers), giao dịch và tài khoản thanh toán
 * thông qua Backend REST (thay cho Firestore realtime).
 *
 * Mô hình "refetch sau mỗi thao tác": sau create/update/delete sẽ tải lại danh
 * sách giao dịch của sổ hiện tại.
 */
const useTransactions = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const { categories } = useCategoryContext();

  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ledgers, setLedgers] = useState([]);
  const [currentLedger, setCurrentLedger] = useState(null);
  const [paymentAccounts, setPaymentAccounts] = useState([]);

  // map nhanh paymentAccountId -> account để hiển thị bankName
  const accountsById = useMemo(() => {
    const m = new Map();
    paymentAccounts.forEach((a) => m.set(a.id, a));
    return m;
  }, [paymentAccounts]);

  // Giữ ref tới categories để resolveCategory luôn dùng bản mới nhất
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  /* --------------------------- Helpers chuyển đổi --------------------------- */

  /** Tra cứu categoryId/subcategoryId từ chuỗi "Cha > Con" hoặc "Cha". */
  const resolveCategory = useCallback((type, path) => {
    const groups = categoriesRef.current?.[type] || [];
    if (!path) return fallbackCategory(groups);

    const [parentName, subName] = path.split(" > ").map((s) => s.trim());
    const norm = (s) => (s || "").toLowerCase();

    let parent = groups.find((c) => norm(c.name) === norm(parentName));
    if (!parent) parent = groups.find((c) => norm(c.name) === "khác");
    if (!parent) parent = groups[0];
    if (!parent) return {};

    let subcategoryId = null;
    if (subName) {
      const sub = (parent.subcategories || []).find(
        (s) => norm(s.name) === norm(subName)
      );
      if (sub) subcategoryId = sub.id;
    }
    return { categoryId: parent.id, subcategoryId };
  }, []);

  /** Tra cứu id tài khoản thanh toán từ tên/short name. */
  const resolveAccountId = useCallback(
    (name) => {
      if (!name) return null;
      const norm = (s) => (s || "").toLowerCase();
      const found = paymentAccounts.find(
        (a) => norm(a.name) === norm(name) || norm(a.shortName) === norm(name)
      );
      return found ? found.id : null;
    },
    [paymentAccounts]
  );

  /* ------------------------------ Tải dữ liệu ------------------------------ */

  /** Tải tất cả giao dịch của một sổ (gộp nhiều trang). */
  const fetchTransactionsForLedger = useCallback(
    async (ledgerId) => {
      const all = [];
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const data = await txApi.listTransactions({
          ledgerId,
          page,
          pageSize: 100,
        });
        all.push(...(data.transactions || []));
        if (!data.pagination || page >= data.pagination.totalPages) break;
      }
      return all.map((tx) => txApi.mapTxFromApi(tx, accountsById));
    },
    [accountsById]
  );

  // Khởi tạo: tải ledgers + payment accounts khi đã đăng nhập
  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setLedgers([]);
      setCurrentLedger(null);
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        const [ledgerList, accounts] = await Promise.all([
          ledgerApi.listLedgers(),
          paymentAccountApi.listPaymentAccounts(),
        ]);
        if (!active) return;
        setPaymentAccounts(accounts);
        setLedgers(ledgerList);

        const savedId = localStorage.getItem(CURRENT_LEDGER_KEY);
        const picked =
          ledgerList.find((l) => l.id === savedId) ||
          ledgerList.find((l) => l.isDefault) ||
          ledgerList[0] ||
          null;
        setCurrentLedger(picked);
        if (picked) localStorage.setItem(CURRENT_LEDGER_KEY, picked.id);
      } catch (err) {
        console.error("Lỗi tải sổ/tài khoản:", err);
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [currentUser, authLoading]);

  // Tải giao dịch khi đổi sổ
  useEffect(() => {
    if (!currentUser || !currentLedger) {
      return;
    }
    let active = true;
    setIsLoading(true);
    (async () => {
      try {
        const list = await fetchTransactionsForLedger(currentLedger.id);
        if (active) setTransactions(list);
      } catch (err) {
        console.error("Lỗi tải giao dịch:", err);
        if (active) setTransactions([]);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [currentUser, currentLedger, fetchTransactionsForLedger]);

  const reloadTransactions = useCallback(async () => {
    if (!currentLedger) return;
    const list = await fetchTransactionsForLedger(currentLedger.id);
    setTransactions(list);
  }, [currentLedger, fetchTransactionsForLedger]);

  /* ------------------------------ Giao dịch -------------------------------- */

  const addTransaction = useCallback(
    async (newTx) => {
      if (!currentUser || !currentLedger) {
        throw new Error("Chưa sẵn sàng: thiếu sổ hoặc phiên đăng nhập");
      }
      const payload = txApi.mapTxToApi(newTx, {
        ledgerId: currentLedger.id,
        resolveCategory,
        resolveAccountId,
      });
      await txApi.createTransaction(payload);
      await reloadTransactions();
    },
    [currentUser, currentLedger, resolveCategory, resolveAccountId, reloadTransactions]
  );

  const updateTransaction = useCallback(
    async (transactionId, updatedData) => {
      if (!currentUser) return;
      const payload = txApi.mapTxToApi(updatedData, {
        ledgerId: currentLedger?.id,
        resolveCategory,
        resolveAccountId,
        partial: true,
      });
      await txApi.updateTransaction(transactionId, payload);
      await reloadTransactions();
    },
    [currentUser, currentLedger, resolveCategory, resolveAccountId, reloadTransactions]
  );

  const deleteTransaction = useCallback(
    async (transactionId) => {
      if (!currentUser) return;
      await txApi.deleteTransaction(transactionId);
      await reloadTransactions();
    },
    [currentUser, reloadTransactions]
  );

  /**
   * Thêm hàng loạt giao dịch (import). Map từng item rồi gọi /transactions/bulk.
   * @param {Array} items - mảng { date, type, category, amount, note, paymentMethod, bankName? }
   * @returns {Promise<number>} số giao dịch đã tạo
   */
  const bulkAddTransactions = useCallback(
    async (items) => {
      if (!currentUser || !currentLedger) {
        throw new Error("Chưa sẵn sàng: thiếu sổ hoặc phiên đăng nhập");
      }
      const payloads = items.map((it) =>
        txApi.mapTxToApi(
          { ...it, amount: Number(it.amount) },
          {
            ledgerId: currentLedger.id,
            resolveCategory,
            resolveAccountId,
          }
        )
      );
      const created = await txApi.bulkCreate(payloads);
      await reloadTransactions();
      return created.length;
    },
    [currentUser, currentLedger, resolveCategory, resolveAccountId, reloadTransactions]
  );

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      await reloadTransactions();
    } finally {
      setIsLoading(false);
    }
  }, [reloadTransactions]);

  /* -------------------------------- Ledgers -------------------------------- */

  const switchLedger = useCallback((ledger) => {
    setCurrentLedger(ledger);
    localStorage.setItem(CURRENT_LEDGER_KEY, ledger.id);
  }, []);

  const addLedger = useCallback(async (name) => {
    const created = await ledgerApi.createLedger(name);
    const list = await ledgerApi.listLedgers();
    setLedgers(list);
    return created;
  }, []);

  const updateLedger = useCallback(
    async (ledgerId, newName) => {
      if (!newName?.trim()) return;
      await ledgerApi.updateLedger(ledgerId, newName.trim());
      const list = await ledgerApi.listLedgers();
      setLedgers(list);
      if (currentLedger?.id === ledgerId) {
        setCurrentLedger((prev) => ({ ...prev, name: newName.trim() }));
      }
    },
    [currentLedger]
  );

  const deleteLedger = useCallback(
    async (ledgerId) => {
      if (ledgers.length <= 1) {
        throw new Error("Phải có ít nhất một sổ thu chi.");
      }
      await ledgerApi.deleteLedger(ledgerId);
      const list = await ledgerApi.listLedgers();
      setLedgers(list);
      if (currentLedger?.id === ledgerId) {
        const next = list.find((l) => l.isDefault) || list[0];
        setCurrentLedger(next);
        if (next) localStorage.setItem(CURRENT_LEDGER_KEY, next.id);
      }
    },
    [ledgers, currentLedger]
  );

  /* ------------------------------- Tổng hợp -------------------------------- */

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === "income")
        .reduce((sum, tx) => sum + (tx.amount || 0), 0),
    [transactions]
  );

  const totalExpense = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === "expense")
        .reduce((sum, tx) => sum + (tx.amount || 0), 0),
    [transactions]
  );

  const balance = useMemo(
    () => totalIncome - totalExpense,
    [totalIncome, totalExpense]
  );

  return {
    transactions,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    bulkAddTransactions,
    refreshData,
    totalIncome,
    totalExpense,
    balance,
    paymentAccounts,
    // Ledger
    ledgers,
    currentLedger,
    switchLedger,
    addLedger,
    updateLedger,
    deleteLedger,
  };
};

/** Fallback khi không tìm thấy danh mục: ưu tiên "Khác", rồi mục đầu. */
function fallbackCategory(groups) {
  const other = groups.find((c) => (c.name || "").toLowerCase() === "khác");
  const parent = other || groups[0];
  return parent ? { categoryId: parent.id, subcategoryId: null } : {};
}

/**
 * Lấy giao dịch theo khoảng ngày (cho AI / nhắc nhở) - không realtime.
 * Giữ chữ ký cũ (userId không còn dùng) để tương thích các nơi gọi.
 */
export const getTransactionsByDateRange = async (
  _userId,
  startDate,
  endDate,
  ledgerId
) => {
  if (!ledgerId) {
    console.error("ledgerId là bắt buộc để lấy giao dịch.");
    return [];
  }
  try {
    const all = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const data = await txApi.listTransactions({
        ledgerId,
        dateFrom: startDate,
        dateTo: endDate,
        page,
        pageSize: 100,
      });
      all.push(...(data.transactions || []));
      if (!data.pagination || page >= data.pagination.totalPages) break;
    }
    return all.map((tx) => txApi.mapTxFromApi(tx, null));
  } catch (error) {
    console.error("Lỗi khi lấy giao dịch theo khoảng ngày:", error);
    return [];
  }
};

export default useTransactions;
