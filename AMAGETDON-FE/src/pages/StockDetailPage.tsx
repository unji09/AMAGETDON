import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { ContainerContent } from '@/components/layout';
import { StockHeader } from '@/features/investment/components/detail/StockHeader';
import { CandleChart } from '@/features/investment/components/detail/CandleChart';
import { TradingPanel } from '@/features/investment/components/detail/TradingPanel';
import { LearnModeProvider } from '@/features/investment/contexts/LearnModeContext';
import { LearnModeToggle, LearnSpotlight, LearnOverlay } from '@/features/investment/components/common/LearnMode';
import { usePolling } from '@/hooks/usePolling';
import { useMarketStatus } from '@/hooks/useMarketStatus';
import { getStockDetail, getStockChart, getAssets, checkWatchlist, getSingleHolding } from '@/api/investmentApi';
import type { StockDetailData, CandleChartResponse, AssetData, ChartPeriod, SingleHoldingData } from '@/features/investment/types/investment';
import { StockDetailSkeleton } from './StockDetailSkeleton';
import './StockDetailPage.css';

// 폴링 간격 상수
const DETAIL_POLL_INTERVAL = 7000;      // 현재가: 7초
const CHART_1D_POLL_INTERVAL = 60000;  // 1일 차트: 1분
const INITIAL_LOADING_DURATION = 1500;  // 초기 로딩 고정 시간: 1.5초

export const StockDetailPage = () => {
    const { stockCode } = useParams<{ stockCode: string }>();
    const { isOpen, statusText } = useMarketStatus();
    const [detail, setDetail] = useState<StockDetailData | null>(null);
    const [chart, setChart] = useState<CandleChartResponse | null>(null);
    const [assets, setAssets] = useState<AssetData | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [holding, setHolding] = useState<SingleHoldingData | null>(null);
    const [period, setPeriod] = useState<ChartPeriod>('1D');
    const [loading, setLoading] = useState(true);

    // 데이터 fetch 함수
    const fetchData = useCallback(async () => {
        if (!stockCode) return;
        const [detailRes, chartRes, assetsRes, watchlistRes, holdingRes] = await Promise.allSettled([
            getStockDetail(stockCode),
            getStockChart(stockCode, '1D'),
            getAssets(),
            checkWatchlist(stockCode),
            getSingleHolding(stockCode),
        ]);
        if (detailRes.status === 'fulfilled') setDetail(detailRes.value);
        if (chartRes.status === 'fulfilled') setChart(chartRes.value);
        if (assetsRes.status === 'fulfilled') setAssets(assetsRes.value);
        if (watchlistRes.status === 'fulfilled') setIsFavorite(watchlistRes.value !== null);
        if (holdingRes.status === 'fulfilled') setHolding(holdingRes.value);
    }, [stockCode]);

    // 초기 로딩 전략: API 호출 → 2초 대기 → API 재호출 → 렌더링
    useEffect(() => {
        if (!stockCode) return;

        let cancelled = false;
        const loadWithDelay = async () => {
            setLoading(true);

            // 1차 API 호출 (데이터 수집 트리거)
            await fetchData();

            // 1.5초(INITIAL_LOADING_DURATION) 고정 대기
            await new Promise(resolve => setTimeout(resolve, INITIAL_LOADING_DURATION));

            if (cancelled) return;

            // 2차 API 호출 (갱신된 데이터 수신)
            await fetchData();

            if (cancelled) return;
            setLoading(false);
        };

        loadWithDelay();

        return () => { cancelled = true; };
    }, [stockCode, fetchData]);

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

    // 1일 차트 폴링 (1분) - 1D period일 때만
    const fetch1DChartSilent = useCallback(async () => {
        if (!stockCode || period !== '1D') return;
        try {
            const chartRes = await getStockChart(stockCode, '1D');
            setChart(chartRes);
        } catch { /* */ }
    }, [stockCode, period]);

    usePolling(fetchDetailSilent, {
        interval: DETAIL_POLL_INTERVAL,
        enabled: !loading && isOpen,
    });

    usePolling(fetch1DChartSilent, {
        interval: CHART_1D_POLL_INTERVAL,
        enabled: !loading && isOpen && period === '1D',
    });

    const handlePeriodChange = async (newPeriod: ChartPeriod) => {
        setPeriod(newPeriod);
        if (!stockCode) return;
        try {
            const chartRes = await getStockChart(stockCode, newPeriod);
            setChart(chartRes);
        } catch { /* */ }
    };

    // 차트 수동 새로고침
    const handleChartRefresh = useCallback(async () => {
        if (!stockCode) return;
        try {
            const chartRes = await getStockChart(stockCode, period);
            setChart(chartRes);
        } catch { /* */ }
    }, [stockCode, period]);

    const toggleFavorite = useCallback(() => {
        setIsFavorite((prev) => !prev);
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

    // 컨텐츠 렌더링
    const renderContent = () => {
        // 스켈레톤 로딩 UI
        if (loading || !stockCode) {
            return <StockDetailSkeleton />;
        }

        // 에러 상태
        if (!detail) {
            return (
                <div className="stock-detail__error">
                    종목 정보를 불러올 수 없습니다.
                </div>
            );
        }

        // 메인 컨텐츠
        return (
            <LearnModeProvider>
                <div className="stock-detail__header">
                    <LearnSpotlight id="market-status">
                        <div className={`stock-detail__market-status ${isOpen ? 'stock-detail__market-status--open' : 'stock-detail__market-status--closed'}`}>
                            <span className="stock-detail__market-dot"></span>
                            {statusText}
                        </div>
                    </LearnSpotlight>
                    <LearnModeToggle />
                </div>
                <LearnOverlay />
                <StockHeader
                    stockCode={stockCode}
                    detail={detail}
                    isFavorite={isFavorite}
                    onWatchlistChange={toggleFavorite}
                />
                <div className="stock-detail__grid">
                    <div className="stock-detail__left">
                        <LearnSpotlight id="candle-chart">
                            <CandleChart
                                candles={chart?.candles ?? []}
                                period={period}
                                onPeriodChange={handlePeriodChange}
                                onRefresh={handleChartRefresh}
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
            </LearnModeProvider>
        );
    };

    return (
        <Layout>
            <ContainerContent>
                {renderContent()}
            </ContainerContent>
        </Layout>
    );
};
