import { NavLink, Link } from "react-router-dom";
import { LogOut } from "lucide-react";
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
 * Component Sidebar - Navigation menu cho ứng dụng
 * Hiển thị Desktop Sidebar và Mobile Bottom Navigation
 * Chỉ chứa UI, logic được xử lý bởi useSidebar hook
 */
const Sidebar = () => {
  const { logout } = useAuth();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  /**
   * Xử lý đăng xuất khi người dùng xác nhận trong Modal
   */
  const handleConfirmLogout = () => {
    logout()
      .then(() => {
        onOpenChange(false); // Đóng Modal sau khi đăng xuất thành công
      })
      .catch((error) => {
        console.error("Lỗi khi đăng xuất:", error);
        // Vẫn đóng Modal ngay cả khi có lỗi để không làm người dùng bối rối
        onOpenChange(false);
      });
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40">
        {/* Logo */}
        <div className="flex flex-col w-full border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-start h-16 w-full px-4">
            <Link
              to="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <img
                src="/logoApp.png"
                alt="Logo App"
                className="w-10 h-10 object-contain"
              />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {APP_NAME}
              </h1>
            </Link>
          </div>
          <div className="px-4 pb-3">
            <LedgerSwitcher />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary-500 text-white font-medium shadow-md"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <NotificationBell />
          {/* Profile Avatar với dropdown đăng xuất */}
          <div className="flex-1 min-w-0">
            <ProfileAvatar onLogoutClick={onOpen} />
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50 px-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img
            src="/logoApp.png"
            alt="Logo"
            className="w-8 h-8 object-contain"
          />
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {APP_NAME}
          </h1>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell isMobile />
          <div className="w-36">
            <LedgerSwitcher />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50 pb-safe shadow-lg">
        <div className="grid grid-cols-5 h-16 pb-safe">
          {/* Menu Items */}
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center h-full transition-all duration-300 relative group ${
                    isActive
                      ? "text-primary-600 dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`p-1.5 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-primary-500 text-white transform -translate-y-1 shadow-md"
                          : "group-hover:bg-gray-100 dark:group-hover:bg-gray-800"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-medium mt-1 transition-all ${
                        isActive ? "opacity-100 font-semibold" : "opacity-70"
                      }`}
                    >
                      {item.label === "Công cụ Dữ liệu"
                        ? "Công cụ"
                        : item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Profile Avatar - 5th item */}
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            <ProfileAvatar onLogoutClick={onOpen} isMobile />
          </div>
        </div>
      </nav>

      {/* Modal xác nhận đăng xuất */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="blur"
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Đăng xuất
              </ModalHeader>
              <ModalBody>
                <p className="text-gray-700 dark:text-gray-300">
                  Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                  className="text-gray-700 dark:text-gray-300"
                >
                  Hủy
                </Button>
                <Button
                  color="danger"
                  onPress={handleConfirmLogout}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
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
