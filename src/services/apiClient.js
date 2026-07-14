/**
 * apiClient - Lớp gọi HTTP tới Backend Ví Vi Vu (Express /api/v1).
 *
 * Chức năng chính:
 *  - Đính kèm access token (Bearer) vào mọi request cần xác thực.
 *  - Tự động giải nén envelope chuẩn của BE: { data, meta, error }.
 *  - Tự refresh access token 1 lần khi gặp 401 rồi thử lại request.
 *  - Khi refresh thất bại -> xoá session và phát sự kiện "auth:logout"
 *    để AuthContext điều hướng về trang đăng nhập.
 */

import { getAccessToken, setTokens, clearTokens } from "./tokenStore";

/**
 * Chuẩn hoá base URL để tránh các lỗi cấu hình phổ biến:
 *  - Bỏ dấu "/" thừa ở cuối (tránh "//auth/...").
 *  - Tự thêm prefix "/api/v1" nếu URL chưa có (vd chỉ ghi domain Railway).
 */
function normalizeBaseUrl(raw) {
  let url = (raw || "http://localhost:3000/api/v1").trim().replace(/\/+$/, "");
  if (!/\/api\/v\d+$/.test(url)) {
    url += "/api/v1";
  }
  return url;
}

const BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

/** Sự kiện toàn cục báo cho app biết phiên đã hết hạn / không hợp lệ. */
export const AUTH_LOGOUT_EVENT = "auth:logout";

const emitLogout = () => {
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
};

/**
 * Lỗi chuẩn hoá từ BE để UI có thể đọc code/message/details.
 */
export class ApiError extends Error {
  constructor({ message, code, status, details }) {
    super(message || "Đã xảy ra lỗi khi gọi máy chủ");
    this.name = "ApiError";
    this.code = code || "UNKNOWN_ERROR";
    this.status = status;
    this.details = details || [];
  }
}

/** Ghép query string, bỏ qua giá trị null/undefined/"" . */
function buildQuery(query) {
  if (!query) return "";
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.append(key, value);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function parseResponse(response) {
  // 204 No Content hoặc body rỗng
  const text = await response.text();
  if (!text) return { data: null, error: null };
  try {
    return JSON.parse(text);
  } catch {
    return { data: text, error: null };
  }
}

let refreshPromise = null;

/**
 * Gọi BE để xoay vòng access token bằng refresh token.
 * Refresh token nằm trong cookie httpOnly (BE tự đọc/set), không còn ở JS.
 * Dùng chung 1 promise để tránh gọi refresh nhiều lần song song.
 */
async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      const payload = await parseResponse(response);
      if (!response.ok || payload.error) {
        return null;
      }
      const tokens = payload.data?.tokens;
      if (tokens) {
        setTokens(tokens);
        return tokens.accessToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Hàm request cốt lõi.
 * @param {string} method - GET/POST/PATCH/DELETE...
 * @param {string} path - đường dẫn sau BASE_URL, vd "/transactions"
 * @param {Object} [options]
 * @param {Object} [options.query] - query params
 * @param {Object} [options.body] - body JSON
 * @param {boolean} [options.auth=true] - có đính kèm access token không
 * @param {Object} [options.headers] - header bổ sung
 * @param {boolean} [options.raw=false] - trả nguyên Response (vd tải file)
 * @param {boolean} [_retry] - nội bộ, đánh dấu đã thử refresh
 */
async function request(method, path, options = {}, _retry = false) {
  const { query, body, auth = true, headers = {}, raw = false } = options;

  const finalHeaders = { ...headers };
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}${buildQuery(query)}`, {
    method,
    headers: finalHeaders,
    credentials: "include",
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
        ? body
        : JSON.stringify(body),
  });

  // Tải file (export) -> trả Response thô
  if (raw) {
    if (!response.ok) {
      const payload = await parseResponse(response);
      throw new ApiError({
        status: response.status,
        code: payload.error?.code,
        message: payload.error?.message,
        details: payload.error?.details,
      });
    }
    return response;
  }

  const payload = await parseResponse(response);

  // Token hết hạn -> thử refresh đúng 1 lần rồi gọi lại
  if (response.status === 401 && auth && !_retry) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      return request(method, path, options, true);
    }
    clearTokens();
    emitLogout();
  }

  if (!response.ok || payload.error) {
    throw new ApiError({
      status: response.status,
      code: payload.error?.code,
      message: payload.error?.message,
      details: payload.error?.details,
    });
  }

  return payload.data;
}

const apiClient = {
  get: (path, options) => request("GET", path, options),
  post: (path, body, options) => request("POST", path, { ...options, body }),
  patch: (path, body, options) => request("PATCH", path, { ...options, body }),
  put: (path, body, options) => request("PUT", path, { ...options, body }),
  delete: (path, options) => request("DELETE", path, options),
  request,
  baseUrl: BASE_URL,
};

export default apiClient;
