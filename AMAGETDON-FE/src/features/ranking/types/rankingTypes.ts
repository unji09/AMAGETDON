/**
 * 랭킹 관련 TypeScript 타입 정의
 */

// ============================================
// 공통 타입
// ============================================

/** 랭킹 타입 */
export type RankingType = 'learning' | 'profit';

// ============================================
// 학습 랭킹 타입
// ============================================

/** 학습 랭킹 항목 (목록 조회용) */
export interface LearningRankingItem {
    userId: number;
    rank: number;
    nickname: string;
    currentTitle: string | null;
    totalCorrect: number;        // 총 정답 수
    isCurrentUser: boolean;      // 현재 사용자 여부
    updatedAt: string;
}

/** 내 학습 랭킹 */
export interface MyLearningRanking {
    rankingId: number;
    userId: number;
    nickname: string;
    currentTitle: string | null;
    rank: number;
    totalCorrect: number;
    updatedAt: string;
}

/** 학습 랭킹 목록 API 응답 */
export interface LearningRankingListResponse {
    data: {
        rankings: LearningRankingItem[];
        updatedAt: string | null;
        totalElements: number;
        currentPage: number;
    };
}

/** 내 학습 랭킹 API 응답 */
export interface MyLearningRankingResponse {
    data: MyLearningRanking | null;
    success?: boolean;
    message?: string;
}

// ============================================
// 수익 랭킹 타입
// ============================================

/** 수익 랭킹 항목 (목록 조회용) */
export interface ProfitRankingItem {
    userId: number;
    rank: number;
    nickname: string;
    currentTitle: string | null;
    totalProfit: number;         // 총 수익
    isCurrentUser: boolean;      // 현재 사용자 여부
    updatedAt: string;
}

/** 내 수익 랭킹 */
export interface MyProfitRanking {
    rankingId: number;
    userId: number;
    nickname: string;
    currentTitle: string | null;
    rank: number;
    totalProfit: number;
    updatedAt: string;
}

/** 수익 랭킹 목록 API 응답 */
export interface ProfitRankingListResponse {
    data: {
        rankings: ProfitRankingItem[];
        updatedAt: string | null;
        totalElements: number;
        currentPage: number;
    };
}

/** 내 수익 랭킹 API 응답 */
export interface MyProfitRankingResponse {
    data: MyProfitRanking | null;
    success?: boolean;
    message?: string;
}

// ============================================
// 컴포넌트용 타입 (커뮤니티 페이지 랭킹 카드)
// ============================================

/** 랭킹 카드 아이템 (TOP 3 표시용) */
export interface RankingCardItem {
    rank: number;
    nickname: string;
    score: number;               // totalCorrect 또는 totalProfit
    isCurrentUser: boolean;
}

/** 내 랭킹 정보 (카드 하단 표시용) */
export interface MyRankingInfo {
    rank: number;
    nickname: string;
    score: number;
}

/** 랭킹 카드 데이터 (커뮤니티 페이지용) */
export interface RankingCardData {
    type: RankingType;
    title: string;               // "수익 랭킹" 또는 "학습 랭킹"
    topRankings: RankingCardItem[];  // TOP 3
    myRanking: MyRankingInfo | null;
    neighborRanking: RankingCardItem | null;  // 내 아래 순위 1명
    updatedAt: string | null;
}