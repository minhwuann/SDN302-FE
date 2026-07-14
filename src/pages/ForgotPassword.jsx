import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardBody,
  Button,
  Input,
} from "@heroui/react";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import ThemeButton from "../components/ThemeButton";
import VantaBackground from "../components/VantaBackground";

const ERROR_MESSAGES = {
  USER_NOT_FOUND: "Không tìm thấy tài khoản với email này.",
  INVALID_OR_EXPIRED_OTP: "Mã OTP không đúng hoặc đã hết hạn.",
  OTP_ATTEMPT_LIMIT_EXCEEDED: "Bạn đã nhập sai quá số lần cho phép. Vui lòng thử lại sau.",
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword } = useAuth();

  const [step, setStep] = useState(1); // 1: request email, 2: reset password with OTP
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleError = useCallback((err) => {
    const code = err?.code || "";
    const message = ERROR_MESSAGES[code] || err?.message || "Đã xảy ra lỗi. Vui lòng thử lại.";
    setError(message);
    setSuccess(null);
  }, []);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) return setError("Vui lòng nhập email.");
    
    try {
      setIsLoading(true);
      setError(null);
      await forgotPassword(email);
      setSuccess("Mã khôi phục đã được gửi đến email của bạn.");
      setStep(2);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otpCode || !newPassword || !confirmPassword) return setError("Vui lòng nhập đầy đủ thông tin.");
    if (newPassword !== confirmPassword) return setError("Mật khẩu không khớp.");
    if (newPassword.length < 8) return setError("Mật khẩu phải có ít nhất 8 ký tự.");
    
    try {
      setIsLoading(true);
      setError(null);
      await resetPassword({ email, otpCode, newPassword });
      setSuccess("Mật khẩu đã được đổi thành công! Đang đăng nhập...");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VantaBackground>
      <div className="absolute top-4 right-4 z-50">
        <ThemeButton />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Quên mật khẩu
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Khôi phục tài khoản Ví Vi Vu của bạn
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-xl border border-gray-200 dark:border-gray-700">
          <CardBody className="px-4 py-8 sm:px-10">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-sm text-center">
                {success}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleRequestOtp} className="space-y-6">
                <Input
                  label="Email của bạn"
                  type="email"
                  variant="bordered"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  startContent={<Mail className="text-gray-400 w-5 h-5" />}
                  isRequired
                  autoFocus
                />
                <Button
                  color="primary"
                  type="submit"
                  className="w-full shadow-lg"
                  isLoading={isLoading}
                  size="lg"
                >
                  Gửi mã khôi phục
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <Input
                  label="Mã OTP"
                  type="text"
                  variant="bordered"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  description={`Mã gồm 6 chữ số đã gửi tới ${email}`}
                  isRequired
                  autoFocus
                />
                <Input
                  label="Mật khẩu mới"
                  variant="bordered"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  startContent={<Lock className="text-gray-400 w-5 h-5" />}
                  endContent={
                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="text-gray-400 w-5 h-5" /> : <Eye className="text-gray-400 w-5 h-5" />}
                    </button>
                  }
                  isRequired
                />
                <Input
                  label="Xác nhận mật khẩu mới"
                  variant="bordered"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  startContent={<Lock className="text-gray-400 w-5 h-5" />}
                  isRequired
                />
                <Button
                  color="primary"
                  type="submit"
                  className="w-full shadow-lg"
                  isLoading={isLoading}
                  size="lg"
                >
                  Đặt lại mật khẩu
                </Button>
              </form>
            )}

            <div className="mt-6 flex justify-center">
              <Link to="/login" className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Quay lại đăng nhập
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </VantaBackground>
  );
};

export default ForgotPassword;
