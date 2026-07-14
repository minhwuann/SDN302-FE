/**
 * Tab Paste từ Excel
 * Cho phép paste dữ liệu từ Excel và parse
 */

import { Card, CardBody, Button, Textarea } from "@heroui/react";
import { Download, Upload, Save } from "lucide-react";
import { IMPORT_TEXTAREA_PLACEHOLDER } from "../constants";
import {
  DataInputRow,
  ValidationStatus,
  ErrorList,
  ResultNotification,
} from "../components";

/**
 * PasteExcelTab - Tab paste dữ liệu từ Excel
 * @param {string} rawData - Dữ liệu thô từ textarea
 * @param {Function} onRawDataChange - Callback khi thay đổi raw data
 * @param {Array} parsedData - Dữ liệu đã parse
 * @param {Function} onAnalyze - Callback phân tích
 * @param {Function} onUpdateRow - Callback cập nhật dòng
 * @param {Function} onRemoveRow - Callback xóa dòng
 * @param {Function} onSaveAll - Callback lưu tất cả
 * @param {Function} onDownloadSample - Callback tải file mẫu
 * @param {boolean} isAnalyzing - Đang phân tích
 * @param {boolean} isSaving - Đang lưu
 * @param {Object} saveResult - Kết quả lưu
 */
const PasteExcelTab = ({
  rawData = "",
  onRawDataChange,
  parsedData = [],
  onAnalyze,
  onUpdateRow,
  onRemoveRow,
  onSaveAll,
  onDownloadSample,
  isAnalyzing = false,
  isSaving = false,
  saveResult = null,
}) => {
  // Tính toán valid/invalid
  const validCount = parsedData.filter((item) => item.isValid).length;
  const invalidCount = parsedData.filter((item) => !item.isValid).length;
  const errorRows = parsedData
    .filter((item) => !item.isValid)
    .map((item) => ({
      rowNumber: item.rowNumber,
      errors: item.errors,
    }));

  return (
    <div className="space-y-4 mt-4">
      {/* Download Sample Card */}
      <Card className="border border-divider bg-content1">
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">
                📥 Tải file mẫu Excel
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tải file mẫu để biết định dạng dữ liệu cần nhập
              </p>
            </div>
            <Button
              color="primary"
              variant="flat"
              startContent={<Download className="w-4 h-4" />}
              onPress={onDownloadSample}
            >
              Tải file mẫu
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Paste Area Card - Visual Design */}
      <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 transition-colors">
        <CardBody className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Header với icon */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                <Upload className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Dán dữ liệu từ Excel
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Copy từ Excel → Ctrl+V vào ô bên dưới
                </p>
              </div>
            </div>

            {/* Visual Column Headers */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                📋 Định dạng cột (cách nhau bằng Tab):
              </p>
              <div className="grid grid-cols-5 gap-2 text-center">
                <div className="bg-white dark:bg-gray-800 rounded px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                  📅 Ngày
                </div>
                <div className="bg-white dark:bg-gray-800 rounded px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                  💰 Số tiền
                </div>
                <div className="bg-white dark:bg-gray-800 rounded px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                  🏷️ Danh mục
                </div>
                <div className="bg-white dark:bg-gray-800 rounded px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                  📝 Ghi chú
                </div>
                <div className="bg-white dark:bg-gray-800 rounded px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                  🔄 Loại
                </div>
              </div>
            </div>

            {/* Textarea */}
            <Textarea
              value={rawData}
              onValueChange={onRawDataChange}
              placeholder="01/01/2024    50000    Ăn uống    Bữa trưa    expense&#10;02/01/2024    100000    Lương    Tháng 1    income&#10;&#10;💡 Paste dữ liệu từ Excel vào đây..."
              minRows={5}
              maxRows={8}
              variant="bordered"
              classNames={{
                input: "font-mono text-sm",
                inputWrapper: "bg-white dark:bg-gray-900",
              }}
            />

            {/* Sample Data Hint */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                expense = Chi tiêu
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                income = Thu nhập
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                Ngày: DD/MM/YYYY hoặc YYYY-MM-DD
              </span>
            </div>

            <Button
              color="primary"
              startContent={<Upload className="w-4 h-4" />}
              onPress={onAnalyze}
              isLoading={isAnalyzing}
              isDisabled={!rawData.trim()}
              className="w-full sm:w-auto"
              size="lg"
            >
              {isAnalyzing ? "Đang phân tích..." : "Phân tích dữ liệu"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <>
          {/* Validation Status */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <ValidationStatus
              validCount={validCount}
              invalidCount={invalidCount}
            />
            {validCount > 0 && (
              <Button
                color="success"
                startContent={<Save className="w-4 h-4" />}
                onPress={onSaveAll}
                isLoading={isSaving}
                isDisabled={isSaving || validCount === 0}
              >
                Lưu {validCount} giao dịch
              </Button>
            )}
          </div>

          {/* Table - Cuộn ngang trên mobile */}
          <Card className="border border-gray-200 dark:border-gray-800">
            <CardBody className="p-0">
              {/* Mobile scroll hint */}
              <div className="sm:hidden px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800">
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  👉 Vuốt ngang để xem thêm các cột
                </span>
              </div>

              {/* Horizontal scroll wrapper */}
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400">
                    <div className="col-span-1 text-center">STT</div>
                    <div className="col-span-2">Ngày</div>
                    <div className="col-span-2">Số tiền</div>
                    <div className="col-span-2">Danh mục</div>
                    <div className="col-span-1">Ghi chú</div>
                    <div className="col-span-1">Loại</div>
                    <div className="col-span-1">PT</div>
                    <div className="col-span-2 text-right">Trạng thái</div>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[400px] overflow-y-auto">
                    {parsedData.map((item) => (
                      <DataInputRow
                        key={item.id}
                        item={item}
                        onUpdate={onUpdateRow}
                        onRemove={onRemoveRow}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Error List */}
          {errorRows.length > 0 && <ErrorList errors={errorRows} />}
        </>
      )}

      {/* Result Notification */}
      <ResultNotification result={saveResult} type="save" />
    </div>
  );
};

export default PasteExcelTab;
