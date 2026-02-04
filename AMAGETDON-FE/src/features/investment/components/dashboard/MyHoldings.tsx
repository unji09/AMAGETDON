import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Heart } from 'lucide-react';
import type { StockHoldingItem } from '../../types/investment';
import { formatWon, formatRate } from '../../utils/format';
import { addToWatchlist, removeFromWatchlist } from '@/api/investmentApi';
import './MyHoldings.css';

interface MyHoldingsProps {
    holdings: StockHoldingItem[];
    watchlistCodes: Set<string>;
    onWatchlistChange: () => void;
}

export const MyHoldings = ({ holdings, watchlistCodes, onWatchlistChange }: MyHoldingsProps) => {
    const navigate = useNavigate();
    const [loadingCode, setLoadingCode] = useState<string | null>(null);

    const handleToggleWatchlist = async (e: React.MouseEvent, stockCode: string) => {
        e.stopPropagation();
        if (loadingCode) return;
        setLoadingCode(stockCode);
        try {
            if (watchlistCodes.has(stockCode)) {
                await removeFromWatchlist(stockCode);
            } else {
                await addToWatchlist(stockCode);
            }
            onWatchlistChange();
        } catch { /* */ } finally {
            setLoadingCode(null);
        }
    };

    return (
        <div className="my-holdings">
            <div className="my-holdings__header">
                <h3 className="my-holdings__title">내 종목</h3>
                <button
                    type="button"
                    className="my-holdings__more-link"
                    onClick={() => navigate('/investment/holdings')}
                >
                    전체보기 <ChevronRight size={14} />
                </button>
            </div>

            {holdings.length === 0 ? (
                <p className="my-holdings__empty">보유 중인 종목이 없습니다.</p>
            ) : (
                <div className="my-holdings__list">
                    {holdings.map((item) => {
                        const isProfit = item.profitRate >= 0;
                        const isFav = watchlistCodes.has(item.stockCode);
                        return (
                            <div
                                key={item.stockCode}
                                className="my-holdings__item"
                                onClick={() => navigate(`/investment/${item.stockCode}`)}
                            >
                                <div className="my-holdings__item-left">
                                    <span className="my-holdings__item-name">{item.stockName}</span>
                                    <span className="my-holdings__item-qty">보유 {item.quantity}주</span>
                                </div>
                                <div className="my-holdings__item-right">
                                    <div className="my-holdings__item-values">
                                        <span className={`my-holdings__item-rate ${isProfit ? 'my-holdings__item-rate--up' : 'my-holdings__item-rate--down'}`}>
                                            {formatRate(item.profitRate)}
                                        </span>
                                        <span className="my-holdings__item-value">{formatWon(item.totalValue)}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className={`my-holdings__fav-btn ${isFav ? 'my-holdings__fav-btn--active' : ''}`}
                                        onClick={(e) => handleToggleWatchlist(e, item.stockCode)}
                                        disabled={loadingCode === item.stockCode}
                                    >
                                        <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
