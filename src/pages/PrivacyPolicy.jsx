import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Trang Chính Sách Bảo Mật.
 * Trình bày như một tài liệu pháp lý dễ đọc: nền trung tính, tiêu đề đơn giản,
 * mục lục dính bên trái (desktop), cột chữ hẹp. Không hero gradient, không glass card.
 * Nội dung pháp lý được giữ nguyên.
 */

const SECTIONS = [
  {
    id: "thu-thap",
    title: "1. Thông tin thu thập",
    body: (
      <ul className="vvv-legal-list">
        <li>
          <strong>Thông tin Google:</strong> Email, tên, ảnh đại diện.
        </li>
        <li>
          <strong>Dữ liệu giao dịch:</strong> Các giao dịch bạn nhập.
        </li>
        <li>
          <strong>Dữ liệu ngân sách:</strong> Kế hoạch chi tiêu.
        </li>
        <li>
          <strong>API Key:</strong> Lưu cục bộ trên thiết bị.
        </li>
      </ul>
    ),
  },
  {
    id: "su-dung",
    title: "2. Cách sử dụng",
    body: (
      <ul className="vvv-legal-list">
        <li>
          <strong>Xác thực:</strong> Quản lý tài khoản của bạn.
        </li>
        <li>
          <strong>Lưu trữ:</strong> Hiển thị dữ liệu giao dịch.
        </li>
        <li>
          <strong>Thống kê:</strong> Tạo báo cáo tài chính.
        </li>
        <li>
          <strong>AI:</strong> Hỗ trợ nhập liệu thông minh.
        </li>
      </ul>
    ),
  },
  {
    id: "luu-tru",
    title: "3. Lưu trữ dữ liệu",
    body: (
      <ul className="vvv-legal-list">
        <li>
          <strong>Firebase:</strong> Dữ liệu trên Google Cloud.
        </li>
        <li>
          <strong>LocalStorage:</strong> API Key chỉ lưu trên trình duyệt.
        </li>
      </ul>
    ),
  },
  {
    id: "bao-mat",
    title: "4. Bảo mật",
    body: (
      <ul className="vvv-legal-list">
        <li>
          <strong>HTTPS:</strong> Kết nối được mã hóa.
        </li>
        <li>
          <strong>Firebase Rules:</strong> Kiểm soát truy cập dữ liệu.
        </li>
        <li>
          <strong>OAuth 2.0:</strong> Xác thực qua Google.
        </li>
      </ul>
    ),
  },
  {
    id: "quyen",
    title: "5. Quyền của bạn",
    body: (
      <ul className="vvv-legal-list">
        <li>
          <strong>Truy cập:</strong> Xem dữ liệu của mình.
        </li>
        <li>
          <strong>Chỉnh sửa:</strong> Sửa hoặc xóa giao dịch.
        </li>
        <li>
          <strong>Xuất dữ liệu:</strong> CSV, Excel, PDF.
        </li>
        <li>
          <strong>Xóa tài khoản:</strong> Xóa toàn bộ dữ liệu.
        </li>
      </ul>
    ),
  },
  {
    id: "chia-se",
    title: "6. Không chia sẻ dữ liệu",
    body: (
      <p>
        Chúng tôi <strong>KHÔNG</strong> bán, cho thuê hoặc chia sẻ thông tin cá
        nhân của bạn với bên thứ ba (ngoại trừ Google cho dịch vụ xác thực).
      </p>
    ),
  },
  {
    id: "lien-he",
    title: "7. Liên hệ",
    body: (
      <p>
        Có câu hỏi về chính sách bảo mật? Liên hệ với chúng tôi qua{" "}
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

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <LegalDoc
        title="Chính sách bảo mật"
        intro={
          <>
            Chào mừng bạn đến với <strong>Ví Vi Vu - Sổ Thu Chi AI</strong>.
            Chúng tôi cam kết bảo vệ quyền riêng tư của bạn. Chính sách này giải
            thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân
            của bạn.
          </>
        }
        sections={SECTIONS}
        footerLink={{ to: "/terms-of-service", label: "Xem Điều khoản dịch vụ →" }}
      />
    </div>
  );
};

/**
 * LegalDoc — layout tài liệu pháp lý dùng chung cho Privacy & Terms.
 */
export const LegalDoc = ({ title, intro, sections, footerLink }) => {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <style>{`
        .vvv-legal-list { list-style: disc; padding-left: 1.25rem; }
        .vvv-legal-list > li { margin-top: 0.5rem; }
      `}</style>

      {/* Header đơn giản */}
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 rounded-[10px] text-sm text-default-600 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Về trang chủ
      </Link>

      <header className="border-b border-divider pb-6">
        <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-sm text-default-500">
          Ví Vi Vu · Cập nhật: {new Date().toLocaleDateString("vi-VN")}
        </p>
      </header>

      <div className="mt-8 gap-10 lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Mục lục dính (desktop) */}
        <nav className="hidden lg:block">
          <div className="sticky top-8">
            <p className="mb-3 text-[13px] font-semibold text-default-600">
              Mục lục
            </p>
            <ul className="space-y-1.5">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block rounded-md px-2 py-1 text-sm text-default-600 hover:bg-content2 hover:text-foreground"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Nội dung — cột chữ hẹp, dễ đọc */}
        <article className="max-w-2xl">
          <p className="text-[15px] leading-relaxed text-default-700 dark:text-default-600">
            {intro}
          </p>

          <div className="mt-8 space-y-10">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-8">
                <h2 className="text-lg font-semibold text-foreground">
                  {s.title}
                </h2>
                <div className="mt-3 text-[15px] leading-relaxed text-default-700 dark:text-default-600">
                  {s.body}
                </div>
              </section>
            ))}
          </div>

          {footerLink && (
            <div className="mt-12 border-t border-divider pt-6">
              <Link
                to={footerLink.to}
                className="text-sm font-medium text-primary hover:underline"
              >
                {footerLink.label}
              </Link>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
