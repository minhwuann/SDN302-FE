/**
 * exportApi - Xuất file giao dịch do BE tạo sẵn (tới 10.000 dòng).
 * BE: /api/v1/exports/transactions.{csv,xlsx,pdf}
 */
import apiClient from "./apiClient";

async function downloadBlob(path, query) {
  const response = await apiClient.get(path, { query, raw: true });
  return response.blob();
}

export const exportTransactionsCsv = (query) =>
  downloadBlob("/exports/transactions.csv", query);

export const exportTransactionsXlsx = (query) =>
  downloadBlob("/exports/transactions.xlsx", query);

export const exportTransactionsPdf = (query) =>
  downloadBlob("/exports/transactions.pdf", query);
