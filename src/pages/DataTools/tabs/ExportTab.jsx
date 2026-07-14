/**
 * Tab Xuất Dữ Liệu
 * Cho phép xuất dữ liệu ra Excel, Google Sheets, PDF
 */

import { Button, Chip } from "@heroui/react";
import {
  Download,
  FileSpreadsheet,
  Copy,
  FileText,
  ExternalLink,
} from "lucide-react";
import { ResultNotification } from "../components";

/**
 * ExportTab - Tab xuất dữ liệu
 * @param {number} transactionsCount - Số lượng giao dịch
 * @param {Function} onExportExcel - Callback xuất Excel
 * @param {Function} onExportGoogleSheets - Callback xuất Google Sheets
 * @param {Function} onExportPDF - Callback xuất PDF
 * @param {Function} onCopyToClipboard - Callback copy to clipboard
 * @param {boolean} isExporting - Đang xuất Excel
 * @param {boolean} isExportingToSheets - Đang xuất Google Sheets
 * @param {Object} exportResult - Kết quả xuất Excel
 * @param {Object} sheetsExportResult - Kết quả xuất Google Sheets
 */
const ExportTab = ({
  transactionsCount = 0,
  onExportExcel,
  onExportGoogleSheets,
  onExportPDF,
  onCopyToClipboard,
  isExporting = false,
  isExportingPdf = false,
  isExportingToSheets = false,
  exportResult = null,
  sheetsExportResult = null,
}) => {
  const exportOptions = [
    {
      id: "excel",
      title: "Xuất Excel (.xlsx)",
      description: "Tải về file Excel để sử dụng offline",
      icon: FileSpreadsheet,
      color: "primary",
      action: onExportExcel,
      isLoading: isExporting,
      isDisabled: transactionsCount === 0,
    },
    {
      id: "sheets",
      title: "Xuất Google Sheets",
      description: "Tạo spreadsheet mới trên Google Drive",
      icon: ExternalLink,
      color: "primary",
      action: onExportGoogleSheets,
      isLoading: isExportingToSheets,
      isDisabled: transactionsCount === 0,
    },
    {
      id: "pdf",
      title: "Xuất PDF",
      description: "Tải về báo cáo dạng PDF",
      icon: FileText,
      color: "primary",
      action: onExportPDF,
      isLoading: isExportingPdf,
      isDisabled: transactionsCount === 0,
    },
    {
      id: "clipboard",
      title: "Copy to Clipboard",
      description: "Sao chép dữ liệu dạng Tab để paste vào Excel",
      icon: Copy,
      color: "default",
      action: onCopyToClipboard,
      isLoading: false,
      isDisabled: transactionsCount === 0,
    },
  ];

  return (
    <div className="space-y-4 mt-4">
      {/* Stats Card */}
      <div className="flex items-center justify-between rounded-[14px] border border-divider bg-content1 p-4 sm:p-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Xuất dữ liệu
          </h3>
          <p className="text-sm text-default-600 mt-1">
            Xuất giao dịch ra các định dạng khác nhau
          </p>
        </div>
        <Chip size="lg" color="primary" variant="flat" className="vvv-tnum font-semibold">
          {transactionsCount} giao dịch
        </Chip>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {exportOptions.map((option) => {
          const Icon = option.icon;
          return (
            <div
              key={option.id}
              className="rounded-[14px] border border-divider bg-content1 p-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-[10px] bg-content2 text-default-600">
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">
                    {option.title}
                  </h4>
                  <p className="text-sm text-default-600 mb-3">
                    {option.description}
                  </p>
                  <Button
                    color={option.color}
                    variant={option.color === "default" ? "flat" : "solid"}
                    size="sm"
                    startContent={<Download className="w-4 h-4" />}
                    onPress={option.action}
                    isLoading={option.isLoading}
                    isDisabled={option.isDisabled}
                  >
                    Xuất
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Results */}
      <ResultNotification result={sheetsExportResult} type="export" />
      <ResultNotification result={exportResult} type="export" />

      {/* Empty State */}
      {transactionsCount === 0 && (
        <div className="rounded-[14px] border border-dashed border-divider bg-content1 py-8 text-center">
          <p className="text-sm text-default-600">
            Chưa có giao dịch nào để xuất. Hãy thêm giao dịch trước.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExportTab;
