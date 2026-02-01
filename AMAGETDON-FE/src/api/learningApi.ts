import apiClient from '@/api/client';
import type { BaseChaptersResponse, SideChaptersResponse, ProgressResponse } from '../features/learning/types/learning';

export const getBaseChapters = async (): Promise<BaseChaptersResponse> => {
    const response = await apiClient.get<BaseChaptersResponse>('/chapters/base');
    return response.data;
};

export const getSideChapters = async (chapterType?: string): Promise<SideChaptersResponse> => {
    const params = chapterType ? { chapterType } : {};
    const response = await apiClient.get<SideChaptersResponse>('/chapters/side', { params });
    return response.data;
};

export const getProgress = async (): Promise<ProgressResponse> => {
    const response = await apiClient.get<ProgressResponse>('/progress');
    return response.data;
};
