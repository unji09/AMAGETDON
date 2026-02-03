import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout';
import { ContainerContent } from '@/components/layout';
import { Loading } from '@/components/common';
import { RefreshCw, Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TransactionTable } from '@/features/investment/components/common/TransactionTable';
import { Pagination } from '@/features/investment/components/common/Pagination';
import { getTransactions } from '@/api/investmentApi';
import type { TransactionResponse } from '@/features/investment/types/investment';
import './TransactionPage.css';

const PAGE_SIZE = 10;

export const TransactionPage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<TransactionResponse | null>(null);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const res = await getTransactions(p, PAGE_SIZE);
            setData(res);
        } catch { /* */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(page); }, [page, fetchData]);

    const handleRefresh = () => fetchData(page);

    const handleExcelDownload = async () => {
        try {
            // 전체 데이터 조회
            const all = await getTransactions(0, 10000);
            const header = '일자,종목명,종목코드,구분,수량,단가,거래대금,수수료\n';
            const rows = all.items.map((tx) =>
                [
                    tx.createdAt,
                    tx.stockName,
                    tx.stockCode,
                    tx.transactionType === 'BUY' ? '매수' : '매도',
                    tx.quantity,
                    tx.price,
                    tx.totalAmount,
                    tx.feeAmount,
                ].join(',')
            ).join('\n');

            const bom = '\uFEFF';
            const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `거래내역_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch { /* */ }
    };

    const totalPages = data ? Math.ceil(data.totalElements / PAGE_SIZE) : 0;

    return (
        <Layout>
            <ContainerContent>
                <div className="transaction-page__header">
                    <div className="transaction-page__title-row">
                        <button className="transaction-page__back-btn" onClick={() => navigate('/investment')}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="transaction-page__title">거래 내역</h1>
                            <p className="transaction-page__subtitle">모의 투자 거래 내역을 확인하세요</p>
                        </div>
                    </div>
                    <div className="transaction-page__actions">
                        <button className="transaction-page__icon-btn" onClick={handleRefresh} title="새로고침">
                            <RefreshCw size={18} />
                        </button>
                        <button className="transaction-page__icon-btn" onClick={handleExcelDownload} title="엑셀 다운로드">
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                <div className="transaction-page__content">
                    {loading ? (
                        <Loading />
                    ) : (
                        <>
                            <TransactionTable items={data?.items ?? []} />
                            <Pagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                            />
                            {data && (
                                <div className="transaction-page__total">
                                    총 {data.totalElements.toLocaleString()}건
                                </div>
                            )}
                        </>
                    )}
                </div>
            </ContainerContent>
        </Layout>
    );
};
