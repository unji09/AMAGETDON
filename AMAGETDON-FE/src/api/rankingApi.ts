/**
 * 랭킹 API 함수
 */

import apiClient from './client';
import type {
    LearningRankingListResponse,
    MyLearningRankingResponse,
    ProfitRankingListResponse,
    MyProfitRankingResponse,
    LearningRankingItem,
    ProfitRankingItem,
    MyLearningRanking,
    MyProfitRanking,
} from '@/features/ranking/types/rankingTypes';

// ============================================
// 학습 랭킹 API
// ============================================

/**
 * 학습 랭킹 목록 조회

 */
export const getLearningRankings = async (
    page: number = 0,
    size: number = 10
): Promise<{
    rankings: LearningRankingItem[];
    updatedAt: string | null;
    totalElements: number;
    currentPage: number;
}> => {
    const response = await apiClient.get<LearningRankingListResponse>(
        '/ranking/learningRanking/list',
        { params: { page, size } }
    );
    return response.data.data;
};

/**
 * 학습 랭킹 TOP N 조회 (커뮤니티 카드용)
 */
export const getTopLearningRankings = async (
    count: number = 3
): Promise<LearningRankingItem[]> => {
    const response = await apiClient.get<LearningRankingListResponse>(
        '/ranking/learningRanking/list',
        { params: { page: 0, size: count } }
    );
    return response.data.data.rankings;
};

/**
 * 내 학습 랭킹 조회
 */
export const getMyLearningRanking = async (): Promise<MyLearningRanking | null> => {
    const response = await apiClient.get<MyLearningRankingResponse>(
        '/ranking/learningRanking/myRank'
    );
    return response.data.data;
};

// ============================================
// 수익 랭킹 API
// ============================================

/**
 * 수익 랭킹 목록 조회
 */
export const getProfitRankings = async (
    page: number = 0,
    size: number = 10
): Promise<{
    rankings: ProfitRankingItem[];
    updatedAt: string | null;
    totalElements: number;
    currentPage: number;
}> => {
    const response = await apiClient.get<ProfitRankingListResponse>(
        '/ranking/profitRanking/list',
        { params: { page, size } }
    );
    return response.data.data;
};

/**
 * 수익 랭킹 TOP N 조회 (커뮤니티 카드용)
 */
export const getTopProfitRankings = async (
    count: number = 3
): Promise<ProfitRankingItem[]> => {
    const response = await apiClient.get<ProfitRankingListResponse>(
        '/ranking/profitRanking/list',
        { params: { page: 0, size: count } }
    );
    return response.data.data.rankings;
};

/**
 * 내 수익 랭킹 조회
 */
export const getMyProfitRanking = async (): Promise<MyProfitRanking | null> => {
    const response = await apiClient.get<MyProfitRankingResponse>(
        '/ranking/profitRanking/myRank'
    );
    return response.data.data;
};