import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { TransactionItem } from '../../types/investment';
import { formatWon } from '../../utils/format';
import './RecentTransactions.css';

interface RecentTransactionsProps {
    transactions: TransactionItem[];
    totalElements: number;
}

export const RecentTransactions = ({ transactions, totalElements }: RecentTransactionsProps) => {
    const navigate = useNavigate();

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
    };

    return (
        <div className="recent-transactions">
            <div className="recent-transactions__header">
                <h2 className="recent-transactions__title">최근 거래 내역</h2>
                <button
                    type="button"
                    className="recent-transactions__more-link"
                    onClick={() => navigate('/investment/transactions')}
                >
                    전체보기 <ChevronRight size={14} />
                </button>
            </div>

            {transactions.length === 0 ? (
                <p className="recent-transactions__empty">거래 내역이 없습니다.</p>
            ) : (
                <div className="recent-transactions__list">
                    {transactions.map((tx) => {
                        const isBuy = tx.transactionType === 'BUY';
                        return (
                            <div
                                key={tx.transactionId}
                                className="recent-transactions__item"
                                onClick={() => navigate(`/investment/${tx.stockCode}`)}
                            >
                                <div className="recent-transactions__item-left">
                                    <span className="recent-transactions__item-name">{tx.stockName}</span>
                                    <span className="recent-transactions__item-date">{formatDate(tx.createdAt)}</span>
                                </div>
                                <div className="recent-transactions__item-center">
                                    <span className={`recent-transactions__badge ${isBuy ? 'recent-transactions__badge--buy' : 'recent-transactions__badge--sell'}`}>
                                        {isBuy ? '매수' : '매도'}
                                    </span>
                                    <span className="recent-transactions__item-qty">{tx.quantity}주</span>
                                </div>
                                <div className="recent-transactions__item-right">
                                    <span className="recent-transactions__item-amount">{formatWon(tx.totalAmount)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
