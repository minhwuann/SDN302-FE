import { Button } from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

/**
 * Component nút chuyển đổi theme (Light/Dark)
 * Hiển thị icon Sun/Moon nhỏ gọn, tái sử dụng được
 */
const ThemeButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      isIconOnly
      variant="light"
      size="sm"
      onClick={toggleTheme}
      className="text-default-600 hover:text-foreground"
      aria-label={theme === "light" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng"}
    >
      {theme === "light" ? (
        <Moon className="w-[18px] h-[18px]" strokeWidth={2} />
      ) : (
        <Sun className="w-[18px] h-[18px]" strokeWidth={2} />
      )}
    </Button>
  );
};

export default ThemeButton;
