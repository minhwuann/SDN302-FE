import TransactionItem from "./TransactionItem";
import { formatDateHeader } from "./useTransactionList";

/**
 * Nhóm giao dịch theo ngày: header ngày (thứ cấp) + danh sách phẳng
 * với dải phân cách mảnh, không lồng card trong card.
 */
const TransactionGroup = ({ date, transactions, onEdit, onDelete }) => {
  return (
    <div className="mb-5">
      <h3 className="mb-2 px-1 text-[13px] font-semibold text-default-600 dark:text-default-500">
        {formatDateHeader(date)}
      </h3>
      <div className="overflow-hidden rounded-[14px] border border-divider bg-content1">
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

