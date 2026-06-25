/**
 * googleAuth - Tích hợp Google Identity Services (GIS) cho web.
 *
 * Mục tiêu: lấy được Google ID token (JWT) ở phía client rồi gửi lên BE
 * (POST /api/v1/auth/google { idToken }). Đây là cách chính chủ thay thế
 * cho Firebase popup, không cần SDK Firebase.
 *
 * Yêu cầu: biến môi trường VITE_GOOGLE_CLIENT_ID (loại "Web application")
 * và client id này phải nằm trong GOOGLE_CLIENT_IDS của Backend.
 */

const GIS_SRC = "https://accounts.google.com/gsi/client";

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

let scriptPromise = null;
let initialized = false;
// Giữ handler mới nhất để callback (đăng ký 1 lần) luôn gọi đúng closure hiện tại
let currentOnCredential = null;
let currentOnError = null;

/** Tải script GIS một lần duy nhất. */
export function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Không tải được Google Identity Services"))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Không tải được Google Identity Services"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Render nút "Đăng nhập với Google" chính chủ vào element cho trước.
 * @param {HTMLElement} element - container để render nút
 * @param {(idToken: string) => void} onCredential - nhận ID token khi đăng nhập
 * @param {(err: Error) => void} [onError]
 */
export async function renderGoogleButton(element, onCredential, onError) {
  if (!GOOGLE_CLIENT_ID) {
    onError?.(
      new Error(
        "Thiếu VITE_GOOGLE_CLIENT_ID. Vui lòng cấu hình Google OAuth Client ID."
      )
    );
    return;
  }
  try {
    await loadGoogleScript();
    // Luôn cập nhật handler mới nhất; chỉ initialize() đúng 1 lần để tránh
    // cảnh báo "initialize() is called multiple times".
    currentOnCredential = onCredential;
    currentOnError = onError;
    if (!initialized) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response?.credential) {
            currentOnCredential?.(response.credential);
          } else {
            currentOnError?.(new Error("Không nhận được thông tin từ Google"));
          }
        },
      });
      initialized = true;
    }
    if (element) {
      window.google.accounts.id.renderButton(element, {
        theme: "outline",
        size: "large",
        width: element.offsetWidth || 320,
        text: "signin_with",
        shape: "rectangular",
        locale: "vi",
      });
    }
  } catch (err) {
    onError?.(err);
  }
}

export const isGoogleConfigured = () => Boolean(GOOGLE_CLIENT_ID);

/**
 * Lấy Google OAuth access token (cho Google Sheets/Drive) qua GIS token client.
 * Thay thế cho signInWithPopup của Firebase.
 * @param {string} scope - chuỗi scope, mặc định drive.file
 * @returns {Promise<string>} access token
 */
export function getGoogleAccessToken(
  scope = "https://www.googleapis.com/auth/drive.file"
) {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error("Thiếu VITE_GOOGLE_CLIENT_ID."));
      return;
    }
    loadGoogleScript()
      .then(() => {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope,
          callback: (response) => {
            if (response?.access_token) {
              resolve(response.access_token);
            } else {
              reject(new Error("Không lấy được access token từ Google"));
            }
          },
          error_callback: (err) =>
            reject(new Error(err?.message || "Đăng nhập Google bị huỷ")),
        });
        client.requestAccessToken();
      })
      .catch(reject);
  });
}
