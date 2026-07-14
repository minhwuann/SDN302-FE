import { useState, useMemo } from "react";
import { Tabs, Tab } from "@heroui/react";
import { List, Calendar as CalendarIcon } from "lucide-react";
import StatsCards from "../components/StatsCard";
import TransactionList from "../components/Transactions/TransactionList/TransactionList";
import CalendarView from "../components/Calendar/CalendarView";
import RefreshButton from "../components/RefreshButton";
import ThemeButton from "../components/ThemeButton";
import PageHeader from "../components/ui/PageHeader";
import { useTransactionsContext } from "../contexts/TransactionsContext";
import { useOutletContext } from "react-router-dom";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { vi } from "date-fns/locale";

function Dashboard() {
  const {
    transactions,
    totalIncome,
    totalExpense,
    balance,
    isLoading,
    deleteTransaction,
  } = useTransactionsContext();
  const { onEditTransaction } = useOutletContext();
  const [viewMode, setViewMode] = useState("list");

  /**
   * Lời chào theo thời gian trong ngày (phụ, không icon màu trang trí)
   */
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Chào buổi sáng";
    if (hour >= 12 && hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  }, []);

  /**
   * Thống kê nhanh cho tháng này
   */
  const monthStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const thisMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    });

    const transactionCount = thisMonthTransactions.length;
    const avgDaily =
      thisMonthTransactions.length > 0
        ? Math.round(totalExpense / new Date().getDate())
        : 0;

    return { transactionCount, avgDaily };
  }, [transactions, totalExpense]);

  return (
    <div
      className={`space-y-5 sm:space-y-6 transition-opacity duration-300 ${
        isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Header */}
      <PageHeader
        eyebrow={`${greetingText} · ${format(new Date(), "EEEE, dd MMMM yyyy", {
          locale: vi,
        })}`}
        title="Tổng quan tài chính"
        subtitle={`${monthStats.transactionCount} giao dịch tháng này · trung bình ~${new Intl.NumberFormat(
          "vi-VN"
        ).format(monthStats.avgDaily)} VND/ngày`}
        actions={
          <>
            <ThemeButton />
            <RefreshButton />
          </>
        }
      />

      {/* Thẻ thống kê */}
      <StatsCards
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        balance={balance}
      />

      {/* Tabs: Danh sách / Lịch */}
      <div className="mt-1">
        <Tabs
          selectedKey={viewMode}
          onSelectionChange={setViewMode}
          aria-label="Chế độ xem"
          color="primary"
          variant="solid"
          radius="lg"
          classNames={{
            tabList: "bg-content2 p-1 rounded-[10px]",
            cursor: "bg-content1 shadow-sm rounded-lg",
            tab: "px-4 h-9",
            tabContent:
              "group-data-[selected=true]:text-primary group-data-[selected=true]:font-semibold text-default-600 font-medium",
          }}
        >
          <Tab
            key="list"
            title={
              <div className="flex items-center gap-2">
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Danh sách</span>
              </div>
            }
          >
            <div className="mt-4">
              <TransactionList
                transactions={transactions}
                onEdit={onEditTransaction}
                onDelete={deleteTransaction}
              />
            </div>
          </Tab>
          <Tab
            key="calendar"
            title={
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Lịch</span>
              </div>
            }
          >
            <div className="mt-4">
              <CalendarView transactions={transactions} />
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}

export default Dashboard;
