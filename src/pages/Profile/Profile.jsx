import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Avatar,
  Divider,
  Switch,
  Select,
  SelectItem,
  Chip,
} from "@heroui/react";
import {
  User,
  Database,
  Save,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Bell,
  Wallet,
  Landmark,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Link } from "react-router-dom";
import * as authApi from "../../services/authApi";
import { renderGoogleButton, isGoogleConfigured } from "../../services/googleAuth";
import SecuritySettings from "../../components/SecuritySettings/SecuritySettings";
import PageHeader from "../../components/ui/PageHeader";

const GOOGLE_LINK_ERROR_MESSAGES = {
  GOOGLE_ALREADY_LINKED: "Tài khoản này đã được liên kết với Google.",
  GOOGLE_ACCOUNT_ALREADY_LINKED:
    "Tài khoản Google này đã được liên kết với một tài khoản khác.",
  GOOGLE_EMAIL_MISMATCH:
    "Email của tài khoản Google phải trùng với email đăng nhập hiện tại.",
};

const LOCALE_OPTIONS = [
  { key: "vi-VN", label: "Tiếng Việt" },
  { key: "en-US", label: "English" },
];

const TIMEZONE_OPTIONS = [
  { key: "Asia/Ho_Chi_Minh", label: "(GMT+7) Hà Nội, TP.HCM" },
  { key: "Asia/Bangkok", label: "(GMT+7) Bangkok" },
  { key: "UTC", label: "(GMT+0) UTC" },
];

/**
 * Trang Quản lý Tài khoản (Profile)
 * Cho phép user chỉnh sửa thông tin cá nhân, cấu hình API Key và cài đặt ứng dụng
 */
