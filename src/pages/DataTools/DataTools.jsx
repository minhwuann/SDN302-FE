/**
 * DataTools Page - Trang Công cụ Dữ liệu
 * Refactored: Chia nhỏ thành components và tabs riêng biệt
 *
 * Cấu trúc folder:
 * - components/: Các component dùng chung (ValidationStatus, ErrorList, etc.)
 * - tabs/: Các tab components (PasteExcelTab, DirectInputTab, ExportTab)
 * - useDataTools.js: Logic hook
 * - constants.js: Các hằng số
 */

import { Tabs, Tab } from "@heroui/react";
import { Database, Upload, Table2, Download, Settings, Landmark } from "lucide-react";
import { useDataTools } from "./useDataTools";
import { PasteExcelTab, DirectInputTab, ExportTab } from "./tabs";
import CategoryManager from "../../components/CategoryManager/CategoryManager";
import PaymentAccountManager from "../../components/PaymentAccountManager/PaymentAccountManager";
import ThemeButton from "../../components/ThemeButton";
import RefreshButton from "../../components/RefreshButton";

/**
 * DataTools - Trang chính Công cụ Dữ liệu
 * Chỉ chứa layout và routing giữa các tabs
 */
function DataTools() {
  const {
    // Paste Excel Tab
    rawData,
    setRawData,
    parsedData,
    isAnalyzing,
    isRevalidating,
    handleAnalyze,
    updateParsedItem,
    removeParsedItem,
    handleDownloadSample,
    handlePasteImportCommit,

    // Direct Input Tab
    directInputData,
    addNewDirectInputRow,
    updateDirectInputItem,
    removeDirectInputItem,
    handleDirectInputSaveAll,

    // Export Tab
    transactionsCount,
    isExporting,
    isExportingToSheets,
    exportResult,
    sheetsExportResult,
    handleExportToExcel,
    handleCopyToClipboard,
    handleExportToGoogleSheets,
    handleExportPDF,

    // Shared
    isSaving,
    saveResult,
  } = useDataTools();

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Công Cụ Dữ Liệu
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nhập/Xuất dữ liệu • Excel • Google Sheets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeButton />
            <RefreshButton />
          </div>
        </div>

        {/* Mobile Tip */}
        <div className="sm:hidden mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            💡 <strong>Mẹo:</strong> Vuốt ngang trên bảng nhập liệu để xem thêm
            các cột. Xoay ngang điện thoại sẽ tiện hơn!
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        aria-label="Data Tools Tabs"
        variant="underlined"
        color="primary"
        size="md"
        className="w-full"
        classNames={{
          tabList:
            "gap-4 w-full relative rounded-none p-0 border-b border-divider overflow-x-auto",
          cursor: "w-full bg-primary",
          tab: "min-w-fit px-0 h-12",
          tabContent:
            "group-data-[selected=true]:text-primary font-medium text-sm sm:text-base",
        }}
      >
        {/* Tab 1: Paste từ Excel */}
        <Tab
          key="paste"
          title={
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Paste Excel</span>
            </div>
          }
        >
          <PasteExcelTab
            rawData={rawData}
            onRawDataChange={setRawData}
            parsedData={parsedData}
            onAnalyze={handleAnalyze}
            onUpdateRow={updateParsedItem}
            onRemoveRow={removeParsedItem}
            onSaveAll={handlePasteImportCommit}
            onDownloadSample={handleDownloadSample}
            isAnalyzing={isAnalyzing}
            isSaving={isSaving || isRevalidating}
            saveResult={saveResult}
          />
        </Tab>

        {/* Tab 2: Nhập Thủ Công */}
        <Tab
          key="direct-input"
          title={
            <div className="flex items-center gap-2">
              <Table2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Nhập Thủ Công</span>
            </div>
          }
        >
          <DirectInputTab
            data={directInputData}
            onAddRow={addNewDirectInputRow}
            onUpdateRow={updateDirectInputItem}
            onRemoveRow={removeDirectInputItem}
            onSaveAll={handleDirectInputSaveAll}
            isSaving={isSaving}
            saveResult={saveResult}
          />
        </Tab>

        {/* Tab 3: Xuất Dữ Liệu */}
        <Tab
          key="export"
          title={
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Xuất Dữ Liệu</span>
            </div>
          }
        >
          <ExportTab
            transactionsCount={transactionsCount}
            onExportExcel={handleExportToExcel}
            onExportGoogleSheets={handleExportToGoogleSheets}
            onExportPDF={handleExportPDF}
            onCopyToClipboard={handleCopyToClipboard}
            isExporting={isExporting}
            isExportingToSheets={isExportingToSheets}
            exportResult={exportResult}
            sheetsExportResult={sheetsExportResult}
          />
        </Tab>

        {/* Tab 4: Danh Mục */}
        <Tab
          key="categories"
          title={
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Danh Mục</span>
            </div>
          }
        >
          <div className="mt-4">
            <CategoryManager />
          </div>
        </Tab>

        {/* Tab 5: Tài Khoản Thanh Toán */}
        <Tab
          key="payment-accounts"
          title={
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Tài Khoản</span>
            </div>
          }
        >
          <div className="mt-4">
            <PaymentAccountManager />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

export default DataTools;
