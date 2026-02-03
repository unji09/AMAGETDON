import apiClient from '@/api/client';
import type {
    VolumeRankingItem,
    AssetData,
    StockHoldingResponse,
    WatchlistResponse,
    StockSearchItem,
    StockDetailData,
    CandleChartResponse,
    ChartPeriod,
    TradingResponse,
    TransactionResponse,
    SingleHoldingData,
} from '@/features/investment/types/investment';

export const getVolumeRankings = async (): Promise<VolumeRankingItem[]> => {
    const res = await apiClient.get<VolumeRankingItem[]>('/stocks/rankings/volume');
    return res.data;
};

export const getAssets = async (): Promise<AssetData> => {
    const res = await apiClient.get<AssetData>('/accounts/assets');
    return res.data;
};

export const getHoldings = async (page = 0, size = 5): Promise<StockHoldingResponse> => {
    const res = await apiClient.get<StockHoldingResponse>('/accounts/holdings', { params: { page, size } });
    return res.data;
};

export const getWatchlist = async (page = 0, size = 5): Promise<WatchlistResponse> => {
    const res = await apiClient.get<WatchlistResponse>('/watchlist', { params: { page, size } });
    return res.data;
};

export const searchStocks = async (keyword: string): Promise<StockSearchItem[]> => {
    const res = await apiClient.get<StockSearchItem[]>('/stocks/search', { params: { keyword } });
    return res.data;
};

export const addToWatchlist = async (stockCode: string): Promise<void> => {
    await apiClient.post('/watchlist', { stockCode });
};

export const removeFromWatchlist = async (stockCode: string): Promise<void> => {
    // 먼저 전체 관심 종목에서 해당 stockCode의 watchlistId를 찾아 삭제
    const res = await apiClient.get<WatchlistResponse>('/watchlist', { params: { page: 0, size: 100 } });
    const item = res.data.items?.find((s) => s.stockCode === stockCode);
    if (item) {
        await apiClient.delete(`/watchlist/${item.watchlistId}`);
    }
};

export const getAllWatchlist = async (): Promise<WatchlistResponse> => {
    const res = await apiClient.get<WatchlistResponse>('/watchlist', { params: { page: 0, size: 100 } });
    return res.data;
};

export const getSingleHolding = async (stockCode: string): Promise<SingleHoldingData | null> => {
    try {
        const res = await apiClient.get<SingleHoldingData>(`/accounts/holdings/${stockCode}`);
        return res.data;
    } catch {
        return null;
    }
};

export const getStockDetail = async (stockCode: string): Promise<StockDetailData> => {
    const res = await apiClient.get<StockDetailData>(`/stocks/${stockCode}`);
    return res.data;
};

export const getStockChart = async (stockCode: string, period: ChartPeriod): Promise<CandleChartResponse> => {
    const res = await apiClient.get<CandleChartResponse>(`/stocks/${stockCode}/chart/${period}`);
    return res.data;
};

export const buyStock = async (stockCode: string, quantity: number): Promise<TradingResponse> => {
    const res = await apiClient.post<TradingResponse>('/trading/buy', { stockCode, quantity });
    return res.data;
};

export const sellStock = async (stockCode: string, quantity: number): Promise<TradingResponse> => {
    const res = await apiClient.post<TradingResponse>('/trading/sell', { stockCode, quantity });
    return res.data;
};

export const getTransactions = async (page = 0, size = 10): Promise<TransactionResponse> => {
    const res = await apiClient.get<TransactionResponse>('/accounts/transactions', { params: { page, size } });
    return res.data;
};
