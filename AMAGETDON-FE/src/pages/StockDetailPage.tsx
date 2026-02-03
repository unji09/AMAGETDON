import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { ContainerContent } from '@/components/layout';
import { Loading } from '@/components/common';
import { StockHeader } from '@/features/investment/components/detail/StockHeader';
import { CandleChart } from '@/features/investment/components/detail/CandleChart';
import { TradingPanel } from '@/features/investment/components/detail/TradingPanel';
import { getStockDetail, getStockChart, getAssets, getAllWatchlist, getSingleHolding } from '@/api/investmentApi';
import type { StockDetailData, CandleChartResponse, AssetData, WatchlistResponse, ChartPeriod, SingleHoldingData } from '@/features/investment/types/investment';
import './StockDetailPage.css';

export const StockDetailPage = () => {
    const { stockCode } = useParams<{ stockCode: string }>();
    const [detail, setDetail] = useState<StockDetailData | null>(null);
    const [chart, setChart] = useState<CandleChartResponse | null>(null);
    const [assets, setAssets] = useState<AssetData | null>(null);
    const [watchlist, setWatchlist] = useState<WatchlistResponse | null>(null);
    const [holding, setHolding] = useState<SingleHoldingData | null>(null);
    const [period, setPeriod] = useState<ChartPeriod>('1D');
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        if (!stockCode) return;
        const [detailRes, chartRes, assetsRes, watchlistRes, holdingRes] = await Promise.allSettled([
            getStockDetail(stockCode),
            getStockChart(stockCode, period),
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
    }, [stockCode, period]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

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
        <Layout>
            <ContainerContent>
                <StockHeader
                    stockCode={stockCode}
                    detail={detail}
                    isFavorite={isFavorite}
                    onWatchlistChange={fetchWatchlist}
                />
                <div className="stock-detail__grid">
                    <div className="stock-detail__left">
                        <CandleChart
                            candles={chart?.candles ?? []}
                            period={period}
                            onPeriodChange={handlePeriodChange}
                        />
                    </div>
                    <div className="stock-detail__right">
                        <TradingPanel
                            stockCode={stockCode}
                            currentPrice={Number(detail.currentPrice)}
                            balance={assets?.balance ?? 0}
                            holding={holding}
                            onTradeComplete={refreshAfterTrade}
                        />
                    </div>
                </div>
            </ContainerContent>
        </Layout>
    );
};
