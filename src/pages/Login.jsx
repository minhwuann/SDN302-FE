import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Input, Tabs, Tab, Divider } from "@heroui/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  LineChart,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import * as authApi from "../services/authApi";
import {
  renderGoogleButton,
  isGoogleConfigured,
} from "../services/googleAuth";
import ThemeButton from "../components/ThemeButton";

/**
 * Trang đăng nhập - dùng Backend Ví Vi Vu (JWT + OTP email + Google GIS).
 *
 * Bốn chế độ:
 *  - login: đăng nhập email/mật khẩu
 *  - register: đăng ký -> BE gửi OTP qua email
 *  - otp: nhập mã OTP để hoàn tất đăng ký & tạo phiên
 *  - forgot: quên mật khẩu (bước con forgotStep: email -> reset)
 */

// Map mã lỗi BE -> thông báo tiếng Việt thân thiện
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không chính xác.",
  EMAIL_NOT_VERIFIED:
    "Email chưa được xác thực. Vui lòng đăng ký lại để nhận mã OTP.",
  EMAIL_ALREADY_REGISTERED: "Email này đã được đăng ký.",
  INVALID_OR_EXPIRED_OTP: "Mã OTP không đúng hoặc đã hết hạn.",
  OTP_ATTEMPT_LIMIT_EXCEEDED:
    "Bạn đã nhập sai quá số lần cho phép. Vui lòng gửi lại mã.",
  SIGNUP_OTP_NOT_FOUND: "Không tìm thấy yêu cầu đăng ký. Vui lòng đăng ký lại.",
  SMTP_NOT_CONFIGURED:
    "Máy chủ chưa cấu hình gửi email. Vui lòng liên hệ quản trị.",
  VALIDATION_ERROR: "Dữ liệu nhập không hợp lệ.",
};

