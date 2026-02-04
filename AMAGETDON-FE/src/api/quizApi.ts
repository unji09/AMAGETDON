import apiClient from '@/api/client.ts';
import type {
    QuizResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
    ChapterQuizResponse,
    ChapterQuizSubmitRequest,
    ChapterQuizSubmitResponse,
    ReviewNoteListResponse,
} from '@/types/quiz';

const QUIZ_BASE = '/quizzes';
const CHAPTER_BASE = '/chapters';
const REVIEW_NOTE_BASE = '/review-note';

/**
 * 무한 퀴즈 - 오늘의 퀴즈 조회
 * GET /api/v1/quiz/daily
 */
export const fetchDailyQuiz = async (): Promise<QuizResponse> => {
    const { data } = await apiClient.get(`${QUIZ_BASE}/daily`);
    return data;
};

/**
 * 무한 퀴즈 - 정답 제출
 * POST /api/v1/quiz/daily
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
 * GET /api/v1/review-note
 */
export const fetchReviewNotes = async (): Promise<ReviewNoteListResponse> => {
    const { data } = await apiClient.get(REVIEW_NOTE_BASE);
    return data;
};

/**
 * 오답노트 - 특정 문제 다시 풀기
 * POST /api/v1/review-note/{reviewNoteId}/solve
 */
export const solveReviewNote = async (
    reviewNoteId: number,
    request: QuizSubmitRequest
): Promise<QuizSubmitResponse> => {
    const { data } = await apiClient.post(
        `${REVIEW_NOTE_BASE}/${reviewNoteId}/solve`,
        request
    );
    return data;
};

/**
 * 오답노트 - 특정 문제 삭제
 * DELETE /api/v1/review-note/{reviewNoteId}
 */
export const deleteReviewNote = async (
    reviewNoteId: number
): Promise<void> => {
    await apiClient.delete(`${REVIEW_NOTE_BASE}/${reviewNoteId}`);
};