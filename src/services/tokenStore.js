/**
 * tokenStore - Quản lý lưu trữ token (JWT) ở localStorage.
 *
 * Thay thế cơ chế session của Firebase Auth. BE cấp (dạng body, KHÔNG dùng
 * cookie httpOnly):
 *  - accessToken: JWT ngắn hạn (mặc định 3 giờ) -> gửi kèm header Authorization
 *  - refreshToken: dài hạn (mặc định 30 ngày) -> FE lưu và gửi trong body khi
 *    gọi /auth/refresh và /auth/logout. BE xoay vòng refresh token mỗi lần
 *    refresh, nên phải lưu lại token MỚI sau mỗi lần gọi thành công.
 */

const ACCESS_TOKEN_KEY = "vivivu.accessToken";
const REFRESH_TOKEN_KEY = "vivivu.refreshToken";
const USER_KEY = "vivivu.user";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

/**
 * Lưu token sau khi đăng nhập / refresh thành công.
 * @param {{accessToken?: string, refreshToken?: string}} tokens
 */
export const setTokens = (tokens) => {
  if (!tokens) return;
  if (tokens.accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  }
  if (tokens.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
};

/** Xoá toàn bộ token + user đã cache (khi logout hoặc refresh thất bại). */
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/** Cache thông tin user (đã chuẩn hoá) để hiển thị tức thì khi tải lại trang. */
export const getCachedUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCachedUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

/**
 * Best-effort: refresh token nằm trong cookie httpOnly nên JS không biết
 * chắc phiên còn sống hay không (kể cả khi accessToken đã hết hạn/rỗng
 * sau khi F5). Chỉ dùng để quyết định có cần gọi /me ngay khi mount app;
 * nguồn sự thật cuối cùng luôn là kết quả gọi API (401 -> auth:logout).
 */
export const hasSession = () => Boolean(getAccessToken() || getCachedUser());
