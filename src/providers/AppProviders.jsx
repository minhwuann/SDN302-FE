import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { CategoryProvider } from "../contexts/CategoryContext";
import { TransactionsProvider } from "../contexts/TransactionsContext";
import { BudgetProvider } from "../contexts/BudgetContext";
import { DebtsProvider } from "../contexts/DebtsContext";
import { ChallengesProvider } from "../contexts/ChallengesContext";
import { NotificationProvider } from "../contexts/NotificationContext";

/**
 * DataProviders - Các providers cần user đăng nhập
 * Chỉ render khi user đã authenticated
 */
const DataProviders = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // Nếu đang loading hoặc chưa đăng nhập, chỉ render children không có data providers
  // Điều này tránh việc fetch data khi chưa có auth
  if (loading || !currentUser) {
    return <>{children}</>;
  }

  // User đã đăng nhập, wrap children với các data providers
  return (
    <NotificationProvider>
      <CategoryProvider>
        <TransactionsProvider>
          <BudgetProvider>
            <DebtsProvider>
              <ChallengesProvider>{children}</ChallengesProvider>
            </DebtsProvider>
          </BudgetProvider>
        </TransactionsProvider>
      </CategoryProvider>
    </NotificationProvider>
  );
};

/**
 * AppProviders - Wrapper cho tất cả Context Providers
 * Giúp App.jsx clean hơn, tránh nesting hell
 *
 * Cấu trúc:
 * 1. ThemeProvider - Global, không cần auth
 * 2. AuthProvider - Quản lý authentication
 * 3. DataProviders - Chỉ render khi đã đăng nhập
 */
const AppProviders = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProviders>{children}</DataProviders>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AppProviders;
