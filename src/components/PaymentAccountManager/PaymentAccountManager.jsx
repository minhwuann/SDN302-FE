import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
} from "@heroui/react";
import { Plus, Pencil, Trash2, Landmark, Lock } from "lucide-react";
import { useTransactionsContext } from "../../contexts/TransactionsContext";
import * as paymentAccountApi from "../../services/paymentAccountApi";

const COLOR_PALETTE = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#0EA5E9",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#D946EF",
  "#EC4899",
  "#F43F5E",
  "#64748B",
];

const TYPE_OPTIONS = [
  { key: "cash", label: "Tiền mặt" },
  { key: "traditional_bank", label: "Ngân hàng truyền thống" },
  { key: "digital_bank", label: "Ngân hàng số" },
  { key: "e_wallet", label: "Ví điện tử" },
];

const TYPE_LABEL = Object.fromEntries(TYPE_OPTIONS.map((t) => [t.key, t.label]));

const ERROR_MESSAGES = {
  RESERVED_PAYMENT_ACCOUNT_NAME:
    "Tên này đã được dùng cho một tài khoản hệ thống. Vui lòng chọn tên khác.",
  PAYMENT_ACCOUNT_ALREADY_EXISTS: "Bạn đã có tài khoản với tên này.",
  SYSTEM_PAYMENT_ACCOUNT_READ_ONLY: "Không thể sửa/xoá tài khoản hệ thống.",
};

/**
 * Component quản lý tài khoản thanh toán (CRUD tài khoản do người dùng tạo).
 * Tài khoản hệ thống (is_system) chỉ hiển thị, không cho sửa/xoá.
 */
const PaymentAccountManager = () => {
  const { paymentAccounts, refreshPaymentAccounts } = useTransactionsContext();

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    type: "cash",
    color: "#3B82F6",
  });
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormData({ name: "", shortName: "", type: "cash", color: "#3B82F6" });
    setError(null);
    onOpen();
  };

  const handleOpenEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      shortName: account.shortName || "",
      type: account.type,
      color: account.color || "#3B82F6",
    });
    setError(null);
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    try {
      setIsSaving(true);
      setError(null);
      if (editingAccount) {
        await paymentAccountApi.updatePaymentAccount(editingAccount.id, {
          name: formData.name,
          shortName: formData.shortName || null,
          color: formData.color,
        });
      } else {
        await paymentAccountApi.createPaymentAccount({
          name: formData.name,
          shortName: formData.shortName || null,
          type: formData.type,
          color: formData.color,
        });
      }
      await refreshPaymentAccounts();
      onOpenChange(false);
    } catch (err) {
      setError(ERROR_MESSAGES[err?.code] || err?.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (account) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản "${account.name}"?`)) return;
    try {
      await paymentAccountApi.deletePaymentAccount(account.id);
      await refreshPaymentAccounts();
    } catch (err) {
      window.alert(ERROR_MESSAGES[err?.code] || err?.message || "Không thể xoá tài khoản.");
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-900 shadow-md">
      <CardHeader className="flex items-center gap-2 px-6 pt-5 pb-0">
        <Landmark className="w-5 h-5 text-primary-500" />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
          Quản Lý Tài Khoản Thanh Toán
        </h3>
      </CardHeader>
      <CardBody className="px-6 pb-6 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {paymentAccounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-3 bg-content1 rounded-[10px] border border-divider hover:bg-content2 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-xs font-semibold"
                  style={{
                    backgroundColor: `${account.color || "#64748B"}20`,
                    color: account.color || "#64748B",
                  }}
                >
                  {account.shortName?.slice(0, 3) || account.name.slice(0, 3)}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-slate-700 dark:text-slate-200 truncate">
                    {account.name}
                  </p>
                  <p className="text-xs text-slate-400">{TYPE_LABEL[account.type] || account.type}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {account.isSystem ? (
                  <Chip
                    size="sm"
                    variant="flat"
                    startContent={<Lock className="w-3 h-3" />}
                    className="text-slate-400"
                  >
                    Hệ thống
                  </Chip>
                ) : (
                  <>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleOpenEdit(account)}
                    >
                      <Pencil className="w-4 h-4 text-slate-500" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => handleDelete(account)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </CardBody>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {editingAccount ? "Sửa tài khoản" : "Thêm tài khoản mới"}
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Tên tài khoản"
                  placeholder="Ví dụ: Quỹ riêng"
                  value={formData.name}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, name: val }))
                  }
                  autoFocus
                />
                <Input
                  label="Tên viết tắt (tuỳ chọn)"
                  placeholder="Ví dụ: QR"
                  value={formData.shortName}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, shortName: val }))
                  }
                />

                {!editingAccount && (
                  <Select
                    label="Loại tài khoản"
                    selectedKeys={[formData.type]}
                    onSelectionChange={(keys) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: Array.from(keys)[0] || "cash",
                      }))
                    }
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.key}>{opt.label}</SelectItem>
                    ))}
                  </Select>
                )}

                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Chọn màu sắc
                  </p>
                  <div className="grid grid-cols-9 gap-2">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, color }))
                        }
                        className={`w-8 h-8 rounded-full transition-all ${
                          formData.color === color
                            ? "ring-2 ring-offset-2 ring-slate-500"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-danger-500">{error}</p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Hủy
                </Button>
                <Button
                  color="primary"
                  onPress={handleSubmit}
                  isLoading={isSaving}
                  className="active-scale"
                >
                  {editingAccount ? "Lưu" : "Thêm"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Card>
  );
};

export default PaymentAccountManager;
