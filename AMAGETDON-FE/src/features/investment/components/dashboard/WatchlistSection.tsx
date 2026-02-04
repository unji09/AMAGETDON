import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Heart } from 'lucide-react';
import type { WatchlistStockItem } from '../../types/investment';
import { formatPrice } from '../../utils/format';
import { removeFromWatchlist } from '@/api/investmentApi';
import './WatchlistSection.css';

interface WatchlistSectionProps {
    stocks: WatchlistStockItem[];
    totalElements: number;
    onWatchlistChange: () => void;
}

export const WatchlistSection = ({ stocks, totalElements, onWatchlistChange }: WatchlistSectionProps) => {
    const navigate = useNavigate();
    const [loadingId, setLoadingId] = useState<number | null>(null);

    const handleRemove = async (e: React.MouseEvent, stockCode: string, watchlistId: number) => {
        e.stopPropagation();
        if (loadingId) return;
        setLoadingId(watchlistId);
        try {
            await removeFromWatchlist(stockCode);
            onWatchlistChange();
        } catch { /* */ } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="watchlist-section">
            <div className="watchlist-section__header">
                <h3 className="watchlist-section__title">관심 종목</h3>
                <button
                    type="button"
                    className="watchlist-section__more-link"
                    onClick={() => navigate('/investment/watchlist')}
                >
                    전체보기 <ChevronRight size={14} />
                </button>
            </div>

            {stocks.length === 0 ? (
                <p className="watchlist-section__empty">관심 종목이 없습니다.</p>
            ) : (
                <div className="watchlist-section__list">
                    {stocks.map((item) => {
                        const isUp = item.changeRate >= 0;
                        return (
                            <div
                                key={item.watchlistId}
                                className="watchlist-section__item"
                                onClick={() => navigate(`/investment/${item.stockCode}`)}
                            >
                                <div className="watchlist-section__item-left">
                                    <span className="watchlist-section__item-name">{item.stockName}</span>
                                    <span className="watchlist-section__item-code">{item.stockCode}</span>
                                </div>
                                <div className="watchlist-section__item-right">
                                    <div className="watchlist-section__item-values">
                                        <span className="watchlist-section__item-price">{formatPrice(item.currentPrice)}</span>
                                        <span className={`watchlist-section__item-rate ${isUp ? 'watchlist-section__item-rate--up' : 'watchlist-section__item-rate--down'}`}>
                                            {isUp ? '+' : ''}{item.changeRate.toFixed(2)}%
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="watchlist-section__fav-btn"
                                        onClick={(e) => handleRemove(e, item.stockCode, item.watchlistId)}
                                        disabled={loadingId === item.watchlistId}
                                    >
                                        <Heart size={14} fill="currentColor" />
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
