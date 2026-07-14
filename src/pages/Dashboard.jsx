import { useState, useMemo } from "react";
import { Tabs, Tab, Chip } from "@heroui/react";
import {
  List,
  Calendar as CalendarIcon,
  Sun,
  Moon,
  Sunset,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import StatsCards from "../components/StatsCard";
import TransactionList from "../components/Transactions/TransactionList/TransactionList";
import CalendarView from "../components/Calendar/CalendarView";
import { AnimatedList } from "../components/magicui/AnimatedList";
import { TransactionNotification } from "../components/magicui/TransactionNotification";
import RefreshButton from "../components/RefreshButton";
import ThemeButton from "../components/ThemeButton";
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
   * Lấy greeting và icon theo thời gian trong ngày
   */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: "Chào buổi sáng", icon: Sun, color: "text-amber-500" };
    } else if (hour >= 12 && hour < 18) {
      return {
        text: "Chào buổi chiều",
        icon: Sunset,
        color: "text-orange-500",
      };
    } else {
      return { text: "Chào buổi tối", icon: Moon, color: "text-indigo-400" };
    }
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

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
      className={`space-y-4 sm:space-y-6 transition-opacity duration-300 ${
        isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Header cải tiến */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            {/* Greeting */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {greeting.text}
              </span>
            </div>
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
              Tổng Quan
            </h1>
            {/* Date */}
            <p className="text-sm text-gray-500 mt-1">
              {format(new Date(), "EEEE, dd MMMM yyyy", { locale: vi })}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeButton />
            <RefreshButton />
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Chip
            variant="flat"
            color="default"
            size="sm"
            className="text-gray-600 dark:text-gray-300 font-medium"
          >
            {monthStats.transactionCount} giao dịch tháng này
          </Chip>
          <Chip
            variant="flat"
            color="primary"
            size="sm"
            className="font-medium"
          >
            Trung bình {new Intl.NumberFormat("vi-VN").format(monthStats.avgDaily)} VND/ngày
          </Chip>
        </div>
      </div>

      {/* Thẻ thống kê */}
      <StatsCards
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        balance={balance}
      />

      {/* Hoạt động gần đây (Animated List) */}
      <div className="mt-4 sm:mt-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Hoạt động gần đây</h2>
        <div className="relative flex h-[350px] w-full flex-col overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
          <AnimatedList>
            {transactions.slice(0, 8).map((t) => (
              <TransactionNotification
                key={t.id}
                name={t.category?.name || "Giao dịch"}
                description={t.note || "Giao dịch qua Ví Vi Vu"}
                time={format(new Date(t.date), "dd/MM", { locale: vi })}
                icon={t.category?.icon || "💸"}
                color={t.type === "INCOME" ? "#00C9A7" : "#FF3D71"}
                amount={`${t.type === "INCOME" ? "+" : "-"}${new Intl.NumberFormat("vi-VN").format(t.amount)}đ`}
              />
            ))}
          </AnimatedList>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white dark:from-gray-900"></div>
        </div>
      </div>

      {/* Tabs: Danh sách / Lịch */}
      <div className="mt-4 sm:mt-8">
        <Tabs
          selectedKey={viewMode}
          onSelectionChange={setViewMode}
          aria-label="Chế độ xem"
          color="primary"
          variant="solid"
          classNames={{
            tabList: "bg-slate-100 dark:bg-slate-800 p-1 rounded-xl",
            cursor: "bg-white dark:bg-slate-700 shadow-sm",
            tab: "px-4 py-2",
            tabContent:
              "group-data-[selected=true]:text-primary-600 dark:group-data-[selected=true]:text-primary-400 font-medium",
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
