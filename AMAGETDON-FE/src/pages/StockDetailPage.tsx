import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { ContainerContent } from '@/components/layout';
import { Loading } from '@/components/common';
import { StockHeader } from '@/features/investment/components/detail/StockHeader';
import { CandleChart } from '@/features/investment/components/detail/CandleChart';
import { TradingPanel } from '@/features/investment/components/detail/TradingPanel';
import { LearnModeProvider } from '@/features/investment/contexts/LearnModeContext';
import { LearnModeToggle, LearnSpotlight, LearnOverlay } from '@/features/investment/components/common/LearnMode';
import { usePolling } from '@/hooks/usePolling';
import { getStockDetail, getStockChart, getAssets, getAllWatchlist, getSingleHolding } from '@/api/investmentApi';
import type { StockDetailData, CandleChartResponse, AssetData, WatchlistResponse, ChartPeriod, SingleHoldingData } from '@/features/investment/types/investment';
import './StockDetailPage.css';

// 폴링 간격 상수
const DETAIL_POLL_INTERVAL = 7000;      // 현재가: 7초
const CHART_1D_POLL_INTERVAL = 360000;  // 1일 차트: 6분

export const StockDetailPage = () => {
    const { stockCode } = useParams<{ stockCode: string }>();
    const [detail, setDetail] = useState<StockDetailData | null>(null);
    const [chart, setChart] = useState<CandleChartResponse | null>(null);
    const [assets, setAssets] = useState<AssetData | null>(null);
    const [watchlist, setWatchlist] = useState<WatchlistResponse | null>(null);
    const [holding, setHolding] = useState<SingleHoldingData | null>(null);
    const [period, setPeriod] = useState<ChartPeriod>('1D');
    const [loading, setLoading] = useState(true);

    // 초기 로딩 (stockCode 변경 시에만)
    const fetchInitial = useCallback(async () => {
        if (!stockCode) return;
        setLoading(true);
        const [detailRes, chartRes, assetsRes, watchlistRes, holdingRes] = await Promise.allSettled([
            getStockDetail(stockCode),
            getStockChart(stockCode, '1D'), // 초기에는 1D 차트
            getAssets(),
            getAllWatchlist(),
            getSingleHolding(stockCode),
        ]);
        if (detailRes.status === 'fulfilled') setDetail(detailRes.value);
        if (chartRes.status === 'fulfilled') setChart(chartRes.value);
        if (assetsRes.status === 'fulfilled') setAssets(assetsRes.value);
        if (watchlistRes.status === 'fulfilled') setWatchlist(watchlistRes.value);
        if (holdingRes.status === 'fulfilled') setHolding(holdingRes.value);
        setLoading(false);
    }, [stockCode]);

    useEffect(() => { fetchInitial(); }, [fetchInitial]);

    // 현재가/자산 정보 폴링 (7초)
    const fetchDetailSilent = useCallback(async () => {
        if (!stockCode) return;
        try {
            const [detailRes, assetsRes, holdingRes] = await Promise.allSettled([
                getStockDetail(stockCode),
                getAssets(),
                getSingleHolding(stockCode),
            ]);
            if (detailRes.status === 'fulfilled') setDetail(detailRes.value);
            if (assetsRes.status === 'fulfilled') setAssets(assetsRes.value);
            if (holdingRes.status === 'fulfilled') setHolding(holdingRes.value);
        } catch { /* */ }
    }, [stockCode]);

    // 1일 차트 폴링 (6분) - 1D period일 때만
    const fetch1DChartSilent = useCallback(async () => {
        if (!stockCode || period !== '1D') return;
        try {
            const chartRes = await getStockChart(stockCode, '1D');
            setChart(chartRes);
        } catch { /* */ }
    }, [stockCode, period]);

    usePolling(fetchDetailSilent, {
        interval: DETAIL_POLL_INTERVAL,
        enabled: !loading,
    });

    usePolling(fetch1DChartSilent, {
        interval: CHART_1D_POLL_INTERVAL,
        enabled: !loading && period === '1D',
    });

    const handlePeriodChange = async (newPeriod: ChartPeriod) => {
        setPeriod(newPeriod);
        if (!stockCode) return;
        try {
            const chartRes = await getStockChart(stockCode, newPeriod);
            setChart(chartRes);
        } catch { /* */ }
    };

    const fetchWatchlist = useCallback(async () => {
        try {
            const res = await getAllWatchlist();
            setWatchlist(res);
        } catch { /* */ }
    }, []);

    const refreshAfterTrade = useCallback(async () => {
        if (!stockCode) return;
        try {
            const [detailRes, assetsRes, holdingRes] = await Promise.all([
                getStockDetail(stockCode),
                getAssets(),
                getSingleHolding(stockCode),
            ]);
            setDetail(detailRes);
            setAssets(assetsRes);
            setHolding(holdingRes);
        } catch { /* */ }
    }, [stockCode]);

    const isFavorite = useMemo(() => {
        if (!watchlist?.items || !stockCode) return false;
        return watchlist.items.some((s) => s.stockCode === stockCode);
    }, [watchlist, stockCode]);

    if (loading || !detail || !stockCode) {
        return <Layout><Loading fullScreen /></Layout>;
    }

    return (
        <LearnModeProvider>
            <Layout>
                <ContainerContent>
                    <div className="stock-detail__header">
                        <div className="stock-detail__poll-indicator">
                            <span className="stock-detail__poll-dot"></span>
                            실시간 갱신
                        </div>
                        <LearnModeToggle />
                    </div>
                    <LearnOverlay />
                    <LearnSpotlight id="stock-header">
                        <StockHeader
                            stockCode={stockCode}
                            detail={detail}
                            isFavorite={isFavorite}
                            onWatchlistChange={fetchWatchlist}
                        />
                    </LearnSpotlight>
                    <div className="stock-detail__grid">
                        <div className="stock-detail__left">
                            <LearnSpotlight id="candle-chart">
                                <CandleChart
                                    candles={chart?.candles ?? []}
                                    period={period}
                                    onPeriodChange={handlePeriodChange}
                                />
                            </LearnSpotlight>
                        </div>
                        <div className="stock-detail__right">
                            <LearnSpotlight id="trading-panel">
                                <TradingPanel
                                    stockCode={stockCode}
                                    currentPrice={Number(detail.currentPrice)}
                                    balance={assets?.balance ?? 0}
                                    holding={holding}
                                    onTradeComplete={refreshAfterTrade}
                                />
                            </LearnSpotlight>
                        </div>
                    </div>
                </ContainerContent>
            </Layout>
        </LearnModeProvider>
    );
};
