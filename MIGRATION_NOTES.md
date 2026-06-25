# Ví Vi Vu — Chuyển FE từ Firebase sang Backend REST

FE đã được chuyển hoàn toàn từ **Firebase (Firestore + Firebase Auth)** sang
**Backend Express `/api/v1` + PostgreSQL + JWT**. Tài liệu này tóm tắt cách
cấu hình để chạy và những thay đổi quan trọng.

## 1. Biến môi trường FE (`.env`)

```
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_GOOGLE_CLIENT_ID=<web-oauth-client-id>.apps.googleusercontent.com
```

- `VITE_API_BASE_URL`: URL gốc Backend (kèm prefix `/api/v1`).
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth 2.0 Client ID **loại "Web application"**,
  dùng cho Google Identity Services. Giá trị này **phải nằm trong**
  `GOOGLE_CLIENT_IDS` của Backend.

## 2. Cấu hình Backend cần lưu ý

- **CORS**: thêm origin của FE (vd `http://localhost:5173`) vào `CORS_ORIGINS`
  trong `.env` của Backend, nếu không trình duyệt sẽ chặn request.
- **SMTP**: luồng đăng ký email dùng **OTP gửi qua email** (`SMTP_*`). Nếu chưa
  cấu hình SMTP, đăng ký bằng email/mật khẩu sẽ báo lỗi. Có thể dùng Gmail App
  Password (xem `.env.example` của BE).
- **Google**: cấu hình `GOOGLE_CLIENT_IDS` chứa Web Client ID ở trên.
- Chạy migrate + seed DB trước: `npm run migrate && npm run seed` (trong BE).

## 3. Thay đổi luồng xác thực

- **Đăng ký email**: nhập email/mật khẩu (≥ 8 ký tự) → BE gửi OTP 6 số qua email
  → nhập OTP để hoàn tất và tạo phiên.
- **Đăng nhập email**: yêu cầu email đã xác thực OTP.
- **Google**: dùng nút Google Identity Services (lấy `idToken` gửi lên
  `/auth/google`).
- Token JWT (accessToken 3h + refreshToken) lưu ở `localStorage`, tự refresh khi
  gặp 401 (xem `src/services/apiClient.js`, `tokenStore.js`).

## 4. Kiến trúc dữ liệu FE mới

- `src/services/apiClient.js`: lớp fetch chung (Bearer token, envelope
  `{data, meta, error}`, auto-refresh).
- API theo domain: `authApi`, `ledgerApi`, `categoryApi`, `paymentAccountApi`,
  `transactionApi`, `budgetApi`, `goalService`, `debtsService`,
  `challengesService`, `shoppingApi`.
- Mô hình **refetch sau mỗi thao tác** (thay cho realtime `onSnapshot`).
- **Sổ (ledger)** giờ là tài nguyên thật (UUID); sổ hiện tại lưu id ở
  `localStorage` key `currentLedgerId`.
- **Danh mục**: lấy từ BE (BE tự seed mặc định). Map tên ↔ `categoryId` (UUID)
  khi tạo/sửa giao dịch. Icon hiển thị được map sang emoji theo tên danh mục.

## 5. Khác biệt mô hình cần biết

- Giao dịch: FE `category` ("Cha > Con") ↔ BE `categoryId`/`subcategoryId`;
  `bankName` ↔ `paymentAccountId`; `amount` ↔ `amountVnd`.
- Nợ: FE `borrow`/`lend` ↔ BE `borrowed`/`lent`.
- Thử thách: BE chỉ lưu `name/target/ngày` + tiến độ qua check-in; các field UI
  phụ (mô tả, dailyTarget) không được BE lưu.
- AI (Gemini) vẫn chạy BYOK phía client; thao tác đọc/ghi giao dịch đi qua API.
