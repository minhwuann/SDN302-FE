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
import PageHeader from "../../components/ui/PageHeader";

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
      <PageHeader
        title="Kế hoạch tài chính"
        subtitle="Quản lý ngân sách, mục tiêu tiết kiệm và kế hoạch mua sắm"
        actions={
          <>
            <ThemeButton />
            <RefreshButton />
          </>
        }
      />

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
              "group-data-[selected=true]:text-primary group-data-[selected=true]:font-semibold text-default-600 font-medium text-sm sm:text-base",
          }}
        >
          <Tab
            key="budget"
            title={
              <div className="flex items-center space-x-2">
                <PiggyBank size={20} />
                <span>Ngân Sách</span>
              </div>
            }
          >
            <div className="pt-4">
              <BudgetTab />
            </div>
          </Tab>
          <Tab
            key="goals"
            title={
              <div className="flex items-center space-x-2">
                <Target size={20} />
                <span>Tiết Kiệm</span>
              </div>
            }
          >
            <div className="pt-4">
              <Suspense fallback={<Spinner size="lg" label="Đang tải..." />}>
                <GoalsTab />
              </Suspense>
            </div>
          </Tab>
          <Tab
            key="debts"
            title={
              <div className="flex items-center space-x-2">
                <HandCoins size={20} />
                <span>Món Nợ</span>
              </div>
            }
          >
            <div className="pt-4">
              <Suspense fallback={<Spinner size="lg" label="Đang tải..." />}>
                <DebtsTab />
              </Suspense>
            </div>
          </Tab>
          <Tab
            key="challenges"
            title={
              <div className="flex items-center space-x-2">
                <Trophy size={20} />
                <span>Thử Thách</span>
              </div>
            }
          >
            <div className="pt-4">
              <Suspense fallback={<Spinner size="lg" label="Đang tải..." />}>
                <ChallengesTab />
              </Suspense>
            </div>
          </Tab>
          <Tab
            key="shopping"
            title={
              <div className="flex items-center space-x-2">
                <ClipboardList size={20} />
                <span>Mua Sắm</span>
              </div>
            }
          >
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
