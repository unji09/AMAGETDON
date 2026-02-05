import { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '@/components/layout';
import { ContainerContent } from '@/components/layout';
import { Loading } from '@/components/common';
import { InvestmentSearch } from '@/features/investment/components/common/InvestmentSearch';
import { PopularStocksTable } from '@/features/investment/components/dashboard/PopularStocksTable';
import { PortfolioCard } from '@/features/investment/components/dashboard/PortfolioCard';
import { MyHoldings } from '@/features/investment/components/dashboard/MyHoldings';
import { WatchlistSection } from '@/features/investment/components/dashboard/WatchlistSection';
import { RecentTransactions } from '@/features/investment/components/dashboard/RecentTransactions';
import { LearnModeProvider } from '@/features/investment/contexts/LearnModeContext';
import { LearnModeToggle, LearnSpotlight, LearnOverlay } from '@/features/investment/components/common/LearnMode';
import { usePolling } from '@/hooks/usePolling';
import { useMarketStatus } from '@/hooks/useMarketStatus';
import { getVolumeRankings, getAssets, getHoldings, getAllWatchlist, getTransactions } from '@/api/investmentApi';
import type { VolumeRankingItem, AssetData, StockHoldingResponse, WatchlistResponse, TransactionResponse } from '@/features/investment/types/investment';
import './InvestmentPage.css';

// 폴링 간격 상수
const RANKINGS_POLL_INTERVAL = 1500;    // 인기 종목: 1초
const HOLDINGS_POLL_INTERVAL = 7000;    // 내 종목/관심 종목: 7초

export const InvestmentPage = () => {
    const { isOpen } = useMarketStatus();
    const [rankings, setRankings] = useState<VolumeRankingItem[]>([]);
    const [assets, setAssets] = useState<AssetData | null>(null);
    const [holdings, setHoldings] = useState<StockHoldingResponse | null>(null);
    const [watchlist, setWatchlist] = useState<WatchlistResponse | null>(null);
    const [transactions, setTransactions] = useState<TransactionResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // 실시간 인기 종목 조회 (1초마다)
    const fetchRankings = useCallback(async () => {
        try {
            const res = await getVolumeRankings();
            setRankings(res);
        } catch { /* */ }
    }, []);

    // 내 종목, 관심 종목 조회 (7초마다)
    const fetchHoldingsAndWatchlist = useCallback(async () => {
        try {
            const [assetsRes, holdingsRes, watchlistRes] = await Promise.allSettled([
                getAssets(),
                getHoldings(0, 4),
                getAllWatchlist(),
            ]);
            if (assetsRes.status === 'fulfilled') setAssets(assetsRes.value);
            if (holdingsRes.status === 'fulfilled') setHoldings(holdingsRes.value);
            if (watchlistRes.status === 'fulfilled') setWatchlist(watchlistRes.value);
        } catch { /* */ }
    }, []);

    const fetchWatchlist = useCallback(async () => {
        try {
            const res = await getAllWatchlist();
            setWatchlist(res);
        } catch { /* */ }
    }, []);

    // 초기 데이터 로드
    useEffect(() => {
        const fetchData = async () => {
            const [rankingsRes, assetsRes, holdingsRes, watchlistRes, transactionsRes] = await Promise.allSettled([
                getVolumeRankings(),
                getAssets(),
                getHoldings(0, 4),
                getAllWatchlist(),
                getTransactions(0, 4),
            ]);
            if (rankingsRes.status === 'fulfilled') setRankings(rankingsRes.value);
            else console.error('rankings failed:', rankingsRes.reason);
            if (assetsRes.status === 'fulfilled') setAssets(assetsRes.value);
            else console.error('assets failed:', assetsRes.reason);
            if (holdingsRes.status === 'fulfilled') setHoldings(holdingsRes.value);
            else console.error('holdings failed:', holdingsRes.reason);
            if (watchlistRes.status === 'fulfilled') setWatchlist(watchlistRes.value);
            else console.error('watchlist failed:', watchlistRes.reason);
            if (transactionsRes.status === 'fulfilled') setTransactions(transactionsRes.value);
            else console.error('transactions failed:', transactionsRes.reason);
            setLoading(false);
        };
        fetchData();
    }, []);

    // 폴링 설정 (장 운영 중일 때만)
    usePolling(fetchRankings, {
        interval: RANKINGS_POLL_INTERVAL,
        enabled: !loading && isOpen,
    });

    usePolling(fetchHoldingsAndWatchlist, {
        interval: HOLDINGS_POLL_INTERVAL,
        enabled: !loading && isOpen,
    });

    // 관심 종목 stockCode Set (하트 표시용)
    const watchlistCodes = useMemo(() => {
        if (!watchlist?.items) return new Set<string>();
        return new Set(watchlist.items.map((s) => s.stockCode));
    }, [watchlist]);

    if (loading) {
        return (
            <Layout>
                <Loading fullScreen />
            </Layout>
        );
    }

    return (
        <LearnModeProvider>
            <Layout>
                <ContainerContent>
                    <div className="investment-page__header">
                        <InvestmentSearch />
                        <LearnModeToggle />
                    </div>
                    <LearnOverlay />
                    <div className="investment-page__grid">
                        <div className="investment-page__left">
                            <LearnSpotlight id="popular-stocks">
                                <PopularStocksTable
                                    rankings={rankings}
                                    watchlistCodes={watchlistCodes}
                                    onWatchlistChange={fetchWatchlist}
                                />
                            </LearnSpotlight>
                            <LearnSpotlight id="recent-transactions">
                                <RecentTransactions
                                    transactions={transactions?.items ?? []}
                                />
                            </LearnSpotlight>
                        </div>
                        <div className="investment-page__right">
                            <LearnSpotlight id="portfolio-card">
                                <PortfolioCard assets={assets} />
                            </LearnSpotlight>
                            <LearnSpotlight id="my-holdings">
                                <MyHoldings
                                    holdings={holdings?.items ?? []}
                                    watchlistCodes={watchlistCodes}
                                    onWatchlistChange={fetchWatchlist}
                                />
                            </LearnSpotlight>
                            <LearnSpotlight id="watchlist">
                                <WatchlistSection
                                    stocks={watchlist?.items?.slice(0, 4) ?? []}
                                    onWatchlistChange={fetchWatchlist}
                                />
                            </LearnSpotlight>
                        </div>
                    </div>
                </ContainerContent>
            </Layout>
        </LearnModeProvider>
    );
};
