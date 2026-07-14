/**
 * importApi - Import giao dịch qua job preview/commit của BE.
 * BE: /api/v1/imports. BE tự parse + validate từng dòng (category/tài khoản
 * phải khớp tên thật của user) và audit log, thay vì FE tự parse rồi gọi
 * thẳng /transactions/bulk như trước.
 */
import apiClient from "./apiClient";

/**
 * Gửi nội dung thô (CSV/TSV có header hoặc base64 xlsx) để BE parse + validate.
 * @param {{ledgerId: string, sourceType: 'csv'|'xlsx'|'paste_text', content?: string, contentBase64?: string}} payload
 * @returns {Promise<Object>} import job (có job.summary.rows[])
 */
export const previewImport = async (payload) => {
  const data = await apiClient.post("/imports/preview", payload);
  return data.job;
};

/** Tạo giao dịch cho các dòng hợp lệ của 1 job đã preview. */
export const commitImport = async (jobId) => {
  const data = await apiClient.post(`/imports/${jobId}/commit`);
  return data; // { job, transactions }
};
