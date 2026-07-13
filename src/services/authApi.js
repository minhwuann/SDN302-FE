/**
 * authApi - Gói các endpoint xác thực của Backend (/api/v1/auth, /api/v1/me).
 *
 * Luồng email/password của BE dùng OTP:
 *   register -> (BE gửi OTP qua email) -> verify (tạo session) | login
 * Google: lấy idToken từ Google Identity Services rồi gửi lên /auth/google.
 */

import apiClient from "./apiClient";
import { setTokens, clearTokens, setCachedUser } from "./tokenStore";

/**
 * Chuẩn hoá user của BE về shape tương thích với code FE cũ (vốn dùng Firebase).
 * Giữ cả `uid` (alias của id) và `photoURL` (alias avatarUrl) để không phải sửa
 * hàng loạt component đang đọc currentUser.uid / currentUser.photoURL.
 */
export function normalizeUser(user) {
  if (!user) return null;
  return {
    ...user,
    uid: user.id,
    photoURL: user.avatarUrl || null,
    displayName: user.displayName || user.email?.split("@")[0] || "Người dùng",
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}

/** Lưu session trả về từ các endpoint auth ({ user, tokens }). */
function persistSession(session) {
  if (!session) return null;
  setTokens(session.tokens);
  const user = normalizeUser(session.user);
  setCachedUser(user);
  return user;
}

/* ----------------------------- Email / Password ---------------------------- */

/** Bước 1: đăng ký -> BE tạo & gửi OTP qua email. Trả { email, otpExpiresAt, ... }. */
export const registerEmail = ({ email, password, displayName }) =>
  apiClient.post(
    "/auth/email/register",
    { email, password, ...(displayName ? { displayName } : {}) },
    { auth: false }
  );

/** Bước 2: xác thực OTP -> tạo session đăng nhập. */
export const verifyEmailOtp = async ({ email, otpCode }) => {
  const data = await apiClient.post(
    "/auth/email/verify",
    { email, otpCode },
    { auth: false }
  );
  return persistSession(data);
};

/** Gửi lại OTP cho email đang chờ xác thực. */
export const resendEmailOtp = (email) =>
  apiClient.post("/auth/email/resend-otp", { email }, { auth: false });

/** Bước 1 quên mật khẩu: yêu cầu OTP đặt lại mật khẩu (luôn trả về ok dù email có tồn tại hay không). */
export const forgotPassword = (email) =>
  apiClient.post("/auth/email/forgot-password", { email }, { auth: false });

/** Bước 2 quên mật khẩu: xác thực OTP + đặt mật khẩu mới. */
export const resetPassword = ({ email, otpCode, newPassword }) =>
  apiClient.post(
    "/auth/email/reset-password",
    { email, otpCode, newPassword },
    { auth: false }
  );

/** Đăng nhập email/password (yêu cầu email đã xác thực). */
export const loginEmail = async ({ email, password }) => {
  const data = await apiClient.post(
    "/auth/email/login",
    { email, password },
    { auth: false }
  );
  return persistSession(data);
};

/* --------------------------------- Google --------------------------------- */

/** Đăng nhập / đăng ký bằng Google idToken (lấy từ GIS). */
export const loginWithGoogle = async (idToken) => {
  const data = await apiClient.post(
    "/auth/google",
    { idToken },
    { auth: false }
  );
  return persistSession(data);
};

/** Liên kết Google vào tài khoản email/password đang đăng nhập. */
export const linkGoogleAccount = async (idToken) => {
  const data = await apiClient.post("/auth/google/link", { idToken });
  const user = normalizeUser(data.user);
  setCachedUser(user);
  return user;
};

/* --------------------------------- Session -------------------------------- */

/** Lấy thông tin user hiện tại + settings + ledger mặc định. */
export const fetchMe = async () => {
  const data = await apiClient.get("/me");
  const user = normalizeUser(data.user);
  setCachedUser(user);
  return { user, settings: data.settings, defaultLedger: data.defaultLedger };
};

/** Cập nhật hồ sơ / settings. */
export const updateMe = async (payload) => {
  const data = await apiClient.patch("/me", payload);
  const user = normalizeUser(data.user);
  setCachedUser(user);
  return { user, settings: data.settings, defaultLedger: data.defaultLedger };
};

/* ------------------------------ Bảo mật (Me) ------------------------------ */

/** Đổi mật khẩu khi đang đăng nhập (yêu cầu mật khẩu hiện tại). */
export const changePassword = ({ currentPassword, newPassword }) =>
  apiClient.post("/me/change-password", { currentPassword, newPassword });

/** Danh sách phiên đăng nhập đang hoạt động. */
export const listSessions = async () => {
  const data = await apiClient.get("/me/sessions");
  return data.sessions || [];
};

/** Thu hồi 1 phiên đăng nhập cụ thể. */
export const revokeSession = (sessionId) =>
  apiClient.delete(`/me/sessions/${sessionId}`);

/** Thu hồi toàn bộ phiên đăng nhập (đăng xuất khỏi mọi thiết bị). */
export const revokeAllSessions = () =>
  apiClient.post("/me/sessions/revoke-all");

/** Đăng xuất: thu hồi refresh token ở BE (đọc từ cookie httpOnly) rồi xoá local. */
export const logout = async () => {
  try {
    await apiClient.post("/auth/logout", undefined, { auth: false });
  } catch {
    // Bỏ qua lỗi mạng khi logout - vẫn xoá phiên local
  } finally {
    clearTokens();
  }
};
