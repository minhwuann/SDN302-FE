# 💰 Ví Vi Vu - Personal Expense Tracker

Ứng dụng quản lý thu chi cá nhân thông minh với trợ lý AI tích hợp.

## 🌐 Demo

👉 **[Ví Vi Vu](https://vivivu.vercel.app/)**

> Đăng ký bằng email hoặc đăng nhập nhanh bằng Google để trải nghiệm đầy đủ tính năng.

---

## ✨ Tính năng

| Tính năng              | Mô tả                                               |
| ---------------------- | ---------------------------------------------------- |
| 📊 **Quản lý Thu Chi** | Phân loại danh mục 2 cấp, tuỳ chỉnh emoji & màu sắc   |
| 💳 **Tài khoản thanh toán** | Tiền mặt, ngân hàng, ví điện tử — tự thêm/sửa/xoá |
| 🤖 **Trợ lý AI**       | Thêm giao dịch & tra cứu dữ liệu bằng ngôn ngữ tự nhiên |
| 📅 **Lịch Chi Tiêu**   | Xem giao dịch theo dạng calendar                      |
| 📈 **Thống kê**        | Biểu đồ Pie, Bar, Biến động Thu/Chi                   |
| 💰 **Ngân sách**       | Đặt ngân sách theo danh mục                           |
| 🛍️ **Sổ Mua Sắm**      | Lên kế hoạch chi tiêu cho sự kiện                     |
| 📥 **Xuất/Nhập**       | CSV, Excel, PDF (hỗ trợ tiếng Việt), Google Sheets    |
| 🔔 **Thông báo**       | Thông báo trong app cho nhắc nhở, cảnh báo ngân sách  |
| 📱 **Mobile-First**    | Giao diện tối ưu cho điện thoại                       |
| 🌙 **Dark Mode**       | Giao diện sáng/tối                                    |
| 🔐 **Bảo mật**         | Đăng nhập email/mật khẩu (OTP) hoặc Google, đổi mật khẩu, quản lý phiên đăng nhập |

---

## 🛠️ Tech Stack

- **Frontend**: React 19 (Vite), JavaScript/ES6+
- **Styling**: Tailwind CSS 3.4
- **UI Library**: Hero UI (formerly NextUI)
- **Charts**: Recharts
- **Backend**: Express.js + PostgreSQL (repo riêng: `vi-vi-vu-api`), xác thực bằng
  JWT (access token) + refresh token trong cookie httpOnly, đăng nhập email/mật khẩu
  qua OTP hoặc Google Identity Services
- **AI**: Gemini, gọi qua Backend (không cần API key phía client)
- **Icons**: lucide-react
- **Date**: date-fns

---

## 🚀 Cài đặt & Chạy

```bash
# Clone repo
git clone https://github.com/phuc220204/ExpenseTrackerApp.git
cd ExpenseTrackerApp

# Cài đặt dependencies
npm install --legacy-peer-deps

# Chạy development server
npm run dev

# Build production
npm run build
```

---

## ⚙️ Cấu hình

Tạo file `.env` ở thư mục gốc với các biến sau:

```env
# URL của Backend (vi-vi-vu-api), bao gồm prefix /api/v1
VITE_API_BASE_URL=http://localhost:3000/api/v1

# Google OAuth Client ID (loại "Web application"), dùng cho đăng nhập/liên kết Google
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Backend cần chạy song song (xem README của repo `vi-vi-vu-api`) và Google Client ID
phải nằm trong danh sách `GOOGLE_CLIENT_IDS` được cấu hình ở Backend.

---

## 📄 Legal

- [Chính sách bảo mật](https://vivivu.vercel.app/privacy-policy)
- [Điều khoản dịch vụ](https://vivivu.vercel.app/terms-of-service)

---

## 📝 License

MIT © 2024 [phuc220204](https://github.com/phuc220204)
