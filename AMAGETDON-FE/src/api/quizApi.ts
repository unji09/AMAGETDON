import apiClient from '@/api/client.ts';
import type {
    QuizResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
    ChapterQuizResponse,
    ChapterQuizSubmitRequest,
    ChapterQuizSubmitResponse,
    ReviewNoteListResponse,
    ReviewNoteSubmitRequest,
    ReviewNoteSubmitResponse,
} from '@/types/quiz';

const QUIZ_BASE = '/quizzes';
const CHAPTER_BASE = '/chapters';


/**
 * 메인페이지에 띄울 오늘 맞춘 문제 수
 */
export interface QuizCountResponse {
    count: number;
}

export const getTodayQuizCount = async (): Promise<QuizCountResponse> => {
    const response = await apiClient.get<QuizCountResponse>('/quizzes/daily/count');
    return response.data;
};

/**
 * 무한 퀴즈 - 오늘의 퀴즈 조회
 * GET /api/v1/quizzes/daily
 */
export const fetchDailyQuiz = async (): Promise<QuizResponse> => {
    const { data } = await apiClient.get(`${QUIZ_BASE}/daily`);
    return data;
};

/**
 * 무한 퀴즈 - 정답 제출
 * POST /api/v1/quizzes/daily
 */
export const submitDailyQuiz = async (
    request: QuizSubmitRequest
): Promise<QuizSubmitResponse> => {
    const { data } = await apiClient.post(`${QUIZ_BASE}/daily`, request);
    return data;
};

/**
 * 챕터 퀴즈 - 10문제 조회
 * GET /api/v1/chapters/{chapterId}/quizzes
 */
export const fetchChapterQuiz = async (
    chapterId: number
): Promise<ChapterQuizResponse> => {
    const { data } = await apiClient.get(
        `${CHAPTER_BASE}/${chapterId}/quizzes`
    );
    return data;
};

/**
 * 챕터 퀴즈 - 답안 제출
 * POST /api/v1/chapters/{chapterId}/quizzes
 */
export const submitChapterQuiz = async (
    chapterId: number,
    request: ChapterQuizSubmitRequest
): Promise<ChapterQuizSubmitResponse> => {
    const { data } = await apiClient.post(
        `${CHAPTER_BASE}/${chapterId}/quizzes`,
        request
    );
    return data;
};

/**
 * 오답노트 - 목록 조회
 * GET /api/v1/quizzes/reviewNotes
 *
 * Swagger 스펙:
 * - 챕터별로 그룹화된 오답 목록
 * - 객관식 문제는 선택지 포함
 * - 총 오답 개수 및 오늘 보상 수령 여부 제공
 */
export const fetchReviewNotes = async (): Promise<ReviewNoteListResponse> => {
    const { data } = await apiClient.get(`${QUIZ_BASE}/reviewNotes`);
    return data;
};

/**
 * 오답노트 - 답안 제출 (다시 풀기)
 * POST /api/v1/quizzes/reviewNotes
 *
 * Swagger 스펙:
 * - 정답 시: 오답노트에서 자동 삭제
 * - 오답 시: 오답노트에 계속 유지
 * - 오늘 첫 풀이: 50,000원 보상 지급 (하루 1회)
 * - OX 문제: answer에 "O" 또는 "X"
 * - 객관식 문제: answer에 선택지 ID (문자열)
 */
export const submitReviewNote = async (
    request: ReviewNoteSubmitRequest
): Promise<ReviewNoteSubmitResponse> => {
    const { data } = await apiClient.post(`${QUIZ_BASE}/reviewNotes`, request);
    return data;
};

/**
 * 오답노트 - 개별 문제 삭제
 * DELETE /api/v1/quizzes/reviewNotes/{reviewNoteId}
 *
 * Swagger 스펙:
 * - 특정 오답노트 항목을 수동으로 삭제
 */
export const deleteReviewNote = async (
    reviewNoteId: number
): Promise<void> => {
    await apiClient.delete(`${QUIZ_BASE}/reviewNotes/${reviewNoteId}`);
};