import { Card, CardBody } from "@heroui/react";
import TransactionItem from "./TransactionItem";
import { formatDateHeader } from "./useTransactionList";

/**
 * Component hiển thị nhóm giao dịch theo ngày
 * Bao gồm header ngày và danh sách các giao dịch trong ngày đó
 */
const TransactionGroup = ({ date, transactions, onEdit, onDelete }) => {
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {formatDateHeader(date)}
        </h3>
      </div>
      <div className="flex flex-col">
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default TransactionGroup;

