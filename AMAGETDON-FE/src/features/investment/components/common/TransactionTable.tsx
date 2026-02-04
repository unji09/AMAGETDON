import { useNavigate } from 'react-router-dom';
import type { TransactionItem } from '../../types/investment';
import { formatWon } from '../../utils/format';
import './TransactionTable.css';

interface TransactionTableProps {
    items: TransactionItem[];
}

const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const time = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
};

export const TransactionTable = ({ items }: TransactionTableProps) => {
    const navigate = useNavigate();

    return (
        <div className="transaction-table__wrapper">
            <table className="transaction-table">
                <thead>
                    <tr>
                        <th>일자</th>
                        <th>종목명</th>
                        <th>구분</th>
                        <th className="transaction-table__right">수량</th>
                        <th className="transaction-table__right">단가</th>
                        <th className="transaction-table__right">거래대금</th>
                        <th className="transaction-table__right">수수료/세금</th>
                        <th>상태</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="transaction-table__empty">거래 내역이 없습니다.</td>
                        </tr>
                    ) : (
                        items.map((tx) => {
                            const { date, time } = formatDateTime(tx.createdAt);
                            const isBuy = tx.transactionType === 'BUY';
                            return (
                                <tr
                                    key={tx.transactionId}
                                    className="transaction-table__row"
                                    onClick={() => navigate(`/investment/${tx.stockCode}`)}
                                >
                                    <td>
                                        <div className="transaction-table__date">{date}</div>
                                        <div className="transaction-table__time">{time}</div>
                                    </td>
                                    <td>
                                        <div className="transaction-table__stock-name">{tx.stockName}</div>
                                        <div className="transaction-table__stock-code">{tx.stockCode}</div>
                                    </td>
                                    <td>
                                        <span className={`transaction-table__badge ${isBuy ? 'transaction-table__badge--buy' : 'transaction-table__badge--sell'}`}>
                                            {isBuy ? '매수' : '매도'}
                                        </span>
                                    </td>
                                    <td className="transaction-table__right">{tx.quantity.toLocaleString()}</td>
                                    <td className="transaction-table__right">{formatWon(tx.price)}</td>
                                    <td className="transaction-table__right">{formatWon(tx.totalAmount)}</td>
                                    <td className="transaction-table__right">{formatWon(tx.feeAmount)}</td>
                                    <td><span className="transaction-table__status">체결완료</span></td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};
