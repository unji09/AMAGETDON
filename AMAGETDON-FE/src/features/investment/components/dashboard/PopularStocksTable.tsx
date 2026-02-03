import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { VolumeRankingItem } from '../../types/investment';
import { formatPrice, formatVolume } from '../../utils/format';
import { addToWatchlist, removeFromWatchlist } from '@/api/investmentApi';
import './PopularStocksTable.css';

interface PopularStocksTableProps {
    rankings: VolumeRankingItem[];
    watchlistCodes: Set<string>;
    onWatchlistChange: () => void;
}

export const PopularStocksTable = ({ rankings, watchlistCodes, onWatchlistChange }: PopularStocksTableProps) => {
    const navigate = useNavigate();
    const displayItems = rankings.slice(0, 10);
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
        } catch {
            // error handled by interceptor
        } finally {
            setLoadingCode(null);
        }
    };

    return (
        <div className="popular-stocks">
            <div className="popular-stocks__header">
                <h2 className="popular-stocks__title">실시간 인기 종목</h2>
            </div>
            <div className="popular-stocks__table-wrapper">
                <table className="popular-stocks__table">
                    <thead>
                        <tr>
                            <th className="popular-stocks__th popular-stocks__th--rank">순위</th>
                            <th className="popular-stocks__th popular-stocks__th--name">종목명</th>
                            <th className="popular-stocks__th popular-stocks__th--price">현재가</th>
                            <th className="popular-stocks__th popular-stocks__th--volume">거래량</th>
                            <th className="popular-stocks__th popular-stocks__th--rate">등락률</th>
                            <th className="popular-stocks__th popular-stocks__th--fav"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayItems.map((item) => {
                            const isFav = watchlistCodes.has(item.stockCode);
                            return (
                                <tr
                                    key={item.stockCode}
                                    className="popular-stocks__row"
                                    onClick={() => navigate(`/investment/${item.stockCode}`)}
                                >
                                    <td className="popular-stocks__td popular-stocks__td--rank">{item.rank}</td>
                                    <td className="popular-stocks__td popular-stocks__td--name">{item.stockName}</td>
                                    <td className="popular-stocks__td popular-stocks__td--price">{formatPrice(item.currentPrice)}</td>
                                    <td className="popular-stocks__td popular-stocks__td--volume">{formatVolume(item.volume)}</td>
                                    <td className={`popular-stocks__td popular-stocks__td--rate ${item.changeRate >= 0 ? 'popular-stocks__td--up' : 'popular-stocks__td--down'}`}>
                                        {item.changeRate >= 0 ? '+' : ''}{item.changeRate.toFixed(2)}%
                                    </td>
                                    <td className="popular-stocks__td popular-stocks__td--fav">
                                        <button
                                            type="button"
                                            className={`popular-stocks__fav-btn ${isFav ? 'popular-stocks__fav-btn--active' : ''}`}
                                            onClick={(e) => handleToggleWatchlist(e, item.stockCode)}
                                            disabled={loadingCode === item.stockCode}
                                        >
                                            <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
