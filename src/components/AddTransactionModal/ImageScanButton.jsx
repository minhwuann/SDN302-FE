import { useRef, useState } from "react";
import { Spinner } from "@heroui/react";
import { Camera, AlertCircle } from "lucide-react";
import * as aiApi from "../../services/aiApi";

/** Chuyển File ảnh -> { base64, mimeType } (không kèm prefix "data:...;base64,"). */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Component khu vực quét hóa đơn/ảnh chuyển khoản
 * Thiết kế: Dashed border box với icon camera và helper text
 * Dùng /api/v1/ai/receipt-scan của BE (Gemini key giữ ở server)
 *
 * @param {string} ledgerId - Sổ hiện tại (bắt buộc để BE xác thực + gợi ý danh mục/tài khoản)
 * @param {Function} onExtracted - Callback khi AI trích xuất xong, nhận data object { amount, date, description, category }
 * @param {boolean} disabled - Vô hiệu hóa nút
 */
const ImageScanButton = ({ ledgerId, onExtracted, disabled = false }) => {
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Xử lý khi người dùng chọn file ảnh
   * Gọi BE (/ai/receipt-scan) để trích xuất thông tin
   */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setIsLoading(true);

    try {
      if (!ledgerId) {
        throw new Error("Vui lòng chọn sổ thu chi trước khi quét hóa đơn");
      }

      if (!file.type.startsWith("image/")) {
        throw new Error("Vui lòng chọn file ảnh (jpg, png, webp)");
      }

      const { base64, mimeType } = await fileToBase64(file);
      const result = await aiApi.scanReceipt({
        ledgerId,
        imageBase64: base64,
        mimeType,
      });

      if (result.missingFields?.length > 0 && result.clarification) {
        setError(result.clarification);
      }

      if (result.legacy?.amount) {
        onExtracted(result.legacy);
      } else if (!result.missingFields?.length) {
        throw new Error("Không thể trích xuất thông tin từ ảnh");
      }
    } catch (err) {
      console.error("Lỗi khi quét ảnh:", err);
      setError(err.message || "Có lỗi xảy ra khi xử lý ảnh");
    } finally {
      setIsLoading(false);
      // Reset input để có thể chọn lại cùng file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /**
   * Mở dialog chọn file khi click nút
   */
  const handleClick = () => {
    setError("");
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Divider với text */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
          Hoặc quét hóa đơn
        </span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Input file ẩn */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Khu vực quét - dashed border box */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`
          w-full py-4 px-4
          border-2 border-dashed rounded-xl
          flex items-center justify-center gap-2
          transition-all duration-200
          ${
            disabled || isLoading
              ? "border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50"
              : "border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5 cursor-pointer"
          }
        `}
      >
        {isLoading ? (
          <>
            <Spinner size="sm" color="primary" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Đang phân tích...
            </span>
          </>
        ) : (
          <>
            <Camera size={20} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Quét hóa đơn (Tự động điền)
            </span>
          </>
        )}
      </button>

      {/* Helper text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Tải lên ảnh hóa đơn để AI tự động trích xuất thông tin giao dịch.
      </p>

      {/* Hiển thị lỗi */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-danger bg-danger/10 py-3 px-3 rounded-lg">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ImageScanButton;
