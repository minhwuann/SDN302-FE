import { Button } from "@heroui/react";
import { Home, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import VantaBackground from "../components/VantaBackground";

const NotFound = () => {
  return (
    <VantaBackground>
      <div className="text-center bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-gray-800/50 p-12 rounded-3xl">
        <AlertTriangle className="w-24 h-24 text-warning mx-auto mb-6" />
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-6">
          Trang không tồn tại
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
          Đường dẫn bạn truy cập có vẻ không đúng hoặc trang này đã bị xóa.
        </p>
        <Button
          as={Link}
          to="/"
          color="primary"
          variant="shadow"
          startContent={<Home className="w-4 h-4" />}
        >
          Trở về Trang chủ
        </Button>
      </div>
    </VantaBackground>
  );
};

export default NotFound;
