import './ReviewNoteHeader.css';

interface ReviewNoteHeaderProps {
    totalCount: number;
}

/**
 * 오답노트 헤더 컴포넌트
 * - 제목 + 설명
 * - 총 오답 개수 표시
 */
export const ReviewNoteHeader = ({ totalCount }: ReviewNoteHeaderProps) => {
    return (
        <div className="review-note-header">
            <div className="review-note-header__title-area">
                <h1 className="review-note-header__title">나의 오답노트</h1>
                <p className="review-note-header__subtitle">
                    틀린 문제를 다시 풀어보며 주식 고수가 되어보자!
                </p>
            </div>
            <div className="review-note-header__count-card">
                <span className="review-note-header__count-label">총 오답</span>
                <strong className="review-note-header__count-value">{totalCount}</strong>
            </div>
        </div>
    );
};