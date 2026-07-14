import { NavLink, Link } from "react-router-dom";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@heroui/react";
import { useAuth } from "../../contexts/AuthContext";
import { MENU_ITEMS, APP_NAME } from "./constants";
import ProfileAvatar from "../ProfileAvatar";
import LedgerSwitcher from "../LedgerSwitcher/LedgerSwitcher";
import NotificationBell from "../Notifications/NotificationBell";

/**
 * Sidebar - Navigation cho ứng dụng.
 * Desktop: sidebar phẳng cố định 236px, viền phải mảnh, active = nền xanh nhạt
 * + icon/chữ xanh + chỉ báo dọc mảnh (không phải khối xanh đặc có shadow).
 * Mobile: bottom navigation ổn định (không nhảy icon), tôn trọng safe-area.
 */
const Sidebar = () => {
  const { logout } = useAuth();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleConfirmLogout = () => {
    logout()
      .then(() => onOpenChange(false))
      .catch((error) => {
        console.error("Lỗi khi đăng xuất:", error);
        onOpenChange(false);
      });
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[236px] bg-content1 border-r border-divider z-40">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-divider">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-[10px] hover:opacity-80 transition-opacity"
          >
            <img
              src="/logoApp.png"
              alt="Ví Vi Vu"
              className="w-9 h-9 object-contain"
            />
            <span className="text-lg font-bold tracking-tight text-foreground">
              {APP_NAME}
            </span>
          </Link>
        </div>

        {/* Ledger switcher */}
        <div className="px-3 pt-3">
          <LedgerSwitcher />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700 font-semibold dark:bg-primary-500/10 dark:text-primary-300"
                      : "text-default-700 dark:text-default-600 hover:bg-content2 hover:text-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
                    )}
                    <Icon
                      className={`h-5 w-5 flex-shrink-0 ${
                        isActive ? "text-primary" : ""
                      }`}
                      strokeWidth={2}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Actions: notification + profile */}
        <div className="px-3 py-3 border-t border-divider flex items-center gap-1">
          <NotificationBell />
          <div className="flex-1 min-w-0">
            <ProfileAvatar onLogoutClick={onOpen} />
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-content1/95 backdrop-blur-sm border-b border-divider z-50 px-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-[10px] hover:opacity-80 transition-opacity"
        >
          <img
            src="/logoApp.png"
            alt="Ví Vi Vu"
            className="w-8 h-8 object-contain"
          />
          <span className="text-base font-bold tracking-tight text-foreground">
            {APP_NAME}
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <div className="w-[148px]">
            <LedgerSwitcher compact />
          </div>
          <NotificationBell isMobile />
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-content1/95 backdrop-blur-sm border-t border-divider z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Điều hướng chính"
      >
        <div className="grid grid-cols-5 h-16">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-1 h-full min-h-[44px] transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-default-500 dark:text-default-500 hover:text-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-primary" />
                    )}
                    <Icon
                      className="h-5 w-5"
                      strokeWidth={isActive ? 2.25 : 1.75}
                    />
                    <span
                      className={`text-[10px] leading-none ${
                        isActive ? "font-semibold" : "font-medium"
                      }`}
                    >
                      {item.label === "Công cụ Dữ liệu" ? "Công cụ" : item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Profile - item thứ 5 */}
          <div className="flex flex-col items-center justify-center h-full min-h-[44px] text-default-500">
            <ProfileAvatar onLogoutClick={onOpen} isMobile />
          </div>
        </div>
      </nav>

      {/* Modal xác nhận đăng xuất */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Đăng xuất</ModalHeader>
              <ModalBody>
                <p className="text-default-700 dark:text-default-600">
                  Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Hủy
                </Button>
                <Button color="danger" onPress={handleConfirmLogout}>
                  Đăng xuất
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default Sidebar;
