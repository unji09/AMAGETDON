import { useState, useEffect, useCallback } from 'react';
import { fetchReviewNotes, submitReviewNote, deleteReviewNote } from '@/api/quizApi';
import type { ReviewNoteListResponse, ReviewNoteDetail, ReviewNoteSubmitRequest } from '@/types/quiz';

interface UseReviewNoteReturn {
    /** 챕터별로 그룹화된 오답 목록 */
    reviewNotes: Record<string, ReviewNoteDetail[]>;
    /** 총 오답 개수 */
    totalCount: number;
    /** 오늘 보상 수령 여부 */
    todayRewardReceived: boolean;
    /** 로딩 상태 */
    loading: boolean;
    /** 에러 메시지 */
    error: string | null;
    /** 목록 새로고침 */
    refetch: () => Promise<void>;
    /** 답안 제출 (다시 풀기) */
    handleSubmit: (quizId: number, answer: string) => Promise<{ isCorrect: boolean; rewardReceived?: boolean }>;
    /** 개별 삭제 */
    handleDelete: (reviewNoteId: number) => Promise<void>;
}

/**
 * 오답노트 Hook
 * - 목록 조회
 * - 답안 제출 (다시 풀기)
 * - 개별 삭제
 */
export const useReviewNote = (): UseReviewNoteReturn => {
    const [reviewNotes, setReviewNotes] = useState<Record<string, ReviewNoteDetail[]>>({});
    const [totalCount, setTotalCount] = useState(0);
    const [todayRewardReceived, setTodayRewardReceived] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 목록 조회
    const loadReviewNotes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetchReviewNotes();
            setReviewNotes(response.reviewNotes);
            setTotalCount(response.totalCount);
            setTodayRewardReceived(response.todayRewardReceived);
        } catch (err) {
            setError('오답노트를 불러오는 데 실패했습니다.');
            console.error('오답노트 조회 오류:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // 초기 로드
    useEffect(() => {
        loadReviewNotes();
    }, [loadReviewNotes]);

    // 답안 제출 (다시 풀기)
    const handleSubmit = useCallback(async (quizId: number, answer: string) => {
        const request: ReviewNoteSubmitRequest = { quizId, answer };
        const response = await submitReviewNote(request);

        // 정답 시 목록 새로고침
        if (response.isCorrect) {
            await loadReviewNotes();
        }

        return {
            isCorrect: response.isCorrect,
            rewardReceived: response.rewardReceived,
        };
    }, [loadReviewNotes]);

    // 개별 삭제
    const handleDelete = useCallback(async (reviewNoteId: number) => {
        await deleteReviewNote(reviewNoteId);
        await loadReviewNotes();
    }, [loadReviewNotes]);

    return {
        reviewNotes,
        totalCount,
        todayRewardReceived,
        loading,
        error,
        refetch: loadReviewNotes,
        handleSubmit,
        handleDelete,
    };
};