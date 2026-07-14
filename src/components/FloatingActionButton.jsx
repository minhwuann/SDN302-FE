import { Button } from "@heroui/react";
import { Plus, X, Wallet, Sparkles } from "lucide-react";
import { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

/**
 * Floating Action Button dạng Speed Dial
 * Gom nhóm 2 chức năng: Thêm giao dịch và Chat với AI
 */
const FloatingActionButton = ({ onOpenAddTransaction, onOpenChat }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-center gap-3">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Nút Chat AI - Glassmorphism Style */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="flex items-center gap-2"
            >
              <Button
                isIconOnly
                className="w-12 h-12 shadow-lg bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full"
                onPress={() => {
                  onOpenChat();
                  setIsOpen(false);
                }}
                aria-label="Mở Trợ lý AI"
              >
                <Sparkles className="w-5 h-5" />
              </Button>
            </motion.div>

            {/* Nút Thêm Giao Dịch - Explicit Blue Styling */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Button
                isIconOnly
                className="w-12 h-12 shadow-lg bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full"
                onPress={() => {
                  onOpenAddTransaction();
                  setIsOpen(false);
                }}
                aria-label="Thêm giao dịch thủ công"
              >
                <Wallet className="w-5 h-5" />
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Toggle Button */}
      <Button
        isIconOnly
        className={`w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all flex items-center justify-center ${
          isOpen ? "rotate-180" : ""
        }`}
        onPress={toggleOpen}
        aria-label={isOpen ? "Đóng menu" : "Mở menu tác vụ"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </Button>
    </div>
  );
};

export default FloatingActionButton;
