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
  getChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  checkInChallenge,
} from "../services/challengesService";

/**
 * ChallengesContext - Thử thách tiết kiệm qua Backend REST.
 * Dùng sổ hiện tại (currentLedger). Refetch sau mỗi thao tác.
 */

const ChallengesContext = createContext(null);

export const ChallengesProvider = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const { currentLedger } = useTransactionsContext();
  const ledgerId = currentLedger?.id;

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChallenges = useCallback(async () => {
    if (authLoading) return;
    if (!currentUser || !ledgerId) {
      setChallenges([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getChallenges(ledgerId);
      setChallenges(data);
      setError(null);
    } catch (err) {
      console.error("Lỗi khi tải thử thách:", err);
      setError("Không thể tải danh sách thử thách");
    } finally {
      setLoading(false);
    }
  }, [currentUser, authLoading, ledgerId]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const addChallenge = async (challengeData) => {
    if (!ledgerId) return;
    await createChallenge(ledgerId, challengeData);
    await fetchChallenges();
  };

  const editChallenge = async (challengeId, updates) => {
    await updateChallenge(challengeId, updates);
    await fetchChallenges();
  };

  /** Ghi nhận tiến độ qua check-in (cộng tiền + streak). */
  const recordProgress = async (challengeId, amount) => {
    await checkInChallenge(challengeId, amount);
    await fetchChallenges();
  };

  const removeChallenge = async (challengeId) => {
    await deleteChallenge(challengeId);
    await fetchChallenges();
  };

  const stats = {
    activeCount: challenges.filter((c) => c.status === "active").length,
    completedCount: challenges.filter((c) => c.status === "completed").length,
    totalSaved: challenges
      .filter((c) => c.status === "completed")
      .reduce((sum, c) => sum + (c.currentAmount || 0), 0),
  };

  const value = {
    challenges,
    loading,
    error,
    stats,
    addChallenge,
    editChallenge,
    recordProgress,
    removeChallenge,
    refreshChallenges: fetchChallenges,
  };

  return (
    <ChallengesContext.Provider value={value}>
      {children}
    </ChallengesContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChallenges = () => {
  const context = useContext(ChallengesContext);
  if (!context) {
    throw new Error("useChallenges must be used within ChallengesProvider");
  }
  return context;
};
