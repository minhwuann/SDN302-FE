import { Card, CardBody, Button, Chip } from "@heroui/react";
import {
  Shield,
  ArrowLeft,
  Database,
  Lock,
  Eye,
  UserCheck,
  Mail,
  Cloud,
  Key,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Trang Chính Sách Bảo Mật - Redesigned
 * Public route - không cần đăng nhập
 */
const PrivacyPolicy = () => {
  const sections = [
    {
      icon: Eye,
      title: "Thông Tin Thu Thập",
      color: "from-blue-500 to-cyan-500",
      items: [
        { label: "Thông tin Google", desc: "Email, tên, ảnh đại diện" },
        { label: "Dữ liệu giao dịch", desc: "Các giao dịch bạn nhập" },
        { label: "Dữ liệu ngân sách", desc: "Kế hoạch chi tiêu" },
        { label: "API Key", desc: "Lưu cục bộ trên thiết bị" },
      ],
    },
    {
      icon: Database,
      title: "Cách Sử Dụng",
      color: "from-purple-500 to-pink-500",
      items: [
        { label: "Xác thực", desc: "Quản lý tài khoản của bạn" },
        { label: "Lưu trữ", desc: "Hiển thị dữ liệu giao dịch" },
        { label: "Thống kê", desc: "Tạo báo cáo tài chính" },
        { label: "AI", desc: "Hỗ trợ nhập liệu thông minh" },
      ],
    },
    {
      icon: Cloud,
      title: "Lưu Trữ Dữ Liệu",
      color: "from-emerald-500 to-teal-500",
      items: [
        { label: "Firebase", desc: "Dữ liệu trên Google Cloud" },
        { label: "LocalStorage", desc: "API Key chỉ lưu trên trình duyệt" },
      ],
    },
    {
      icon: Lock,
      title: "Bảo Mật",
      color: "from-amber-500 to-orange-500",
      items: [
        { label: "HTTPS", desc: "Kết nối được mã hóa" },
        { label: "Firebase Rules", desc: "Kiểm soát truy cập dữ liệu" },
        { label: "OAuth 2.0", desc: "Xác thực qua Google" },
      ],
    },
    {
      icon: UserCheck,
      title: "Quyền Của Bạn",
      color: "from-rose-500 to-red-500",
      items: [
        { label: "Truy cập", desc: "Xem dữ liệu của mình" },
        { label: "Chỉnh sửa", desc: "Sửa hoặc xóa giao dịch" },
        { label: "Xuất dữ liệu", desc: "CSV, Excel, PDF" },
        { label: "Xóa tài khoản", desc: "Xóa toàn bộ dữ liệu" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#fef3c7] dark:bg-gray-950">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Shield className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Chính Sách Bảo Mật
              </h1>
              <div className="flex items-center gap-3">
                <Chip
                  size="sm"
                  variant="flat"
                  className="bg-white/20 text-white"
                >
                  Ví Vi Vu
                </Chip>
                <span className="text-white/70 text-sm">
                  Cập nhật: {new Date().toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Intro Card */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-none shadow-xl">
          <CardBody className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Cam Kết Của Chúng Tôi
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Chào mừng bạn đến với{" "}
                  <strong>Ví Vi Vu - Sổ Thu Chi AI</strong>. Chúng tôi cam kết
                  bảo vệ quyền riêng tư của bạn. Chính sách này giải thích cách
                  chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của
                  bạn.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {sections.map((section, idx) => (
            <Card
              key={idx}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-none shadow-lg hover:shadow-xl transition-shadow"
            >
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-2.5 rounded-xl bg-gradient-to-br ${section.color} text-white`}
                  >
                    <section.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h3>
                </div>
                <div className="space-y-3">
                  {section.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mt-2" />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                          {item.label}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* No Sharing Notice */}
        <Card className="mb-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none shadow-lg">
          <CardBody className="p-6">
            <div className="flex items-center gap-4">
              <Key className="w-8 h-8 opacity-80" />
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Không Chia Sẻ Dữ Liệu
                </h3>
                <p className="text-white/90 text-sm">
                  Chúng tôi <strong>KHÔNG</strong> bán, cho thuê hoặc chia sẻ
                  thông tin cá nhân của bạn với bên thứ ba (ngoại trừ Google cho
                  dịch vụ xác thực).
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Contact */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-none shadow-lg">
          <CardBody className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Liên Hệ
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Có câu hỏi? Liên hệ với chúng tôi
                  </p>
                </div>
              </div>
              <Button
                as="a"
                href="mailto:phuc220204@gmail.com"
                color="primary"
                variant="flat"
                startContent={<Mail className="w-4 h-4" />}
              >
                phuc220204@gmail.com
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <Link
            to="/terms-of-service"
            className="text-primary-500 hover:text-primary-600 text-sm"
          >
            Xem Điều Khoản Dịch Vụ →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