const Login = () => {
  const navigate = useNavigate();
  const { loginWithEmail, loginWithGoogle, register, verifyOtp, resendOtp } =
    useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [authMode, setAuthMode] = useState("login"); // login | register | otp | forgot
  const [forgotStep, setForgotStep] = useState("email"); // email | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const googleBtnRef = useRef(null);

  const handleError = useCallback((err) => {
    const message =
      ERROR_MESSAGES[err?.code] ||
      err?.message ||
      "Đã xảy ra lỗi. Vui lòng thử lại.";
    setError(message);
  }, []);

  // Render nút Google GIS
  useEffect(() => {
    if (authMode === "otp" || authMode === "forgot") return;
    if (!googleBtnRef.current) return;
    renderGoogleButton(
      googleBtnRef.current,
      async (idToken) => {
        try {
          setIsLoading(true);
          setError(null);
          await loginWithGoogle(idToken);
          navigate("/");
        } catch (err) {
          handleError(err);
        } finally {
          setIsLoading(false);
        }
      },
      (err) => handleError(err)
    );
  }, [authMode, loginWithGoogle, navigate, handleError]);

  const getPasswordStrength = (pwd) => {
    const checks = {
      length: pwd.length >= 8,
      hasNumber: /\d/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasUpper: /[A-Z]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
    const passedChecks = Object.values(checks).filter(Boolean).length;
    let color = "danger";
    let label = "Yếu";
    if (passedChecks >= 4) {
      color = "success";
      label = "Mạnh";
    } else if (passedChecks >= 3) {
      color = "warning";
      label = "Trung bình";
    }
    return { checks, color, label, passedChecks };
  };

  const passwordStrength = getPasswordStrength(password);

  /** Đăng nhập email/mật khẩu */
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await loginWithEmail({ email, password });
      navigate("/");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  /** Đăng ký -> BE gửi OTP qua email */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await register({
        email,
        password,
        displayName: displayName || undefined,
      });
      setSuccessMessage(`Mã OTP đã được gửi tới ${email}. Vui lòng kiểm tra hộp thư.`);
      setAuthMode("otp");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  /** Xác thực OTP -> tạo phiên đăng nhập */
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (otpCode.length !== 6) {
      setError("Vui lòng nhập đủ 6 số OTP");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await verifyOtp({ email, otpCode });
      navigate("/");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  /** Gửi lại OTP */
  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await resendOtp(email);
      setSuccessMessage("Đã gửi lại mã OTP. Vui lòng kiểm tra email.");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const backToRegister = () => {
    setAuthMode("register");
    setOtpCode("");
    setError(null);
    setSuccessMessage(null);
  };

  /** Mở luồng quên mật khẩu từ tab đăng nhập */
  const openForgotPassword = () => {
    setAuthMode("forgot");
    setForgotStep("email");
    setOtpCode("");
    setNewPassword("");
    setConfirmNewPassword("");
    setError(null);
    setSuccessMessage(null);
  };

  const backToLoginFromForgot = () => {
    setAuthMode("login");
    setForgotStep("email");
    setError(null);
    setSuccessMessage(null);
  };

  /** Bước 1 quên mật khẩu: yêu cầu gửi OTP đặt lại mật khẩu */
  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Vui lòng nhập email");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await authApi.forgotPassword(email);
      setSuccessMessage(`Nếu email này đã đăng ký, mã OTP đã được gửi tới ${email}.`);
      setForgotStep("reset");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  /** Bước 2 quên mật khẩu: xác thực OTP + đặt mật khẩu mới */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError("Vui lòng nhập đủ 6 số OTP");
      return;
    }
    if (!newPassword || !confirmNewPassword) {
      setError("Vui lòng nhập đầy đủ mật khẩu mới");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (newPassword.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await authApi.resetPassword({ email, otpCode, newPassword });
      setSuccessMessage("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.");
      setAuthMode("login");
      setForgotStep("email");
      setPassword("");
      setOtpCode("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* Cột trái: panel thương hiệu/lợi ích (chỉ desktop) — phẳng, không gradient */}
      <aside className="hidden lg:flex flex-col justify-between border-r border-divider bg-content1 p-10">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-[10px] w-fit"
        >
          <img
            src="/logoApp.png"
            alt="Ví Vi Vu"
            className="h-10 w-10 object-contain"
          />
          <span className="text-lg font-bold tracking-tight text-foreground">
            Ví Vi Vu
          </span>
        </Link>

        <div className="max-w-sm">
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-foreground">
            Sổ thu chi thông minh, gọn gàng và đáng tin cậy.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-default-600">
            Sống vi vu, không lo túi. Quản lý thu chi hằng ngày với sự hỗ trợ của
            AI.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              {
                icon: LineChart,
                title: "Thống kê rõ ràng",
                desc: "Biểu đồ thu chi trực quan, dễ hiểu.",
              },
              {
                icon: Sparkles,
                title: "Trợ lý AI",
                desc: "Nhập giao dịch bằng ngôn ngữ tự nhiên.",
              },
              {
                icon: ShieldCheck,
                title: "Riêng tư & an toàn",
                desc: "Dữ liệu được mã hóa, thuộc về bạn.",
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.title} className="flex gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-primary-50 text-primary dark:bg-primary-500/15">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {f.title}
                    </p>
                    <p className="text-sm text-default-600">{f.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-xs text-default-500">© Ví Vi Vu</p>
      </aside>

      {/* Cột phải: biểu mẫu xác thực */}
      <main className="relative flex min-h-screen items-center justify-center px-4 py-10 lg:min-h-0">
        <div className="absolute top-4 right-4">
          <ThemeButton />
        </div>

        <div className="w-full max-w-md space-y-6">
          {/* Logo (nổi bật trên mobile, gọn trên desktop) */}
          <div className="space-y-2 text-center lg:hidden">
            <img
              src="/logoApp.png"
              alt="Ví Vi Vu Logo"
              className="mx-auto h-12 w-12"
            />
            <h1 className="text-xl font-bold text-foreground">Ví Vi Vu</h1>
            <p className="text-sm text-default-600">Sống vi vu, không lo túi</p>
          </div>

          {authMode === "otp" ? (
            /* ----------------------- Bước nhập OTP ----------------------- */
            <div className="space-y-5">
              <button
                type="button"
                onClick={backToRegister}
                className="flex items-center gap-1 text-sm text-default-500 hover:text-default-700"
              >
                <ArrowLeft size={16} /> Quay lại
              </button>
              <div className="text-center space-y-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Xác thực email
                </h2>
                <p className="text-sm text-default-500">
                  Nhập mã 6 số đã gửi tới <strong>{email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  label="Mã OTP"
                  placeholder="Nhập 6 số"
                  value={otpCode}
                  onValueChange={(v) =>
                    setOtpCode(v.replace(/\D/g, "").slice(0, 6))
                  }
                  size="lg"
                  classNames={{ input: "text-center tracking-[0.5em] text-lg" }}
                  autoFocus
                />
                <Button
                  type="submit"
                  color="primary"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                >
                  Xác nhận
                </Button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-sm text-primary-600 hover:underline dark:text-primary-400"
                >
                  Chưa nhận được mã? Gửi lại
                </button>
              </div>
            </div>
          ) : authMode === "forgot" ? (
            /* ------------------- Quên mật khẩu ------------------- */
            <div className="space-y-5">
              <button
                type="button"
                onClick={backToLoginFromForgot}
                className="flex items-center gap-1 text-sm text-default-500 hover:text-default-700"
              >
                <ArrowLeft size={16} /> Quay lại đăng nhập
              </button>

              {forgotStep === "email" ? (
                <>
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Quên mật khẩu
                    </h2>
                    <p className="text-sm text-default-500">
                      Nhập email để nhận mã OTP đặt lại mật khẩu
                    </p>
                  </div>

                  <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                    <Input
                      type="email"
                      label="Email"
                      placeholder="your@email.com"
                      value={email}
                      onValueChange={setEmail}
                      startContent={<Mail size={18} className="text-default-400" />}
                      isRequired
                      autoFocus
                    />
                    <Button
                      type="submit"
                      color="primary"
                      className="w-full"
                      size="lg"
                      isLoading={isLoading}
                    >
                      Gửi mã OTP
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <div className="text-center space-y-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Đặt lại mật khẩu
                    </h2>
                    <p className="text-sm text-default-500">
                      Nhập mã 6 số đã gửi tới <strong>{email}</strong> và mật khẩu mới
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      label="Mã OTP"
                      placeholder="Nhập 6 số"
                      value={otpCode}
                      onValueChange={(v) =>
                        setOtpCode(v.replace(/\D/g, "").slice(0, 6))
                      }
                      size="lg"
                      classNames={{ input: "text-center tracking-[0.5em] text-lg" }}
                      autoFocus
                    />
                    <Input
                      type={showPassword ? "text" : "password"}
                      label="Mật khẩu mới"
                      placeholder="Nhập mật khẩu mới"
                      value={newPassword}
                      onValueChange={setNewPassword}
                      startContent={<Lock size={18} className="text-default-400" />}
                      endContent={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="focus:outline-none"
                        >
                          {showPassword ? (
                            <EyeOff size={18} className="text-default-400" />
                          ) : (
                            <Eye size={18} className="text-default-400" />
                          )}
                        </button>
                      }
                      isRequired
                    />
                    <Input
                      type={showPassword ? "text" : "password"}
                      label="Xác nhận mật khẩu mới"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmNewPassword}
                      onValueChange={setConfirmNewPassword}
                      startContent={<Lock size={18} className="text-default-400" />}
                      isRequired
                      isInvalid={
                        confirmNewPassword && confirmNewPassword !== newPassword
                      }
                      errorMessage={
                        confirmNewPassword && confirmNewPassword !== newPassword
                          ? "Mật khẩu không khớp"
                          : ""
                      }
                    />
                    <Button
                      type="submit"
                      color="primary"
                      className="w-full"
                      size="lg"
                      isLoading={isLoading}
                    >
                      Đặt lại mật khẩu
                    </Button>
                  </form>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleForgotPasswordRequest}
                      disabled={isLoading}
                      className="text-sm text-primary-600 hover:underline dark:text-primary-400"
                    >
                      Chưa nhận được mã? Gửi lại
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* -------------------- Đăng nhập / Đăng ký -------------------- */
            <>
              <Tabs
                selectedKey={authMode}
                onSelectionChange={(key) => {
                  setAuthMode(key);
                  setError(null);
                  setSuccessMessage(null);
                }}
                variant="bordered"
                fullWidth
                classNames={{ tabList: "gap-2", tab: "h-10" }}
              >
                <Tab key="login" title="Đăng nhập" />
                <Tab key="register" title="Đăng ký" />
              </Tabs>

              <form
                onSubmit={
                  authMode === "login" ? handleEmailSignIn : handleRegister
                }
                className="space-y-4"
              >
                {authMode === "register" && (
                  <Input
                    type="text"
                    label="Tên hiển thị (tuỳ chọn)"
                    placeholder="Nguyễn Văn A"
                    value={displayName}
                    onValueChange={setDisplayName}
                  />
                )}

                <Input
                  type="email"
                  label="Email"
                  placeholder="your@email.com"
                  value={email}
                  onValueChange={setEmail}
                  startContent={<Mail size={18} className="text-default-400" />}
                  isRequired
                />

                <Input
                  type={showPassword ? "text" : "password"}
                  label="Mật khẩu"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onValueChange={setPassword}
                  startContent={<Lock size={18} className="text-default-400" />}
                  endContent={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff size={18} className="text-default-400" />
                      ) : (
                        <Eye size={18} className="text-default-400" />
                      )}
                    </button>
                  }
                  isRequired
                />

                {authMode === "login" && (
                  <div className="flex justify-end -mt-2">
                    <button
                      type="button"
                      onClick={openForgotPassword}
                      className="text-xs text-primary-600 hover:underline dark:text-primary-400"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                )}

                {authMode === "register" && (
                  <Input
                    type={showPassword ? "text" : "password"}
                    label="Xác nhận mật khẩu"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onValueChange={setConfirmPassword}
                    startContent={
                      <Lock size={18} className="text-default-400" />
                    }
                    isRequired
                    isInvalid={confirmPassword && confirmPassword !== password}
                    errorMessage={
                      confirmPassword && confirmPassword !== password
                        ? "Mật khẩu không khớp"
                        : ""
                    }
                  />
                )}

                {authMode === "register" && password && (
                  <div className="space-y-2 p-3 bg-default-100 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-default-600">
                        Độ mạnh mật khẩu:
                      </span>
                      <span
                        className={`text-xs font-medium text-${passwordStrength.color}`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i <= passwordStrength.passedChecks
                              ? passwordStrength.color === "success"
                                ? "bg-success"
                                : passwordStrength.color === "warning"
                                ? "bg-warning"
                                : "bg-danger"
                              : "bg-default-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-default-500">
                      Tối thiểu 8 ký tự. Nên có chữ hoa, chữ thường, số và ký tự
                      đặc biệt.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  color="primary"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                >
                  {authMode === "login" ? "Đăng nhập" : "Đăng ký"}
                </Button>
              </form>

              <div className="flex items-center gap-4">
                <Divider className="flex-1" />
                <span className="text-xs text-default-400">hoặc</span>
                <Divider className="flex-1" />
              </div>

              {/* Nút Google (render bởi GIS) */}
              <div className="flex justify-center">
                {isGoogleConfigured() ? (
                  <div ref={googleBtnRef} className="w-full flex justify-center" />
                ) : (
                  <p className="text-xs text-center text-default-400">
                    Đăng nhập Google chưa được cấu hình (thiếu
                    VITE_GOOGLE_CLIENT_ID).
                  </p>
                )}
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
              <p className="text-sm text-danger-600 dark:text-danger-400">
                {error}
              </p>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
              <p className="text-sm text-success-600 dark:text-success-400">
                {successMessage}
              </p>
            </div>
          )}

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Bằng cách đăng nhập, bạn đồng ý với{" "}
            <Link to="/terms-of-service" className="text-primary hover:underline">
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link to="/privacy-policy" className="text-primary hover:underline">
              Chính sách bảo mật
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
