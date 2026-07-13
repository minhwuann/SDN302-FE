import { useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Bell, Wallet, Landmark, Trophy, CalendarClock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useNotifications } from "../../contexts/NotificationContext";

/** Icon theo loại thông báo BE sinh ra (xem modules/notifications/notificationRepository.js). */
const TYPE_ICON = {
  budget_threshold: Wallet,
  debt_due: Landmark,
  debt_overdue: Landmark,
  goal_completed: Trophy,
  daily_reminder: CalendarClock,
};

/**
 * NotificationBell - Hộp thông báo trong app (không push, chỉ đọc/đánh dấu đã đọc).
 * Theo pattern UI của ProfileAvatar/LedgerSwitcher (icon button + Dropdown HeroUI).
 */
const NotificationBell = ({ isMobile = false }) => {
  const { notifications, unreadCount, loading, markAsRead } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (key) => {
    const notification = notifications.find((n) => n.id === key);
    if (notification && !notification.readAt) {
      markAsRead(key).catch((err) =>
        console.error("Lỗi khi đánh dấu thông báo đã đọc:", err)
      );
    }
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      placement={isMobile ? "bottom" : "bottom-end"}
      classNames={{ content: "min-w-[320px] max-w-[360px]" }}
    >
      <DropdownTrigger>
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Thông báo"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Danh sách thông báo"
        onAction={handleAction}
        closeOnSelect={false}
        className="max-h-[400px] overflow-y-auto"
      >
        {notifications.length === 0 ? (
          <DropdownItem key="empty" textValue="Không có thông báo">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
              {loading ? "Đang tải..." : "Không có thông báo nào"}
            </p>
          </DropdownItem>
        ) : (
          notifications.map((item) => {
            const Icon = TYPE_ICON[item.type] || Bell;
            const isUnread = !item.readAt;
            return (
              <DropdownItem
                key={item.id}
                textValue={item.title}
                className={isUnread ? "bg-primary-50 dark:bg-primary-900/20" : ""}
                startContent={
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      isUnread
                        ? "bg-primary-100 dark:bg-primary-900/40 text-primary-600"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                }
              >
                <div className="flex flex-col gap-0.5 py-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm ${
                        isUnread
                          ? "font-semibold text-gray-900 dark:text-white"
                          : "font-medium text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.title}
                    </span>
                    {isUnread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {item.body}
                  </p>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                </div>
              </DropdownItem>
            );
          })
        )}
      </DropdownMenu>
    </Dropdown>
  );
};

export default NotificationBell;
