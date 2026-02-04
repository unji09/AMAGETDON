import { useState } from 'react';
import { FlipText } from '@/components/common';
import { buyStock, sellStock } from '@/api/investmentApi';
import { formatWon, formatRate } from '../../utils/format';
import type { SingleHoldingData } from '../../types/investment';
import './TradingPanel.css';

interface TradingPanelProps {
    stockCode: string;
    currentPrice: number;
    balance: number;
    holding: SingleHoldingData | null;
    onTradeComplete: () => void;
}

type TradeMode = 'buy' | 'sell';

const BUY_RATIO_BUTTONS = [
    { label: '10%', value: 0.1 },
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.5 },
    { label: '최대', value: 1 },
];

const SELL_RATIO_BUTTONS = [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '전량', value: 1 },
];

export const TradingPanel = ({ stockCode, currentPrice, balance, holding, onTradeComplete }: TradingPanelProps) => {
    const [mode, setMode] = useState<TradeMode>('buy');
    const [quantity, setQuantity] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const qty = typeof quantity === 'number' ? quantity : 0;
    const totalAmount = currentPrice * qty;
    const holdingQty = holding?.quantity ?? 0;

    const handleModeChange = (newMode: TradeMode) => {
        setMode(newMode);
        setQuantity('');
        setMessage(null);
    };

    const handleBuyRatio = (ratio: number) => {
        if (currentPrice <= 0) return;
        const maxQty = Math.floor((balance * ratio) / currentPrice);
        setQuantity(maxQty);
    };

    const handleSellRatio = (ratio: number) => {
        if (holdingQty <= 0) return;
        const qty = Math.floor(holdingQty * ratio);
        setQuantity(qty);
    };

    const handleTrade = async () => {
        if (qty <= 0 || loading) return;
        if (mode === 'sell' && qty > holdingQty) {
            setMessage({ type: 'error', text: '보유 수량을 초과했습니다.' });
            return;
        }
        if (mode === 'buy' && totalAmount > balance) {
            setMessage({ type: 'error', text: '잔액이 부족합니다.' });
            return;
        }

        setLoading(true);
        setMessage(null);
        try {
            if (mode === 'buy') {
                await buyStock(stockCode, qty);
                setMessage({ type: 'success', text: `${qty}주 매수 완료` });
            } else {
                await sellStock(stockCode, qty);
                setMessage({ type: 'success', text: `${qty}주 매도 완료` });
            }
            setQuantity('');
            onTradeComplete();
        } catch {
            setMessage({ type: 'error', text: '주문에 실패했습니다.' });
        } finally {
            setLoading(false);
        }
    };

    const isBuyDisabled = mode === 'buy' && (qty <= 0 || loading || totalAmount > balance);
    const isSellDisabled = mode === 'sell' && (qty <= 0 || loading || qty > holdingQty);

    return (
        <div className="trading-panel">
            <div className="trading-panel__tabs">
                <button
                    type="button"
                    className={`trading-panel__tab trading-panel__tab--buy ${mode === 'buy' ? 'trading-panel__tab--active' : ''}`}
                    onClick={() => handleModeChange('buy')}
                >
                    매수
                </button>
                <button
                    type="button"
                    className={`trading-panel__tab trading-panel__tab--sell ${mode === 'sell' ? 'trading-panel__tab--active' : ''}`}
                    onClick={() => handleModeChange('sell')}
                >
                    매도
                </button>
            </div>

            {holding && holdingQty > 0 && (
                <div className="trading-panel__holding">
                    <div className="trading-panel__holding-row">
                        <span>보유수량</span>
                        <strong>{holdingQty.toLocaleString()}주</strong>
                    </div>
                    <div className="trading-panel__holding-row">
                        <span>평균단가</span>
                        <span>{formatWon(holding.avgPrice)}</span>
                    </div>
                    <div className="trading-panel__holding-row">
                        <span>평가손익</span>
                        <span className={holding.profitAmount >= 0 ? 'trading-panel__profit--up' : 'trading-panel__profit--down'}>
                            {holding.profitAmount >= 0 ? '+' : ''}{formatWon(holding.profitAmount)} ({formatRate(holding.profitRate)})
                        </span>
                    </div>
                </div>
            )}

            <div className="trading-panel__field">
                <label className="trading-panel__label">주문단가 (KRW)</label>
                <div className="trading-panel__price-display">
                    <FlipText
                        value={formatWon(currentPrice)}
                        className="trading-panel__flip-price"
                    />
                </div>
            </div>

            <div className="trading-panel__field">
                <label className="trading-panel__label">주문수량 (주)</label>
                <input
                    type="number"
                    className="trading-panel__input"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    min={0}
                    placeholder="0"
                />
                <div className="trading-panel__ratios">
                    {mode === 'buy' ? (
                        BUY_RATIO_BUTTONS.map((r) => (
                            <button
                                key={r.label}
                                type="button"
                                className="trading-panel__ratio-btn"
                                onClick={() => handleBuyRatio(r.value)}
                            >
                                {r.label}
                            </button>
                        ))
                    ) : (
                        SELL_RATIO_BUTTONS.map((r) => (
                            <button
                                key={r.label}
                                type="button"
                                className="trading-panel__ratio-btn"
                                onClick={() => handleSellRatio(r.value)}
                                disabled={holdingQty <= 0}
                            >
                                {r.label}
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="trading-panel__summary">
                <div className="trading-panel__summary-row">
                    <span>주문총액</span>
                    <strong>{formatWon(totalAmount)}</strong>
                </div>
                {mode === 'buy' ? (
                    <div className="trading-panel__summary-row">
                        <span>주문가능 금액</span>
                        <span>{formatWon(balance)}</span>
                    </div>
                ) : (
                    <div className="trading-panel__summary-row">
                        <span>매도가능 수량</span>
                        <span>{holdingQty.toLocaleString()}주</span>
                    </div>
                )}
            </div>

            {message && (
                <div className={`trading-panel__message trading-panel__message--${message.type}`}>
                    {message.text}
                </div>
            )}

            <button
                type="button"
                className={`trading-panel__btn ${mode === 'buy' ? 'trading-panel__btn--buy' : 'trading-panel__btn--sell'}`}
                onClick={handleTrade}
                disabled={mode === 'buy' ? isBuyDisabled : isSellDisabled}
            >
                {mode === 'buy' ? '매수하기' : '매도하기'}
            </button>
        </div>
    );
};
