import apiClient from '@/api/client';
import type { AchievementResponse, AchievementFilter } from '@/features/achievement/types/achievement';

/** 유저 업적 목록 조회 */
export const getMyAchievements = async (filter: AchievementFilter = 'ALL'): Promise<AchievementResponse> => {
    const response = await apiClient.get<AchievementResponse>('/achievements/me', {
        params: { filter },
    });
    return response.data;
};

/** 현재 칭호 조회 */
export const getUserTitle = async (): Promise<string> => {
    const response = await apiClient.get<string>('/users/me/title');
    return response.data;
};

/** 칭호 변경 */
export const updateUserTitle = async (newTitle: string): Promise<string> => {
    const response = await apiClient.put<string>('/users/me/title', { newTitle });
    return response.data;
};

/** 성향 분석 결과 타입 */
export interface PersonalityAnalyzeResponse {
    success: boolean;
    can_analyze: boolean;
    achievement_count: number;
    initial_type: 'AGGRESSIVE' | 'NEUTRAL' | 'STABLE' | null;
    predicted_type: 'AGGRESSIVE' | 'NEUTRAL' | 'STABLE' | null;
    confidence: number | null;
    probabilities: {
        AGGRESSIVE: number;
        STABLE: number;
        NEUTRAL: number;
    } | null;
    message: string | null;
}

/** 업적 기반 성향 분석 (Spring Boot → FastAPI) */
export const analyzePersonality = async (): Promise<PersonalityAnalyzeResponse> => {
    const response = await apiClient.post<PersonalityAnalyzeResponse>('/personality/analyze');
    return response.data;
};

/** 투자 성향 업데이트 */
export const updateInvestmentType = async (investmentType: 'AGGRESSIVE' | 'NEUTRAL' | 'STABLE'): Promise<void> => {
    await apiClient.patch('/users/investmentType', { investmentType });
};
