import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Progress,
  Checkbox,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import { Plus, ShoppingCart, Trash2, ShoppingBag } from "lucide-react";
import { useTransactionsContext } from "../../contexts/TransactionsContext";
import { useAuth } from "../../contexts/AuthContext";
import * as shoppingApi from "../../services/shoppingApi";
import { formatCurrency } from "../../utils/formatCurrency";

/**
 * Parse amount string với hỗ trợ "k"/"m". "55k" -> 55000, "1.5m" -> 1500000.
 */
const parseVNDAmount = (input) => {
  if (typeof input === "number") return input;
  if (!input) return 0;
  const str = String(input).toLowerCase().trim();
  if (str.endsWith("k")) {
    const num = parseFloat(str.slice(0, -1).replace(/,/g, "."));
    return isNaN(num) ? 0 : Math.round(num * 1000);
  }
  if (str.endsWith("m")) {
    const num = parseFloat(str.slice(0, -1).replace(/,/g, "."));
    return isNaN(num) ? 0 : Math.round(num * 1000000);
  }
  const cleaned = str.replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
};

/**
 * ShoppingListTab - Sổ Tay Mua Sắm (qua Backend REST).
 */
const ShoppingListTab = () => {
  const { currentUser } = useAuth();
  const { addTransaction, currentLedger } = useTransactionsContext();
  const ledgerId = currentLedger?.id;

  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanBudget, setNewPlanBudget] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  const fetchPlans = useCallback(async () => {
    if (!ledgerId) {
      setPlans([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await shoppingApi.listPlans(ledgerId);
      setPlans(data);
    } catch (e) {
      console.error("Lỗi tải kế hoạch mua sắm:", e);
    } finally {
      setLoading(false);
    }
  }, [ledgerId]);

  useEffect(() => {
    if (!currentUser) return;
    fetchPlans();
  }, [currentUser, fetchPlans]);

  /** Mở chi tiết 1 plan (tải kèm items). */
  const openPlan = async (planId) => {
    try {
      const detail = await shoppingApi.getPlan(planId);
      setActivePlan(detail);
    } catch (e) {
      console.error("Lỗi mở kế hoạch:", e);
    }
  };

  const refreshActivePlan = useCallback(async () => {
    if (!activePlan) return;
    const detail = await shoppingApi.getPlan(activePlan.id);
    setActivePlan(detail);
  }, [activePlan]);

  const handleCreatePlan = async () => {
    if (!newPlanName || !newPlanBudget || !ledgerId) return;
    try {
      await shoppingApi.createPlan(
        ledgerId,
        newPlanName,
        parseVNDAmount(newPlanBudget)
      );
      onOpenChange(false);
      setNewPlanName("");
      setNewPlanBudget("");
      await fetchPlans();
    } catch (e) {
      console.error("Lỗi tạo plan:", e);
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      await shoppingApi.deletePlan(planToDelete);
      if (activePlan?.id === planToDelete) setActivePlan(null);
      await fetchPlans();
    } catch (e) {
      console.error("Lỗi xóa plan:", e);
    } finally {
      setDeleteModalOpen(false);
      setPlanToDelete(null);
    }
  };

  const openDeleteModal = (planId) => {
    setPlanToDelete(planId);
    setDeleteModalOpen(true);
  };

  const handleAddItem = async (name, price) => {
    if (!activePlan) return;
    await shoppingApi.addItem(activePlan.id, name, parseVNDAmount(price));
    await refreshActivePlan();
  };

  const handleToggleItem = async (itemId, isChecked) => {
    if (!activePlan) return;
    const item = activePlan.items.find((i) => i.id === itemId);
    await shoppingApi.updateItem(itemId, { isBought: isChecked });
    await refreshActivePlan();

    // Khi tick mua -> tự thêm giao dịch chi tiêu (giữ hành vi cũ)
    if (isChecked && item) {
      try {
        await addTransaction({
          date: new Date().toISOString().split("T")[0],
          type: "expense",
          amount: item.price,
          category: "Mua sắm",
          note: `Mua sắm theo kế hoạch: ${activePlan.name} - ${item.name}`,
          paymentMethod: "cash",
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!activePlan) return;
    await shoppingApi.deleteItem(itemId);
    await refreshActivePlan();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" label="Đang tải..." />
      </div>
    );
  }

  const renderPlanDetail = () => {
    if (!activePlan) return null;
    const items = activePlan.items || [];
    const totalEstimated = items.reduce((sum, i) => sum + i.price, 0);
    const totalBought = items
      .filter((i) => i.isBought)
      .reduce((sum, i) => sum + i.price, 0);
    const remainingBudget = activePlan.budget - totalEstimated;
    const progress = activePlan.budget
      ? (totalEstimated / activePlan.budget) * 100
      : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="light" onPress={() => setActivePlan(null)}>
            ← Quay lại
          </Button>
          <h2 className="text-lg font-semibold text-foreground truncate px-2">
            {activePlan.name}
          </h2>
          <Button
            isIconOnly
            color="danger"
            variant="light"
            onPress={() => openDeleteModal(activePlan.id)}
          >
            <Trash2 size={20} />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-[14px] border border-divider bg-content1 p-4">
            <p className="text-default-600 text-sm">Ngân sách</p>
            <p className="vvv-tnum text-xl sm:text-2xl font-bold text-foreground">
              {formatCurrency(activePlan.budget)}
            </p>
          </div>
          <div className="rounded-[14px] border border-divider bg-content1 p-4">
            <p className="text-default-600 text-sm">Dự kiến chi</p>
            <p
              className={`vvv-tnum text-xl sm:text-2xl font-bold ${
                remainingBudget < 0 ? "text-danger-600" : "text-foreground"
              }`}
            >
              {formatCurrency(totalEstimated)}
            </p>
          </div>
          <div className="rounded-[14px] border border-divider bg-content1 p-4">
            <p className="text-default-600 text-sm">Thực tế đã mua</p>
            <p className="vvv-tnum text-xl sm:text-2xl font-bold text-success-600">
              {formatCurrency(totalBought)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Tiến độ ngân sách
            </span>
            <span
              className={
                remainingBudget < 0 ? "text-red-500 font-bold" : "text-slate-500"
              }
            >
              {remainingBudget < 0 ? "Vượt ngân sách!" : "Trong tầm kiểm soát"}
            </span>
          </div>
          <Progress
            aria-label="Tiến độ ngân sách"
            value={Math.min(progress, 100)}
            color={remainingBudget < 0 ? "danger" : "primary"}
            className="h-3"
          />
        </div>

        <AddNewItemForm onAdd={handleAddItem} />

        <div className="space-y-3">
          {items.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              Chưa có món nào. Thêm ngay để bắt đầu săn sale!
            </div>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  isSelected={item.isBought}
                  onValueChange={(checked) => handleToggleItem(item.id, checked)}
                  lineThrough
                  color="success"
                >
                  <span
                    className={
                      item.isBought
                        ? "text-slate-400 line-through"
                        : "text-slate-800 dark:text-white font-medium"
                    }
                  >
                    {item.name}
                  </span>
                </Checkbox>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrency(item.price)}
                </span>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={() => handleDeleteItem(item.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full">
      {activePlan ? (
        renderPlanDetail()
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card
              isPressable
              onPress={onOpen}
              className="h-48 border-2 border-dashed border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                  <Plus className="w-6 h-6 text-primary-600" />
                </div>
                <span className="font-medium">Tạo kế hoạch mới</span>
              </div>
            </Card>

            {plans.map((plan) => {
              const allBought =
                plan.itemCount > 0 && plan.boughtCount >= plan.itemCount;
              return (
                <div
                  key={plan.id}
                  className="cursor-pointer"
                  onClick={() => openPlan(plan.id)}
                >
                  <Card radius="lg" className="h-48 bg-content1 border border-divider shadow-none hover:bg-content2 transition-colors relative overflow-hidden group">
                    <CardHeader className="flex gap-3">
                      <div className="p-2 rounded-[10px] bg-primary-50 text-primary dark:bg-primary-500/15">
                        <ShoppingBag size={20} />
                      </div>
                      <div className="flex flex-col items-start">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1">
                          {plan.name}
                        </h3>
                        <p className="text-tiny text-slate-400">
                          {plan.createdAt
                            ? new Date(plan.createdAt).toLocaleDateString("vi-VN")
                            : ""}
                        </p>
                      </div>
                    </CardHeader>
                    <CardBody className="justify-end pb-4">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-slate-500 text-xs">Ngân sách</span>
                        <span className="text-lg font-bold text-primary-600">
                          {formatCurrency(plan.budget)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary-500 h-full"
                          style={{
                            width: `${
                              plan.budget
                                ? Math.min(
                                    (plan.estimatedTotal / plan.budget) * 100,
                                    100
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Chip size="sm" variant="flat" color="primary">
                          {plan.itemCount} món
                        </Chip>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={allBought ? "success" : "warning"}
                        >
                          {allBought ? "Đã xong" : "Đang mua"}
                        </Chip>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal isOpen={deleteModalOpen} onOpenChange={setDeleteModalOpen} size="sm">
        <ModalContent>
          <ModalHeader className="flex items-center gap-2 text-danger-500">
            <Trash2 className="w-5 h-5" />
            Xác nhận xóa
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-600 dark:text-gray-400">
              Bạn có chắc chắn muốn xóa kế hoạch này? Hành động này không thể hoàn
              tác.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setDeleteModalOpen(false)}>
              Hủy
            </Button>
            <Button color="danger" onPress={handleDeletePlan}>
              Xóa kế hoạch
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <CreatePlanModal
        isOpen={isOpen}
        onClose={() => onOpenChange(false)}
        name={newPlanName}
        setName={setNewPlanName}
        budget={newPlanBudget}
        setBudget={setNewPlanBudget}
        onSubmit={handleCreatePlan}
      />
    </div>
  );
};

const formatInputAmount = (value) => {
  const numericValue = String(value).replace(/[^\d]/g, "");
  if (!numericValue) return "";
  return Number(numericValue).toLocaleString("vi-VN");
};

const parseInputAmount = (value) => {
  const numericValue = String(value).replace(/[^\d]/g, "");
  return numericValue || "";
};

const CreatePlanModal = ({
  isOpen,
  onClose,
  name,
  setName,
  budget,
  setBudget,
  onSubmit,
}) => (
  <Modal isOpen={isOpen} onOpenChange={onClose} size="md">
    <ModalContent>
      {(onClose) => (
        <>
          <ModalHeader className="flex flex-col gap-1 pb-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[10px] bg-primary-50 text-primary dark:bg-primary-500/15">
                <ShoppingBag size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Tạo Kế Hoạch Mua Sắm
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                  Lên danh sách và theo dõi ngân sách chi tiêu
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="pt-6">
            <div className="space-y-4">
              <Input
                label="Tên kế hoạch"
                placeholder="VD: Săn sale 12/12, Mua đồ tết..."
                value={name}
                onValueChange={setName}
                autoFocus
                variant="bordered"
                size="lg"
                startContent={<ShoppingCart className="w-4 h-4 text-gray-400" />}
              />
              <Input
                label="Ngân sách dự kiến"
                placeholder="2,000,000"
                value={formatInputAmount(budget)}
                onValueChange={(val) => setBudget(parseInputAmount(val))}
                variant="bordered"
                size="lg"
                endContent={
                  <span className="text-xs text-gray-400 font-medium">VND</span>
                }
              />
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  💡 <strong>Gợi ý:</strong> Đặt ngân sách hợp lý để theo dõi chi
                  tiêu hiệu quả. Bạn có thể thêm danh sách mua sắm sau khi tạo kế
                  hoạch.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Hủy
            </Button>
            <Button
              color="primary"
              onPress={onSubmit}
              isDisabled={!name.trim() || !budget}
              className="font-semibold"
            >
              Tạo kế hoạch
            </Button>
          </ModalFooter>
        </>
      )}
    </ModalContent>
  </Modal>
);

const AddNewItemForm = ({ onAdd }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && price) {
      onAdd(name, price);
      setName("");
      setPrice("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 items-end p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700"
    >
      <Input
        label="Tên món đồ"
        placeholder="VD: Giày Adidas"
        size="sm"
        className="flex-1"
        value={name}
        onValueChange={setName}
      />
      <Input
        label="Giá dự kiến"
        placeholder="0"
        size="sm"
        className="w-32"
        value={formatInputAmount(price)}
        onValueChange={(val) => setPrice(parseInputAmount(val))}
        endContent={<span className="text-xs text-gray-400">VND</span>}
      />
      <Button isIconOnly color="primary" type="submit">
        <Plus size={20} />
      </Button>
    </form>
  );
};

export default ShoppingListTab;
