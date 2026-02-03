import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { ContainerContent } from '@/components/layout';
import { Loading } from '@/components/common';
import { RefreshCw, ArrowLeft, Heart } from 'lucide-react';
import { Pagination } from '@/features/investment/components/common/Pagination';
import { getHoldings, getAllWatchlist, addToWatchlist, removeFromWatchlist } from '@/api/investmentApi';
import { formatWon, formatRate } from '@/features/investment/utils/format';
import type { StockHoldingResponse, WatchlistResponse } from '@/features/investment/types/investment';
import './HoldingsPage.css';

const PAGE_SIZE = 10;

export const HoldingsPage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<StockHoldingResponse | null>(null);
    const [watchlist, setWatchlist] = useState<WatchlistResponse | null>(null);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingCode, setLoadingCode] = useState<string | null>(null);

    const fetchData = useCallback(async (p: number) => {
        setLoading(true);
        const [holdingsRes, watchlistRes] = await Promise.allSettled([
            getHoldings(p, PAGE_SIZE),
            getAllWatchlist(),
        ]);
        if (holdingsRes.status === 'fulfilled') setData(holdingsRes.value);
        if (watchlistRes.status === 'fulfilled') setWatchlist(watchlistRes.value);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(page); }, [page, fetchData]);

    const handleRefresh = () => fetchData(page);

    const watchlistCodes = useMemo(() => {
        if (!watchlist?.items) return new Set<string>();
        return new Set(watchlist.items.map((s) => s.stockCode));
    }, [watchlist]);

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
            const res = await getAllWatchlist();
            setWatchlist(res);
        } catch { /* */ } finally {
            setLoadingCode(null);
        }
    };

    const totalPages = data ? Math.ceil(data.totalElements / PAGE_SIZE) : 0;

    return (
        <Layout>
            <ContainerContent>
                <div className="holdings-page__header">
                    <div className="holdings-page__title-row">
                        <button className="holdings-page__back-btn" onClick={() => navigate('/investment')}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="holdings-page__title">내 종목</h1>
                            <p className="holdings-page__subtitle">보유 중인 종목을 확인하세요</p>
                        </div>
                    </div>
                    <div className="holdings-page__actions">
                        <button className="holdings-page__icon-btn" onClick={handleRefresh} title="새로고침">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                <div className="holdings-page__content">
                    {loading ? (
                        <Loading />
                    ) : (
                        <>
                            <div className="holdings-page__table-wrapper">
                                <table className="holdings-page__table">
                                    <thead>
                                        <tr>
                                            <th>종목명</th>
                                            <th className="holdings-page__right">보유수량</th>
                                            <th className="holdings-page__right">평균단가</th>
                                            <th className="holdings-page__right">현재가</th>
                                            <th className="holdings-page__right">평가금액</th>
                                            <th className="holdings-page__right">손익금액</th>
                                            <th className="holdings-page__right">수익률</th>
                                            <th className="holdings-page__center"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(!data?.items || data.items.length === 0) ? (
                                            <tr>
                                                <td colSpan={8} className="holdings-page__empty">보유 종목이 없습니다.</td>
                                            </tr>
                                        ) : (
                                            data.items.map((item) => {
                                                const isFav = watchlistCodes.has(item.stockCode);
                                                return (
                                                    <tr
                                                        key={item.stockCode}
                                                        className="holdings-page__row"
                                                        onClick={() => navigate(`/investment/${item.stockCode}`)}
                                                    >
                                                        <td>
                                                            <div className="holdings-page__stock-name">{item.stockName}</div>
                                                            <div className="holdings-page__stock-code">{item.stockCode}</div>
                                                        </td>
                                                        <td className="holdings-page__right">{item.quantity.toLocaleString()}</td>
                                                        <td className="holdings-page__right">{formatWon(item.avgPrice)}</td>
                                                        <td className="holdings-page__right">{formatWon(item.currentPrice)}</td>
                                                        <td className="holdings-page__right">{formatWon(item.totalValue)}</td>
                                                        <td className={`holdings-page__right ${item.profitAmount >= 0 ? 'holdings-page__up' : 'holdings-page__down'}`}>
                                                            {item.profitAmount >= 0 ? '+' : ''}{formatWon(item.profitAmount)}
                                                        </td>
                                                        <td className={`holdings-page__right ${item.profitRate >= 0 ? 'holdings-page__up' : 'holdings-page__down'}`}>
                                                            {formatRate(item.profitRate)}
                                                        </td>
                                                        <td className="holdings-page__center">
                                                            <button
                                                                type="button"
                                                                className={`holdings-page__fav-btn ${isFav ? 'holdings-page__fav-btn--active' : ''}`}
                                                                onClick={(e) => handleToggleWatchlist(e, item.stockCode)}
                                                                disabled={loadingCode === item.stockCode}
                                                            >
                                                                <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                            />
                            {data && (
                                <div className="holdings-page__total">
                                    총 {data.totalElements.toLocaleString()}개 종목
                                </div>
                            )}
                        </>
                    )}
                </div>
            </ContainerContent>
        </Layout>
    );
};
