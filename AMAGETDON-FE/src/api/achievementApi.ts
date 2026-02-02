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
