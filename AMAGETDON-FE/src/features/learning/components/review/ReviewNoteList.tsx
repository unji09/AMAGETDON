import { useEffect, useRef } from 'react';
import { ReviewNoteCard } from './ReviewNoteCard';
import type { ReviewNoteDetail } from '@/types/quiz';
import './ReviewNoteList.css';

interface ReviewNoteListProps {
    /** 챕터별로 그룹화된 오답 목록 */
    reviewNotes: Record<string, ReviewNoteDetail[]>;
    /** 다시 풀기 */
    onSolve: (note: ReviewNoteDetail) => void;
    /** 삭제 */
    onDelete: (reviewNoteId: number) => void;
}

/**
 * 오답노트 목록 컴포넌트
 * - 챕터별 그룹핑
 * - 카드 리스트
 * - 스크롤 애니메이션
 */
export const ReviewNoteList = ({ reviewNotes, onSolve, onDelete }: ReviewNoteListProps) => {
    const listRef = useRef<HTMLDivElement | null>(null);

    // 스크롤 애니메이션
    useEffect(() => {
        const container = listRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('card-visible');
                    }
                });
            },
            { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
        );

        const cards = container.querySelectorAll('.review-note-card');
        cards.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [reviewNotes]);

    // 챕터명으로 정렬
    const sortedChapters = Object.keys(reviewNotes).sort();

    return (
        <div className="review-note-list" ref={listRef}>
            {sortedChapters.map((chapterName) => (
                <section key={chapterName} className="review-note-list__group">
                    <h2 className="review-note-list__group-title">{chapterName}</h2>
                    <div className="review-note-list__cards">
                        {reviewNotes[chapterName].map((note) => (
                            <ReviewNoteCard
                                key={note.reviewNoteId}
                                note={note}
                                onSolve={onSolve}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};