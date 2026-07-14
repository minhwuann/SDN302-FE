/**
 * Component hiển thị danh sách lỗi validation
 * Dùng chung cho cả PasteExcelTab và DirectInputTab
 */

import { Card, CardBody } from "@heroui/react";
import { AlertCircle } from "lucide-react";

/**
 * ErrorList - Hiển thị các dòng có lỗi
 * @param {Array} errors - Mảng các lỗi [{rowNumber, errors: string[]}]
 */
const ErrorList = ({ errors = [] }) => {
  if (errors.length === 0) return null;

  return (
    <Card
      radius="lg"
      className="shadow-none border bg-danger-50 border-danger-200 dark:bg-danger-500/10 dark:border-danger-500/30"
    >
      <CardBody className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">
              Các dòng có lỗi:
            </h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {errors.map((error, idx) => (
                <p key={idx} className="text-sm text-red-700 dark:text-red-400">
                  <span className="font-medium">Dòng {error.rowNumber}:</span>{" "}
                  {error.errors?.join(", ") || "Dữ liệu không hợp lệ"}
                </p>
              ))}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default ErrorList;
