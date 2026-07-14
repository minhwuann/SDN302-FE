import { Tabs, Tab } from "@heroui/react";
import {
  PiggyBank,
  ClipboardList,
  Target,
  HandCoins,
  Trophy,
} from "lucide-react";
import { Suspense, lazy } from "react";
import { Spinner } from "@heroui/react";
import BudgetTab from "./BudgetTab"; // Use local BudgetTab
import ShoppingListTab from "./ShoppingListTab";
import ThemeButton from "../../components/ThemeButton";
import RefreshButton from "../../components/RefreshButton";

// Lazy load các tab để tối ưu performance
const GoalsTab = lazy(() => import("../Goals"));
const DebtsTab = lazy(() => import("./DebtsTab"));
const ChallengesTab = lazy(() => import("./ChallengesTab"));

/**
 * Trang Kế Hoạch Tổng Hợp
 * Chứa 5 tab:
 * 1. Ngân Sách (Quản lý limit hàng tháng)
 * 2. Tiết Kiệm (Savings Goals)
 * 3. Món Nợ (Debts tracking)
 * 4. Thử Thách (Savings Challenges)
 * 5. Mua Sắm (Shopping List)
 */
const Planning = () => {
  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
            Kế Hoạch Tài Chính
          </h1>
          <p className="text-slate-500">
            Quản lý ngân sách, mục tiêu tiết kiệm và kế hoạch mua sắm
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeButton />
          <RefreshButton />
        </div>
      </div>

      <div className="flex w-full flex-col">
        <Tabs
          aria-label="Planning Options"
          color="primary"
          variant="underlined"
          classNames={{
            tabList:
              "gap-4 w-full relative rounded-none p-0 border-b border-divider overflow-x-auto",
            cursor: "w-full bg-primary",
            tab: "max-w-fit px-0 h-12",
            tabContent:
              "group-data-[selected=true]:text-primary text-slate-700 dark:text-slate-300 font-medium text-base md:text-lg",
          }}
        >
          <Tab key="budget" title="Ngân Sách">
            <div className="pt-4">
              <BudgetTab />
            </div>
          </Tab>
          <Tab key="goals" title="Tiết Kiệm">
            <div className="pt-4">
              <Suspense fallback={<Spinner size="lg" label="Đang tải..." />}>
                <GoalsTab />
              </Suspense>
            </div>
          </Tab>
          <Tab key="debts" title="Món Nợ">
            <div className="pt-4">
              <Suspense fallback={<Spinner size="lg" label="Đang tải..." />}>
                <DebtsTab />
              </Suspense>
            </div>
          </Tab>
          <Tab key="challenges" title="Thử Thách">
            <div className="pt-4">
              <Suspense fallback={<Spinner size="lg" label="Đang tải..." />}>
                <ChallengesTab />
              </Suspense>
            </div>
          </Tab>
          <Tab key="shopping" title="Mua Sắm">
            <div className="pt-4">
              <ShoppingListTab />
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default Planning;
