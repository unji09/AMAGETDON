import { useState, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { FlipText } from '@/components/common';
import { useMarketStatus } from '@/hooks/useMarketStatus';
import type { VolumeRankingItem } from '../../types/investment';
import { formatPrice, formatVolume } from '../../utils/format';
import { addToWatchlist, removeFromWatchlist } from '@/api/investmentApi';
import './PopularStocksTable.css';

interface PopularStocksTableProps {
    rankings: VolumeRankingItem[];
    watchlistCodes: Set<string>;
    onWatchlistChange: () => void;
}

// 개별 행 컴포넌트 (메모이제이션으로 불필요한 리렌더 방지)
const StockRow = memo(({
    item,
    isFav,
    loadingCode,
    onToggleWatchlist,
    onNavigate,
}: {
    item: VolumeRankingItem;
    isFav: boolean;
    loadingCode: string | null;
    onToggleWatchlist: (e: React.MouseEvent, stockCode: string) => void;
    onNavigate: (stockCode: string) => void;
}) => {
    const isUp = item.changeRate >= 0;

    return (
        <tr
            className="popular-stocks__row"
            onClick={() => onNavigate(item.stockCode)}
        >
            <td className="popular-stocks__td popular-stocks__td--rank">{item.rank}</td>
            <td className="popular-stocks__td popular-stocks__td--name">{item.stockName}</td>
            <td className="popular-stocks__td popular-stocks__td--price">
                <FlipText value={formatPrice(item.currentPrice)} />
            </td>
            <td className="popular-stocks__td popular-stocks__td--volume">{formatVolume(item.volume)}</td>
            <td className={`popular-stocks__td popular-stocks__td--rate ${isUp ? 'popular-stocks__td--up' : 'popular-stocks__td--down'}`}>
                <FlipText value={`${isUp ? '+' : ''}${item.changeRate.toFixed(2)}%`} />
            </td>
            <td className="popular-stocks__td popular-stocks__td--fav">
                <button
                    type="button"
                    className={`popular-stocks__fav-btn ${isFav ? 'popular-stocks__fav-btn--active' : ''}`}
                    onClick={(e) => onToggleWatchlist(e, item.stockCode)}
                    disabled={loadingCode === item.stockCode}
                >
                    <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                </button>
            </td>
        </tr>
    );
});

StockRow.displayName = 'StockRow';

export const PopularStocksTable = ({ rankings, watchlistCodes, onWatchlistChange }: PopularStocksTableProps) => {
    const navigate = useNavigate();
    const { isOpen, statusText } = useMarketStatus();
    const displayItems = rankings.slice(0, 10);
    const [loadingCode, setLoadingCode] = useState<string | null>(null);

    // 이전 rankings를 저장하여 순위 변동 감지
    const prevRankingsRef = useRef<Map<string, number>>(new Map());

    useEffect(() => {
        const newMap = new Map<string, number>();
        rankings.forEach(item => newMap.set(item.stockCode, item.rank));
        prevRankingsRef.current = newMap;
    }, [rankings]);

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

    const handleNavigate = (stockCode: string) => {
        navigate(`/investment/${stockCode}`);
    };

    return (
        <div className="popular-stocks">
            <div className="popular-stocks__header">
                <h2 className="popular-stocks__title">실시간 인기 종목</h2>
                <span className={`popular-stocks__market-badge ${isOpen ? 'popular-stocks__market-badge--open' : 'popular-stocks__market-badge--closed'}`}>
                    <span className="popular-stocks__market-dot"></span>
                    {isOpen ? 'LIVE' : statusText}
                </span>
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
                        {displayItems.map((item) => (
                            <StockRow
                                key={item.stockCode}
                                item={item}
                                isFav={watchlistCodes.has(item.stockCode)}
                                loadingCode={loadingCode}
                                onToggleWatchlist={handleToggleWatchlist}
                                onNavigate={handleNavigate}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
