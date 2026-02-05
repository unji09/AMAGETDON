import { useState, useEffect } from 'react';
import { fetchReviewNotes, submitReviewNote, deleteReviewNote } from '@/api/quizApi';
import type {
    ReviewNoteListResponse,
    ReviewNoteSubmitRequest,
    ReviewNoteSubmitResponse,
} from '@/types/quiz';

interface UseReviewNoteReturn {
    reviewNotes: Record<string, any[]> | null;
    totalCount: number;
    todayRewardReceived: boolean;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    handleSubmit: (request: ReviewNoteSubmitRequest) => Promise<ReviewNoteSubmitResponse>;
    handleDelete: (reviewNoteId: number) => Promise<void>;
}

/**
 * 오답노트 Hook
 * - 오답 목록 조회
 * - 답안 제출 (정답 시 자동 삭제)
 * - 개별 삭제
 */
export const useReviewNote = (): UseReviewNoteReturn => {
    const [reviewNotes, setReviewNotes] = useState<Record<string, any[]> | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [todayRewardReceived, setTodayRewardReceived] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadReviewNotes = async () => {
        try {
            setLoading(true);
            setError(null);
            const data: ReviewNoteListResponse = await fetchReviewNotes();
            setReviewNotes(data.reviewNotes);
            setTotalCount(data.totalCount);
            setTodayRewardReceived(data.todayRewardReceived);
        } catch (err) {
            setError(err instanceof Error ? err.message : '오답노트를 불러올 수 없습니다');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviewNotes();
    }, []);

    const refetch = async () => {
        await loadReviewNotes();
    };

    const handleSubmit = async (request: ReviewNoteSubmitRequest): Promise<ReviewNoteSubmitResponse> => {
        const response = await submitReviewNote(request);
        // 정답일 경우 자동으로 목록에서 삭제되므로 목록 새로고침
        if (response.isCorrect) {
            await refetch();
        }
        return response;
    };

    const handleDelete = async (reviewNoteId: number): Promise<void> => {
        await deleteReviewNote(reviewNoteId);
        await refetch();
    };

    return {
        reviewNotes,
        totalCount,
        todayRewardReceived,
        loading,
        error,
        refetch,
        handleSubmit,
        handleDelete,
    };
};