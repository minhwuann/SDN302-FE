import { LegalDoc } from "./PrivacyPolicy";

/**
 * Trang Điều Khoản Dịch Vụ.
 * Dùng chung layout tài liệu pháp lý (LegalDoc). Nội dung giữ nguyên.
 */

const FEATURES = [
  "📝 Ghi chép thu chi",
  "📊 Thống kê & biểu đồ",
  "💰 Quản lý ngân sách",
  "🤖 Trợ lý AI thông minh",
  "📤 Xuất báo cáo",
];

const RESTRICTIONS = [
  "Sử dụng cho mục đích bất hợp pháp",
  "Truy cập trái phép vào hệ thống",
  "Phá hoại hoạt động của ứng dụng",
  "Chia sẻ tài khoản cho người khác",
];

const DISCLAIMERS = [
  "Ứng dụng được cung cấp 'nguyên trạng' (as-is)",
  "Không chịu trách nhiệm về mất mát dữ liệu do lỗi kỹ thuật",
  "Không thay thế tư vấn tài chính chuyên nghiệp",
];

const SECTIONS = [
  {
    id: "mo-ta",
    title: "1. Mô tả dịch vụ",
    body: (
      <>
        <p>Ví Vi Vu là ứng dụng quản lý tài chính cá nhân, cung cấp:</p>
        <ul className="vvv-legal-list mt-3">
          {FEATURES.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "tai-khoan",
    title: "2. Tài khoản người dùng",
    body: (
      <ul className="vvv-legal-list">
        <li>Đăng nhập bằng tài khoản Google</li>
        <li>Bảo mật thông tin đăng nhập của mình</li>
        <li>Mỗi người dùng sử dụng một tài khoản</li>
      </ul>
    ),
  },
  {
    id: "so-huu",
    title: "3. Quyền sở hữu dữ liệu",
    body: (
      <ul className="vvv-legal-list">
        <li>Bạn sở hữu toàn bộ dữ liệu giao dịch</li>
        <li>Xuất, chỉnh sửa hoặc xóa bất cứ lúc nào</li>
        <li>Không sử dụng dữ liệu cho mục đích thương mại</li>
      </ul>
    ),
  },
  {
    id: "api-key",
    title: "4. API Key bên thứ ba",
    body: (
      <ul className="vvv-legal-list">
        <li>Tính năng AI yêu cầu API Key Google Gemini</li>
        <li>Tuân thủ điều khoản của Google Gemini</li>
        <li>API Key lưu trữ cục bộ trên thiết bị</li>
      </ul>
    ),
  },
  {
    id: "su-dung-hop-ly",
    title: "5. Sử dụng hợp lý — Bạn cam kết KHÔNG",
    body: (
      <ul className="vvv-legal-list">
        {RESTRICTIONS.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    ),
  },
  {
    id: "mien-tru",
    title: "6. Miễn trừ trách nhiệm",
    body: (
      <ul className="vvv-legal-list">
        {DISCLAIMERS.map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
    ),
  },
  {
    id: "thay-doi",
    title: "7. Thay đổi điều khoản",
    body: (
      <p>
        Chúng tôi có thể cập nhật điều khoản bất cứ lúc nào. Việc tiếp tục sử
        dụng đồng nghĩa với việc bạn chấp nhận điều khoản mới.
      </p>
    ),
  },
  {
    id: "cham-dut",
    title: "8. Chấm dứt",
    body: (
      <p>
        Chúng tôi có quyền chấm dứt hoặc tạm ngưng tài khoản nếu vi phạm điều
        khoản, mà không cần thông báo trước.
      </p>
    ),
  },
  {
    id: "lien-he",
    title: "9. Liên hệ",
    body: (
      <p>
        Mọi thắc mắc về điều khoản dịch vụ, liên hệ qua{" "}
        <a
          href="mailto:phuc220204@gmail.com"
          className="font-medium text-primary hover:underline"
        >
          phuc220204@gmail.com
        </a>
        .
      </p>
    ),
  },
];

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <LegalDoc
        title="Điều khoản dịch vụ"
        intro={
          <>
            Bằng việc sử dụng ứng dụng{" "}
            <strong>Ví Vi Vu - Sổ Thu Chi AI</strong>, bạn đồng ý tuân thủ các
            điều khoản dịch vụ này. Nếu không đồng ý, vui lòng không sử dụng ứng
            dụng.
          </>
        }
        sections={SECTIONS}
        footerLink={{ to: "/privacy-policy", label: "Xem Chính sách bảo mật →" }}
      />
    </div>
  );
};

export default TermsOfService;
