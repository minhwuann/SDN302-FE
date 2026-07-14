import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import AppProviders from "./providers/AppProviders";
import AppRoutes from "./routes";

/**
 * App Component - Entry point của ứng dụng
 *
 * Cấu trúc clean:
 * - ErrorBoundary: Bắt lỗi React
 * - AppProviders: Tất cả Context Providers
 * - Toaster: Thông báo pop-up
 * - BrowserRouter: Routing
 * - AppRoutes: Định nghĩa routes
 */
function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProviders>
    </ErrorBoundary>
  );
}

export default App;
