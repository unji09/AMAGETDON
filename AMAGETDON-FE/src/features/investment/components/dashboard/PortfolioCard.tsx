import { TrendingUp, TrendingDown, Wallet, BarChart3 } from 'lucide-react';
import type { AssetData } from '../../types/investment';
import { formatWon, formatRate } from '../../utils/format';
import './PortfolioCard.css';

interface PortfolioCardProps {
    assets: AssetData | null;
}

export const PortfolioCard = ({ assets }: PortfolioCardProps) => {
    const safeAssets = assets ?? { totalAsset: 0, totalProfitRate: 0, totalProfitAmount: 0, balance: 0, stockAsset: 0 };
    const isProfit = safeAssets.totalProfitAmount >= 0;

    return (
        <div className="portfolio-card">
            <div className="portfolio-card__glow" />
            <div className="portfolio-card__content">
                <div className="portfolio-card__header">
                    <span className="portfolio-card__label">총 자산</span>
                    <span className={`portfolio-card__badge ${isProfit ? 'portfolio-card__badge--up' : 'portfolio-card__badge--down'}`}>
                        {isProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {formatRate(safeAssets.totalProfitRate)}
                    </span>
                </div>
                <strong className="portfolio-card__total">{formatWon(safeAssets.totalAsset)}</strong>
                <span className={`portfolio-card__profit ${isProfit ? 'portfolio-card__profit--up' : 'portfolio-card__profit--down'}`}>
                    {isProfit ? '+' : ''}{formatWon(safeAssets.totalProfitAmount)} 수익
                </span>

                <div className="portfolio-card__breakdown">
                    <div className="portfolio-card__breakdown-item">
                        <div className="portfolio-card__breakdown-icon">
                            <Wallet size={16} />
                        </div>
                        <div className="portfolio-card__breakdown-info">
                            <span className="portfolio-card__breakdown-label">예수금</span>
                            <strong className="portfolio-card__breakdown-value">{formatWon(safeAssets.balance)}</strong>
                        </div>
                    </div>
                    <div className="portfolio-card__breakdown-divider" />
                    <div className="portfolio-card__breakdown-item">
                        <div className="portfolio-card__breakdown-icon">
                            <BarChart3 size={16} />
                        </div>
                        <div className="portfolio-card__breakdown-info">
                            <span className="portfolio-card__breakdown-label">주식</span>
                            <strong className="portfolio-card__breakdown-value">{formatWon(safeAssets.stockAsset)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
