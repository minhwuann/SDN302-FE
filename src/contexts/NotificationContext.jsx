import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import {
  listNotifications,
  markNotificationRead,
} from "../services/notificationApi";

/**
 * NotificationContext - Hộp thông báo trong app, đọc từ BE (/api/v1/notifications).
 * Không có push (bỏ qua Web Push cho MVP) -> chỉ poll định kỳ + khi quay lại tab.
 */

const POLL_INTERVAL_MS = 60000;
const RECENT_PAGE_SIZE = 20;

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (authLoading) return;
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [recent, unread] = await Promise.all([
        listNotifications({ pageSize: RECENT_PAGE_SIZE }),
        listNotifications({ unreadOnly: true, pageSize: 1 }),
      ]);
      setNotifications(recent.notifications);
      setUnreadCount(unread.pagination?.total || 0);
      setError(null);
    } catch (err) {
      console.error("Lỗi khi tải thông báo:", err);
      setError("Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  }, [currentUser, authLoading]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll định kỳ + refresh khi user quay lại tab (không dùng push).
  useEffect(() => {
    if (!currentUser) return undefined;

    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchNotifications();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [currentUser, fetchNotifications]);

  const markAsRead = async (id) => {
    await markNotificationRead(id);
    await fetchNotifications();
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    refreshNotifications: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
};
