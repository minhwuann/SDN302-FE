import { Button } from "@heroui/react";
import { Plus, Wallet, Sparkles } from "lucide-react";
import { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

/**
 * Floating Action Button dạng Speed Dial.
 * Nút chính đặc màu primary (không glass). Các hành động con có nhãn rõ ràng
 * và hỗ trợ bàn phím. Chuyển động tinh giản, đúng chức năng.
 */
const FloatingActionButton = ({ onOpenAddTransaction, onOpenChat }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen((v) => !v);

  const actions = [
    {
      key: "add",
      label: "Thêm giao dịch",
      icon: Wallet,
      onPress: () => {
        onOpenAddTransaction();
        setIsOpen(false);
      },
    },
    {
      key: "chat",
      label: "Trợ lý AI",
      icon: Sparkles,
      onPress: () => {
        onOpenChat();
        setIsOpen(false);
      },
    },
  ];

  return (
    <div className="fixed bottom-24 sm:bottom-28 lg:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-2.5">
      <AnimatePresence>
        {isOpen &&
          actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15, delay: i * 0.04 }}
                className="flex items-center gap-2"
              >
                <span className="rounded-lg border border-divider bg-content1 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
                  {action.label}
                </span>
                <Button
                  isIconOnly
                  radius="full"
                  className="h-11 w-11 bg-content1 text-primary border border-divider shadow-md hover:bg-content2"
                  onPress={action.onPress}
                  aria-label={action.label}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </Button>
              </motion.div>
            );
          })}
      </AnimatePresence>

      {/* Nút chính */}
      <Button
        isIconOnly
        radius="full"
        color="primary"
        className="h-14 w-14 shadow-lg"
        onPress={toggleOpen}
        aria-label={isOpen ? "Đóng menu tác vụ" : "Mở menu tác vụ"}
        aria-expanded={isOpen}
      >
        <motion.span
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-center"
        >
          <Plus className="h-6 w-6" strokeWidth={2.25} />
        </motion.span>
      </Button>
    </div>
  );
};

export default FloatingActionButton;
