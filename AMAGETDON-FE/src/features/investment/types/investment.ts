// 거래량 순위
export interface VolumeRankingItem {
    rank: number;
    stockCode: string;
    stockName: string;
    currentPrice: string;
    changeRate: number;
    volume: number;
}

// 자산
export interface AssetData {
    balance: number;
    stockAsset: number;
    totalAsset: number;
    totalProfitRate: number;
    totalProfitAmount: number;
}

// 보유 종목
export interface StockHoldingItem {
    stockCode: string;
    stockName: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    changeRate: number;
    totalValue: number;
    profitAmount: number;
    profitRate: number;
}

export interface StockHoldingResponse {
    page: number;
    size: number;
    totalElements: number;
    items: StockHoldingItem[];
}

// 관심 종목
export interface WatchlistStockItem {
    watchlistId: number;
    stockCode: string;
    stockName: string;
    marketType: string;
    currentPrice: number;
    changeRate: number;
    createdAt: string;
}

export interface WatchlistResponse {
    page: number;
    size: number;
    totalElements: number;
    items: WatchlistStockItem[];
}

// WatchlistItem 별칭 (편의를 위해)
export type WatchlistItem = WatchlistStockItem;

// 관심 종목 여부 확인 응답
export interface WatchlistCheckResponse {
    watchlistId: number;
}

// 단일 종목 보유 정보
export interface SingleHoldingData {
    stockCode: string;
    stockName: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    changeRate: number;
    totalValue: number;
    profitAmount: number;
    profitRate: number;
}

// 검색
export interface StockSearchItem {
    stockCode: string;
    stockName: string;
}

// 종목 상세
export interface StockDetailData {
    stockName: string;
    marketType: 'KOSPI' | 'KOSDAQ';
    sectorName: string;
    per: number;
    pbr: number;
    marketCap: number;
    currentPrice: string;
    changeRate: number;
    volume: number;
}

// 캔들 차트
export type ChartPeriod = '1D' | '1W' | '3M' | '1Y';

export interface CandleData {
    candleTime: string;
    openPrice: number;
    highPrice: number;
    lowPrice: number;
    closePrice: number;
    volume: number;
}

export interface CandleChartResponse {
    stockCode: string;
    period: string;
    interval: string;
    candles: CandleData[];
}

// 매매
export interface TradingResponse {
    transactionId: number;
    stockCode: string;
    stockName: string;
    transactionType: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    totalAmount: number;
    feeAmount: number;
    netAmount: number;
    remainingBalance: number;
    tradedAt: string;
}

// 거래 내역
export interface TransactionItem {
    transactionId: number;
    stockCode: string;
    stockName: string;
    transactionType: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    totalAmount: number;
    createdAt: string;
    feeAmount: number;
}

export interface TransactionResponse {
    page: number;
    size: number;
    totalElements: number;
    items: TransactionItem[];
}
