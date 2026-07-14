import { Card, CardBody } from "@heroui/react";
import TransactionGroup from "./TransactionGroup";
import { useTransactionList } from "./useTransactionList";

/**
 * Component hiển thị danh sách giao dịch dạng list (gom nhóm theo ngày)
 * Được tách riêng để dùng trong TransactionList container
 */
const TransactionListView = ({ transactions, onEdit, onDelete }) => {
  const { groupedTransactions, sortedDates } = useTransactionList(transactions);

  if (sortedDates.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
        <CardBody className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Chưa có giao dịch nào
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
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

