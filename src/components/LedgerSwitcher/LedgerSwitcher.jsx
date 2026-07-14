import { useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  useDisclosure,
} from "@heroui/react";
import { ChevronDown, Plus, Wallet, Pencil, Trash2 } from "lucide-react";
import { useTransactionsContext } from "../../contexts/TransactionsContext";

/**
 * Component quản lý sổ thu chi (Ledger)
 * Hỗ trợ CRUD: Tạo, Đọc, Sửa, Xóa sổ thu chi
 */
const LedgerSwitcher = ({ compact = false }) => {
  const {
    currentLedger,
    ledgers,
    switchLedger,
    addLedger,
    updateLedger,
    deleteLedger,
  } = useTransactionsContext();

  // Modal states
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit" | "delete"
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [ledgerName, setLedgerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Mở modal tạo sổ mới
   */
  const handleOpenCreate = () => {
    setModalMode("create");
    setLedgerName("");
    setSelectedLedger(null);
    setError("");
    onOpen();
  };

  /**
   * Mở modal sửa sổ
   */
  const handleOpenEdit = (ledger, e) => {
    e.stopPropagation();
    setModalMode("edit");
    setLedgerName(ledger.name);
    setSelectedLedger(ledger);
    setError("");
    onOpen();
  };

  /**
   * Mở modal xác nhận xóa sổ
   */
  const handleOpenDelete = (ledger, e) => {
    e.stopPropagation();
    setModalMode("delete");
    setSelectedLedger(ledger);
    setError("");
    onOpen();
  };

  /**
   * Xử lý tạo sổ mới
   */
  const handleCreate = async (onClose) => {
    if (!ledgerName.trim()) return;

    setIsLoading(true);
    setError("");
    try {
      const newLedger = await addLedger(ledgerName.trim());
      switchLedger(newLedger);
      onClose();
      setLedgerName("");
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi tạo sổ");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Xử lý cập nhật tên sổ
   */
  const handleUpdate = async (onClose) => {
    if (!ledgerName.trim() || !selectedLedger) return;

    setIsLoading(true);
    setError("");
    try {
      await updateLedger(selectedLedger.id, ledgerName.trim());
      onClose();
      setLedgerName("");
      setSelectedLedger(null);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi cập nhật");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Xử lý xóa sổ
   */
  const handleDelete = async (onClose) => {
    if (!selectedLedger) return;

    setIsLoading(true);
    setError("");
    try {
      await deleteLedger(selectedLedger.id);
      onClose();
      setSelectedLedger(null);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi xóa");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Render modal content dựa trên mode
   */
  const renderModalContent = (onClose) => {
    if (modalMode === "delete") {
      return (
        <>
          <ModalHeader className="flex flex-col gap-1 pb-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[10px] bg-danger-50 text-danger-600 dark:bg-danger-500/15 dark:text-danger-400">
                <Trash2 size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Xóa Sổ Thu Chi
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                  Hành động này không thể hoàn tác
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="pt-6">
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                <p className="text-red-700 dark:text-red-300">
                  Bạn có chắc muốn xóa sổ{" "}
                  <strong>"{selectedLedger?.name}"</strong>?
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  ⚠️ Các giao dịch trong sổ này sẽ không bị xóa, nhưng sẽ không
                  thể truy cập qua sổ này nữa.
                </p>
              </div>
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Hủy
            </Button>
            <Button
              color="danger"
              onPress={() => handleDelete(onClose)}
              isLoading={isLoading}
              className="font-semibold"
            >
              Xóa sổ
            </Button>
          </ModalFooter>
        </>
      );
    }

    // Create or Edit mode
    return (
      <>
        <ModalHeader className="flex flex-col gap-1 pb-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-[10px] ${
                modalMode === "edit"
                  ? "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400"
                  : "bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400"
              }`}
            >
              {modalMode === "edit" ? (
                <Pencil size={22} />
              ) : (
                <Wallet size={22} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {modalMode === "edit" ? "Sửa Sổ Thu Chi" : "Tạo Sổ Thu Chi Mới"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                {modalMode === "edit"
                  ? "Đổi tên sổ thu chi"
                  : "Quản lý tài chính theo từng sổ riêng biệt"}
              </p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="pt-6">
          <div className="space-y-4">
            <Input
              autoFocus
              label="Tên sổ thu chi"
              placeholder="Ví dụ: Cửa hàng mẹ, Quỹ lớp, Chi tiêu gia đình..."
              variant="bordered"
              size="lg"
              value={ledgerName}
              onValueChange={setLedgerName}
              startContent={<Wallet className="w-4 h-4 text-gray-400" />}
              classNames={{
                label: "font-medium",
                input: "text-base",
              }}
            />
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            {modalMode === "create" && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>Gợi ý:</strong> Mỗi sổ thu chi giúp bạn quản lý tài
                  chính riêng biệt cho từng mục đích khác nhau như cá nhân, gia
                  đình, kinh doanh...
                </p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Hủy
          </Button>
          <Button
            color="primary"
            onPress={() =>
              modalMode === "edit"
                ? handleUpdate(onClose)
                : handleCreate(onClose)
            }
            isLoading={isLoading}
            isDisabled={!ledgerName.trim()}
            className="font-semibold"
          >
            {modalMode === "edit" ? "Lưu thay đổi" : "Tạo sổ mới"}
          </Button>
        </ModalFooter>
      </>
    );
  };

  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          {compact ? (
            <Button
              variant="flat"
              className="w-full justify-between bg-content2 h-9 px-2.5 rounded-[10px]"
              aria-label="Chọn sổ thu chi"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Wallet size={16} className="text-primary flex-shrink-0" />
                <span className="font-medium text-sm truncate">
                  {currentLedger?.name || "Sổ Chính"}
                </span>
              </div>
              <ChevronDown size={15} className="text-default-500 flex-shrink-0" />
            </Button>
          ) : (
            <Button
              variant="flat"
              className="w-full justify-between bg-content2 h-12 px-3 rounded-[10px]"
              aria-label="Chọn sổ thu chi"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                  <Wallet size={16} />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-[11px] text-default-500">Sổ thu chi</span>
                  <span className="font-semibold text-sm truncate max-w-[120px]">
                    {currentLedger?.name || "Sổ Chính"}
                  </span>
                </div>
              </div>
              <ChevronDown size={16} className="text-default-500 flex-shrink-0" />
            </Button>
          )}
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Ledger Actions"
          onAction={(key) => {
            if (key === "add_new") {
              handleOpenCreate();
            } else {
              const selected = ledgers.find((l) => l.id === key);
              if (selected) switchLedger(selected);
            }
          }}
        >
          <DropdownSection title="Sổ thu chi của bạn" showDivider>
            {ledgers.map((item) => {
              const isSelected = currentLedger?.id === item.id;
              return (
                <DropdownItem
                  key={item.id}
                  className={
                    isSelected
                      ? "bg-primary-100 text-primary-700 font-semibold"
                      : ""
                  }
                  startContent={
                    <Wallet
                      size={14}
                      className={
                        isSelected ? "text-primary-500" : "text-gray-500"
                      }
                    />
                  }
                  endContent={
                    <div
                      className="flex gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Edit button - hiển thị cho tất cả sổ */}
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="min-w-6 w-6 h-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleOpenEdit(item, e);
                        }}
                      >
                        <Pencil size={12} className="text-gray-500" />
                      </Button>
                      {/* Delete button - chỉ hiển thị khi có > 1 sổ */}
                      {ledgers.length > 1 && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="min-w-6 w-6 h-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleOpenDelete(item, e);
                          }}
                        >
                          <Trash2 size={12} className="text-red-500" />
                        </Button>
                      )}
                    </div>
                  }
                >
                  {item.name}
                </DropdownItem>
              );
            })}
          </DropdownSection>

          <DropdownSection>
            <DropdownItem
              key="add_new"
              className="text-primary"
              startContent={<Plus size={14} />}
            >
              Thêm sổ mới...
            </DropdownItem>
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
        <ModalContent>{(onClose) => renderModalContent(onClose)}</ModalContent>
      </Modal>
    </>
  );
};

export default LedgerSwitcher;
