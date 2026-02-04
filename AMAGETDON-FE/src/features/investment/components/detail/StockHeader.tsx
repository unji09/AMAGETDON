import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { FlipText } from '@/components/common';
import type { StockDetailData } from '../../types/investment';
import { formatPrice, formatVolume } from '../../utils/format';
import { addToWatchlist, removeFromWatchlist } from '@/api/investmentApi';
import './StockHeader.css';

interface StockHeaderProps {
    stockCode: string;
    detail: StockDetailData;
    isFavorite: boolean;
    onWatchlistChange: () => void;
}

export const StockHeader = ({ stockCode, detail, isFavorite, onWatchlistChange }: StockHeaderProps) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const isUp = detail.changeRate >= 0;
    const changeAmount = Math.round(Number(detail.currentPrice) * Math.abs(detail.changeRate) / (100 + Math.abs(detail.changeRate)));

    const handleToggle = async () => {
        if (loading) return;
        setLoading(true);
        try {
            if (isFavorite) {
                await removeFromWatchlist(stockCode);
            } else {
                await addToWatchlist(stockCode);
            }
            onWatchlistChange();
        } catch { /* */ } finally {
            setLoading(false);
        }
    };

    return (
        <div className="stock-header">
            <div className="stock-header__top">
                <button className="stock-header__back-btn" onClick={() => navigate('/investment')}>
                    <ArrowLeft size={20} />
                </button>
                <button
                    type="button"
                    className={`stock-header__fav ${isFavorite ? 'stock-header__fav--active' : ''}`}
                    onClick={handleToggle}
                    disabled={loading}
                >
                    <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
                <span className={`stock-header__market-badge stock-header__market-badge--${detail.marketType.toLowerCase()}`}>
                    {detail.marketType}
                </span>
                <span className="stock-header__code">{stockCode}</span>
            </div>
            <h1 className="stock-header__name">{detail.stockName}</h1>
            <div className="stock-header__price-row">
                <span className="stock-header__price">
                    <FlipText
                        value={formatPrice(detail.currentPrice)}
                        className="stock-header__flip-price"
                    />
                </span>
                <span className={`stock-header__change ${isUp ? 'stock-header__change--up' : 'stock-header__change--down'}`}>
                    <FlipText
                        value={`${isUp ? '+' : '-'}${changeAmount.toLocaleString()} (${isUp ? '+' : ''}${detail.changeRate.toFixed(2)}%)`}
                        className="stock-header__flip-change"
                    />
                </span>
            </div>
            <div className="stock-header__meta">
                <span className="stock-header__meta-item">거래량 <strong>{formatVolume(detail.volume)}</strong></span>
                <span className="stock-header__meta-item">시가총액 <strong>{(detail.marketCap / 1_000_000_000_000).toFixed(1)}조</strong></span>
            </div>
        </div>
    );
};