const Profile = () => {
  const { currentUser, settings, updateUserProfile, logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const googleLinkBtnRef = useRef(null);
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  // State cho form chỉnh sửa profile
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [locale, setLocale] = useState("vi-VN");
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", content: "" });

  // State riêng cho từng toggle thông báo - lưu ngay khi bật/tắt (giống Theme)
  const [savingSetting, setSavingSetting] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || "");
      setEmail(currentUser.email || "");
      setAvatarUrl(currentUser.avatarUrl || "");
      setLocale(currentUser.locale || "vi-VN");
      setTimezone(currentUser.timezone || "Asia/Ho_Chi_Minh");
    }
  }, [currentUser]);

  // Xử lý cập nhật thông tin cá nhân
  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      setMessage({
        type: "error",
        content: "Tên hiển thị không được để trống",
      });
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({
        displayName,
        avatarUrl: avatarUrl.trim() || null,
        locale,
        timezone,
      });
      setMessage({ type: "success", content: "Cập nhật hồ sơ thành công!" });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        content: error.message || "Lỗi khi cập nhật hồ sơ",
      });
    } finally {
      setLoading(false);
      // Tự động ẩn thông báo sau 3s
      setTimeout(() => setMessage({ type: "", content: "" }), 3000);
    }
  };

  // Bật/tắt 1 loại thông báo - lưu ngay lên BE (PATCH /me), không cần bấm Lưu
  const handleToggleSetting = async (key, value) => {
    setSavingSetting(key);
    try {
      await updateUserProfile({ settings: { [key]: value } });
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        content: error.message || "Lỗi khi cập nhật cài đặt thông báo",
      });
      setTimeout(() => setMessage({ type: "", content: "" }), 3000);
    } finally {
      setSavingSetting(null);
    }
  };

  // Render nút Google GIS cho luồng liên kết (chỉ khi chưa liên kết)
  useEffect(() => {
    if (currentUser?.googleSub) return;
    if (!googleLinkBtnRef.current) return;
    renderGoogleButton(
      googleLinkBtnRef.current,
      async (idToken) => {
        try {
          setLinkingGoogle(true);
          await authApi.linkGoogleAccount(idToken);
          await refreshUser();
          setMessage({ type: "success", content: "Liên kết Google thành công!" });
        } catch (error) {
          console.error(error);
          setMessage({
            type: "error",
            content:
              GOOGLE_LINK_ERROR_MESSAGES[error?.code] ||
              error?.message ||
              "Không thể liên kết tài khoản Google.",
          });
        } finally {
          setLinkingGoogle(false);
          setTimeout(() => setMessage({ type: "", content: "" }), 3000);
        }
      },
      (error) => {
        setMessage({
          type: "error",
          content: error?.message || "Không thể liên kết tài khoản Google.",
        });
      }
    );
  }, [currentUser?.googleSub, refreshUser]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <PageHeader
        title="Quản lý tài khoản"
        subtitle="Cập nhật thông tin và cài đặt ứng dụng"
      />

      {/* Thông báo Feedback */}
      {message.content && (
        <div
          className={`p-3 rounded-[10px] text-sm font-medium ${
            message.type === "success"
              ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
              : "bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-400"
          }`}
        >
          {message.content}
        </div>
      )}

      {/* 1. Thông tin cá nhân */}
      <Card className="border border-divider shadow-none" radius="lg">
        <CardHeader className="bg-content2 px-6 py-4 border-b border-divider">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Thông tin cá nhân
            </h2>
          </div>
        </CardHeader>
        <CardBody className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar Section */}
            <div className="flex-shrink-0">
              <Avatar
                src={avatarUrl || currentUser?.photoURL}
                name={displayName}
                className="w-24 h-24 text-2xl font-bold"
                isBordered
                color="primary"
              />
            </div>

            {/* Edit Info Form */}
            <div className="flex-1 w-full space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Tên hiển thị"
                  placeholder="Nhập tên của bạn"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setIsEditing(true);
                  }}
                  variant="bordered"
                  labelPlacement="outside"
                  radius="sm"
                />
                <Input
                  label="Email"
                  value={email}
                  isReadOnly
                  variant="flat"
                  labelPlacement="outside"
                  radius="sm"
                  description="Email không thể thay đổi khi đăng nhập bằng Google"
                  className="opacity-70"
                />
                <Input
                  label="Ảnh đại diện (URL)"
                  placeholder="https://..."
                  value={avatarUrl}
                  onChange={(e) => {
                    setAvatarUrl(e.target.value);
                    setIsEditing(true);
                  }}
                  variant="bordered"
                  labelPlacement="outside"
                  radius="sm"
                  description="Dán link ảnh có sẵn (Google, Imgur...)"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Ngôn ngữ"
                    variant="bordered"
                    labelPlacement="outside"
                    radius="sm"
                    selectedKeys={[locale]}
                    onSelectionChange={(keys) => {
                      setLocale(Array.from(keys)[0] || "vi-VN");
                      setIsEditing(true);
                    }}
                  >
                    {LOCALE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.key} textValue={opt.label}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Múi giờ"
                    variant="bordered"
                    labelPlacement="outside"
                    radius="sm"
                    selectedKeys={[timezone]}
                    onSelectionChange={(keys) => {
                      setTimezone(Array.from(keys)[0] || "Asia/Ho_Chi_Minh");
                      setIsEditing(true);
                    }}
                  >
                    {TIMEZONE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.key} textValue={opt.label}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end pt-2">
                  <Button
                    color="primary"
                    startContent={<Save size={16} />}
                    isLoading={loading}
                    onPress={handleUpdateProfile}
                    size="sm"
                    className="font-medium"
                  >
                    Lưu thay đổi
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Divider />

          {/* Liên kết tài khoản Google */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-medium text-foreground">
                Tài khoản Google
              </p>
              <p className="text-sm text-default-600">
                {currentUser?.googleSub
                  ? "Bạn có thể đăng nhập bằng email/mật khẩu hoặc Google."
                  : "Liên kết để có thể đăng nhập nhanh bằng Google."}
              </p>
            </div>
            {currentUser?.googleSub ? (
              <Chip
                color="success"
                variant="flat"
                startContent={<CheckCircle2 className="w-4 h-4" />}
              >
                Đã liên kết với Google
              </Chip>
            ) : isGoogleConfigured() ? (
              <div ref={googleLinkBtnRef} className={linkingGoogle ? "opacity-50 pointer-events-none" : ""} />
            ) : (
              <p className="text-xs text-default-500">
                Đăng nhập Google chưa được cấu hình.
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* 2. Cài đặt Ứng dụng */}
      <Card className="border border-divider shadow-none" radius="lg">
        <CardHeader className="bg-content2 px-6 py-4 border-b border-divider">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-default-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Cài đặt ứng dụng
            </h2>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-divider">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[10px] bg-content2 text-default-600">
                  {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Giao diện (Theme)
                  </p>
                  <p className="text-sm text-default-600">
                    Chuyển đổi giữa Sáng và Tối
                  </p>
                </div>
              </div>
              <Switch
                isSelected={theme === "dark"}
                onValueChange={(isSelected) =>
                  setTheme(isSelected ? "dark" : "light")
                }
                color="primary"
                size="md"
              />
            </div>

            {/* Nhắc nhở hàng ngày */}
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[10px] bg-content2 text-default-600">
                  <Bell size={20} />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Nhắc ghi chép hàng ngày
                  </p>
                  <p className="text-sm text-default-600">
                    Nhắc nếu bạn quên ghi chép thu chi trong ngày
                  </p>
                </div>
              </div>
              <Switch
                isSelected={settings?.dailyReminderEnabled ?? false}
                isDisabled={savingSetting === "dailyReminderEnabled"}
                onValueChange={(value) =>
                  handleToggleSetting("dailyReminderEnabled", value)
                }
                color="primary"
                size="md"
              />
            </div>

            {/* Cảnh báo ngân sách */}
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[10px] bg-content2 text-default-600">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Cảnh báo ngân sách
                  </p>
                  <p className="text-sm text-default-600">
                    Báo khi chi tiêu vượt ngưỡng cảnh báo của ngân sách
                  </p>
                </div>
              </div>
              <Switch
                isSelected={settings?.budgetWarningEnabled ?? false}
                isDisabled={savingSetting === "budgetWarningEnabled"}
                onValueChange={(value) =>
                  handleToggleSetting("budgetWarningEnabled", value)
                }
                color="primary"
                size="md"
              />
            </div>

            {/* Nhắc nợ đến hạn */}
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[10px] bg-content2 text-default-600">
                  <Landmark size={20} />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Nhắc nợ đến hạn
                  </p>
                  <p className="text-sm text-default-600">
                    Báo khi khoản nợ/cho vay sắp hoặc đã đến hạn
                  </p>
                </div>
              </div>
              <Switch
                isSelected={settings?.debtReminderEnabled ?? false}
                isDisabled={savingSetting === "debtReminderEnabled"}
                onValueChange={(value) =>
                  handleToggleSetting("debtReminderEnabled", value)
                }
                color="primary"
                size="md"
              />
            </div>

            {/* Data Tools */}
            <div className="flex items-center justify-between p-6 hover:bg-content2 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[10px] bg-primary-50 text-primary dark:bg-primary-500/15">
                  <Database size={20} />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Dữ liệu & Công cụ
                  </p>
                  <p className="text-sm text-default-600">
                    Sao lưu, phục hồi và nhập liệu nâng cao
                  </p>
                </div>
              </div>
              <Button
                as={Link}
                to="/data-tools"
                variant="light"
                color="primary"
                endContent={<ChevronRight size={16} />}
              >
                Truy cập
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 3. Bảo mật */}
      <SecuritySettings />

      {/* Logout Button */}
      <div className="flex justify-center pt-4">
        <Button
          color="danger"
          variant="flat"
          startContent={<LogOut size={18} />}
          onPress={logout}
          className="w-full sm:w-auto min-w-[200px]"
        >
          Đăng xuất tài khoản
        </Button>
      </div>
    </div>
  );
};

export default Profile;
