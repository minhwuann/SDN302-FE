import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar/Sidebar";
import AddTransactionModal from "./AddTransactionModal/AddTransactionModal";
import FloatingActionButton from "./FloatingActionButton";
import AIChatBox from "./AIChat/AIChatBox";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useTransactionsContext } from "../contexts/TransactionsContext";
import { useDisclosure } from "@heroui/react";

const Layout = () => {
  const { addTransaction, updateTransaction } = useTransactionsContext();
  // Modal Thêm giao dịch
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  // Modal Chat AI
  const {
    isOpen: isChatOpen,
    onOpen: onChatOpen,
    onOpenChange: onChatOpenChange,
  } = useDisclosure();

  const [editingTransaction, setEditingTransaction] = useState(null);

  const handleOpenModal = (transaction = null) => {
    setEditingTransaction(transaction);
    onOpen();
  };

  const handleCloseModal = () => {
    setEditingTransaction(null);
    onOpenChange(false);
  };

  const handleAddTransaction = (transaction) => {
    addTransaction(transaction);
    handleCloseModal();
  };

  const handleUpdateTransaction = (id, updatedData) => {
    updateTransaction(id, updatedData);
    handleCloseModal();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pb-20 pt-16 lg:pt-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          <Outlet context={{ onEditTransaction: handleOpenModal }} />
        </div>
      </main>

      {/* Speed Dial Floating Action Button */}
      <FloatingActionButton
        onOpenAddTransaction={() => handleOpenModal(null)}
        onOpenChat={onChatOpen}
      />

      {/* AI Chat Box */}
      <AIChatBox isOpen={isChatOpen} onOpenChange={onChatOpenChange} />

      {/* Vercel Speed Insights */}
      <SpeedInsights />

      {/* Modal thêm/sửa giao dịch */}
      <AddTransactionModal
        isOpen={isOpen}
        onOpenChange={handleCloseModal}
        onAddTransaction={handleAddTransaction}
        onUpdateTransaction={handleUpdateTransaction}
        editingTransaction={editingTransaction}
      />
    </div>
  );
};

export default Layout;
