/**
 * Component hiển thị kết quả save/export
 * Dùng chung cho các tabs
 */

import { Card, CardBody, Button } from "@heroui/react";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";

/**
 * ResultNotification - Hiển thị kết quả thành công/thất bại
 * @param {Object} result - {success, saved?, error?, message?, spreadsheetUrl?}
 * @param {string} type - "save" | "export"
 */
const ResultNotification = ({ result, type = "save" }) => {
  if (!result) return null;

  const isSuccess = result.success;

  return (
    <Card
      radius="lg"
      className={`shadow-none border ${
        isSuccess
          ? "bg-success-50 border-success-200 dark:bg-success-500/10 dark:border-success-500/30"
          : "bg-danger-50 border-danger-200 dark:bg-danger-500/10 dark:border-danger-500/30"
      }`}
    >
      <CardBody className="p-4">
        {isSuccess ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-800/50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">
                  {type === "save"
                    ? "Lưu thành công!"
                    : "Xuất dữ liệu thành công!"}
                </p>
                {result.saved && (
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Đã lưu {result.saved} giao dịch
                  </p>
                )}
                {result.message && (
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {result.message}
                  </p>
                )}
              </div>
            </div>
            {result.spreadsheetUrl && (
              <Button
                color="success"
                variant="flat"
                size="sm"
                startContent={<ExternalLink className="w-4 h-4" />}
                onPress={() => window.open(result.spreadsheetUrl, "_blank")}
              >
                Mở Google Sheet
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">
                {type === "save"
                  ? "Lỗi khi lưu dữ liệu"
                  : "Lỗi khi xuất dữ liệu"}
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                {result.error}
              </p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default ResultNotification;
