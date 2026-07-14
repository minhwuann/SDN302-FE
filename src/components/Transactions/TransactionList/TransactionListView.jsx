import { Receipt } from "lucide-react";
import TransactionGroup from "./TransactionGroup";
import { useTransactionList } from "./useTransactionList";
import EmptyState from "../../ui/EmptyState";

/**
 * Component hiển thị danh sách giao dịch dạng list (gom nhóm theo ngày)
 * Được tách riêng để dùng trong TransactionList container
 */
const TransactionListView = ({ transactions, onEdit, onDelete }) => {
  const { groupedTransactions, sortedDates } = useTransactionList(transactions);

  if (sortedDates.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Chưa có giao dịch nào"
        description="Các giao dịch bạn thêm sẽ xuất hiện tại đây, gom nhóm theo ngày."
      />
    );
  }

  return (
    <div>
      {sortedDates.map((date) => (
        <TransactionGroup
          key={date}
          date={date}
          transactions={groupedTransactions[date]}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default TransactionListView;

