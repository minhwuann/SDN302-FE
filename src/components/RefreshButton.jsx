import { Button } from "@heroui/react";
import { RefreshCcw } from "lucide-react";
import { useTransactionsContext } from "../contexts/TransactionsContext";

/**
 * Component nút làm mới dữ liệu
 * Hiển thị icon refresh với animation khi đang loading
 */
const RefreshButton = () => {
  const { isLoading, refreshData } = useTransactionsContext();

  return (
    <Button
      isIconOnly
      variant="light"
      size="sm"
      onClick={refreshData}
      disabled={isLoading}
      className="text-default-600 hover:text-foreground"
      aria-label="Làm mới dữ liệu"
    >
      <RefreshCcw
        className={`w-[18px] h-[18px] ${isLoading ? "animate-spin" : ""}`}
        strokeWidth={2}
      />
    </Button>
  );
};

export default RefreshButton;

