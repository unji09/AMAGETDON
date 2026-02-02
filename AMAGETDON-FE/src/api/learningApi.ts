import apiClient from '@/api/client';
import type {
    BaseChaptersResponse,
    SideChaptersResponse,
    ProgressResponse,
    ChapterDetailResponse,
} from '@/features/learning/types/learning';

/** 기본(NORMAL) 챕터 목록 조회 */
export const getBaseChapters = async (): Promise<BaseChaptersResponse> => {
    const response = await apiClient.get<BaseChaptersResponse>('/chapters/base');
    return response.data;
};

/** 사이드 챕터 목록 조회 (성향 타입 지정 가능) */
export const getSideChapters = async (chapterType?: string): Promise<SideChaptersResponse> => {
    const params = chapterType ? { chapterType } : {};
    const response = await apiClient.get<SideChaptersResponse>('/chapters/side', { params });
    return response.data;
};

/** 유저 진행률 요약 조회 */
export const getProgress = async (): Promise<ProgressResponse> => {
    const response = await apiClient.get<ProgressResponse>('/progress');
    return response.data;
};

/** 챕터 상세(본문) 조회 */
export const getChapterDetail = async (chapterId: number): Promise<ChapterDetailResponse> => {
    const response = await apiClient.get<ChapterDetailResponse>(`/chapters/${chapterId}`);
    return response.data;
};
