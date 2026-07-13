import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Divider,
} from "@heroui/react";
import { ShieldCheck, LogOut, Monitor } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import * as authApi from "../../services/authApi";

const ERROR_MESSAGES = {
  NO_PASSWORD_SET:
    "Tài khoản của bạn đăng nhập bằng Google và chưa có mật khẩu để đổi.",
  INVALID_CURRENT_PASSWORD: "Mật khẩu hiện tại không đúng.",
  VALIDATION_ERROR: "Dữ liệu nhập không hợp lệ.",
};

/**
 * Component "Bảo mật": đổi mật khẩu khi đang đăng nhập + xem/thu hồi phiên đăng nhập.
 * Đổi mật khẩu và thu hồi phiên đều làm mất hiệu lực phiên hiện tại (BE thu hồi toàn
 * bộ session), nên cả 2 thao tác đều đăng xuất cục bộ và điều hướng về /login sau đó.
 */
const SecuritySettings = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const list = await authApi.listSessions();
      setSessions(list);
    } catch (error) {
      setSessionsError(error?.message || "Không tải được danh sách phiên đăng nhập.");
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const signOutEverywhere = async () => {
    await logout();
    navigate("/login");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }
    try {
      setIsChangingPassword(true);
      setPasswordError(null);
      await authApi.changePassword({ currentPassword, newPassword });
      await signOutEverywhere();
    } catch (error) {
      setPasswordError(
        ERROR_MESSAGES[error?.code] || error?.message || "Không thể đổi mật khẩu."
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      setRevokingId(sessionId);
      await authApi.revokeSession(sessionId);
      await loadSessions();
    } catch (error) {
      setSessionsError(error?.message || "Không thể đăng xuất phiên này.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm("Đăng xuất khỏi tất cả thiết bị, kể cả thiết bị này?")) return;
    try {
      setIsRevokingAll(true);
      await authApi.revokeAllSessions();
      await signOutEverywhere();
    } catch (error) {
      setSessionsError(error?.message || "Không thể đăng xuất tất cả thiết bị.");
      setIsRevokingAll(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            Bảo mật
          </h2>
        </div>
      </CardHeader>
      <CardBody className="p-6 space-y-6">
        {/* Đổi mật khẩu */}
        <form onSubmit={handleChangePassword} className="space-y-3">
          <p className="font-medium text-slate-800 dark:text-white">Đổi mật khẩu</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              type="password"
              label="Mật khẩu hiện tại"
              value={currentPassword}
              onValueChange={setCurrentPassword}
              variant="bordered"
              labelPlacement="outside"
              radius="sm"
            />
            <Input
              type="password"
              label="Mật khẩu mới"
              value={newPassword}
              onValueChange={setNewPassword}
              variant="bordered"
              labelPlacement="outside"
              radius="sm"
            />
            <Input
              type="password"
              label="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onValueChange={setConfirmPassword}
              variant="bordered"
              labelPlacement="outside"
              radius="sm"
            />
          </div>
          {passwordError && (
            <p className="text-sm text-danger-500">{passwordError}</p>
          )}
          <div className="flex justify-end">
            <Button type="submit" color="primary" size="sm" isLoading={isChangingPassword}>
              Đổi mật khẩu
            </Button>
          </div>
        </form>

        <Divider />

        {/* Phiên đăng nhập */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="font-medium text-slate-800 dark:text-white">
              Phiên đăng nhập đang hoạt động
            </p>
            <Button
              size="sm"
              variant="flat"
              color="danger"
              startContent={<LogOut size={14} />}
              isLoading={isRevokingAll}
              onPress={handleRevokeAll}
            >
              Đăng xuất khỏi tất cả thiết bị
            </Button>
          </div>

          {sessionsError && (
            <p className="text-sm text-danger-500">{sessionsError}</p>
          )}

          {isLoadingSessions ? (
            <p className="text-sm text-slate-400">Đang tải...</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-400">Không có phiên đăng nhập nào đang hoạt động.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="w-4 h-4 text-slate-400" />
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Đăng nhập lúc{" "}
                      {format(parseISO(session.createdAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    isLoading={revokingId === session.id}
                    onPress={() => handleRevokeSession(session.id)}
                  >
                    Đăng xuất
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default SecuritySettings;
