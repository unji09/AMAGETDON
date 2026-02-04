import { Pencil, X } from 'lucide-react';
import { Button } from '@/components/common';
import type { ReviewNoteDetail } from '@/types/quiz';
import './ReviewNoteCard.css';

interface ReviewNoteCardProps {
    note: ReviewNoteDetail;
    /** 다시 풀기 버튼 클릭 */
    onSolve: (note: ReviewNoteDetail) => void;
    /** 삭제 버튼 클릭 */
    onDelete: (reviewNoteId: number) => void;
}

/**
 * 개별 오답노트 카드
 * - 아이콘 + 제목 + 날짜 + 퀴즈 타입
 * - [다시 풀기] 버튼
 * - [X] 삭제 버튼
 */
export const ReviewNoteCard = ({ note, onSolve, onDelete }: ReviewNoteCardProps) => {
    const formattedDate = new Date(note.addedAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    const typeLabel = note.quizType === 'OX' ? 'OX 퀴즈' : '객관식';

    return (
        <div className="review-note-card">
            <button
                type="button"
                className="review-note-card__delete"
                onClick={() => onDelete(note.reviewNoteId)}
                aria-label="삭제"
            >
                <X size={18} />
            </button>

            <div className="review-note-card__icon">
                <Pencil size={20} strokeWidth={2} />
            </div>

            <div className="review-note-card__content">
                <h3 className="review-note-card__title">{note.content}</h3>
                <div className="review-note-card__meta">
                    <span className="review-note-card__date">{formattedDate}</span>
                    <span className="review-note-card__divider">•</span>
                    <span className="review-note-card__type">{typeLabel}</span>
                </div>
            </div>

            <Button
                variant="primary"
                size="small"
                onClick={() => onSolve(note)}
            >
                다시 풀기
            </Button>
        </div>
    );
};