import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { ContainerContent } from '@/components/layout';
import { Loading } from '@/components/common';
import { RefreshCw, Heart, ArrowLeft } from 'lucide-react';
import { Pagination } from '@/features/investment/components/common/Pagination';
import { getWatchlist, removeFromWatchlist } from '@/api/investmentApi';
import { formatPrice } from '@/features/investment/utils/format';
import type { WatchlistResponse } from '@/features/investment/types/investment';
import './WatchlistPage.css';

const PAGE_SIZE = 10;

export const WatchlistPage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<WatchlistResponse | null>(null);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [removingCode, setRemovingCode] = useState<string | null>(null);

    const fetchData = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const res = await getWatchlist(p, PAGE_SIZE);
            setData(res);
        } catch { /* */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(page); }, [page, fetchData]);

    const handleRefresh = () => fetchData(page);

    const handleRemove = async (e: React.MouseEvent, stockCode: string) => {
        e.stopPropagation();
        if (removingCode) return;
        setRemovingCode(stockCode);
        try {
            await removeFromWatchlist(stockCode);
            fetchData(page);
        } catch { /* */ } finally {
            setRemovingCode(null);
        }
    };

    const totalPages = data ? Math.ceil(data.totalElements / PAGE_SIZE) : 0;

    return (
        <Layout>
            <ContainerContent>
                <div className="watchlist-page__header">
                    <div className="watchlist-page__title-row">
                        <button className="watchlist-page__back-btn" onClick={() => navigate('/investment')}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="watchlist-page__title">관심 종목</h1>
                            <p className="watchlist-page__subtitle">관심 등록한 종목을 확인하세요</p>
                        </div>
                    </div>
                    <div className="watchlist-page__actions">
                        <button className="watchlist-page__icon-btn" onClick={handleRefresh} title="새로고침">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                <div className="watchlist-page__content">
                    {loading ? (
                        <Loading />
                    ) : (
                        <>
                            <div className="watchlist-page__table-wrapper">
                                <table className="watchlist-page__table">
                                    <thead>
                                        <tr>
                                            <th>종목명</th>
                                            <th>시장</th>
                                            <th className="watchlist-page__right">현재가</th>
                                            <th className="watchlist-page__right">등락률</th>
                                            <th className="watchlist-page__center"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(!data?.items || data.items.length === 0) ? (
                                            <tr>
                                                <td colSpan={5} className="watchlist-page__empty">관심 종목이 없습니다.</td>
                                            </tr>
                                        ) : (
                                            data.items.map((item) => {
                                                const isUp = item.changeRate >= 0;
                                                return (
                                                    <tr
                                                        key={item.watchlistId}
                                                        className="watchlist-page__row"
                                                        onClick={() => navigate(`/investment/${item.stockCode}`)}
                                                    >
                                                        <td>
                                                            <div className="watchlist-page__stock-name">{item.stockName}</div>
                                                            <div className="watchlist-page__stock-code">{item.stockCode}</div>
                                                        </td>
                                                        <td>
                                                            <span className={`watchlist-page__badge ${item.marketType === 'KOSPI' ? 'watchlist-page__badge--kospi' : 'watchlist-page__badge--kosdaq'}`}>
                                                                {item.marketType}
                                                            </span>
                                                        </td>
                                                        <td className="watchlist-page__right">{formatPrice(item.currentPrice)}</td>
                                                        <td className={`watchlist-page__right ${isUp ? 'watchlist-page__up' : 'watchlist-page__down'}`}>
                                                            {isUp ? '+' : ''}{item.changeRate.toFixed(2)}%
                                                        </td>
                                                        <td className="watchlist-page__center">
                                                            <button
                                                                type="button"
                                                                className="watchlist-page__remove-btn"
                                                                onClick={(e) => handleRemove(e, item.stockCode)}
                                                                disabled={removingCode === item.stockCode}
                                                                title="관심 해제"
                                                            >
                                                                <Heart size={16} fill="currentColor" />
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
                                <div className="watchlist-page__total">
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
