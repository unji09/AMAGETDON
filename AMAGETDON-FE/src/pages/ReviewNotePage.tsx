import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReviewNote } from '@/features/learning/hooks/useReviewNote';
import { ReviewNoteHeader } from '@/features/learning/components/review/ReviewNoteHeader';
import { ReviewNoteList } from '@/features/learning/components/review/ReviewNoteList';
import { ReviewNoteEmpty } from '@/features/learning/components/review/ReviewNoteEmpty';
import { Modal, Toast } from '@/components/common';
import type { ReviewNoteDetail } from '@/types/quiz';
import './ReviewNotePage.css';

/**
 * 오답노트 페이지
 * - 오답 목록 조회 및 표시
 * - 다시 풀기 (모달)
 * - 개별 삭제
 */
export const ReviewNotePage = () => {
    const navigate = useNavigate();
    const {
        reviewNotes,
        totalCount,
        loading,
        error,
        handleSubmit,
        handleDelete,
    } = useReviewNote();

    const [selectedNote, setSelectedNote] = useState<ReviewNoteDetail | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // 다시 풀기 버튼 클릭
    const handleSolveClick = (note: ReviewNoteDetail) => {
        setSelectedNote(note);
        setUserAnswer('');
    };

    // 답안 제출
    const handleAnswerSubmit = async () => {
        if (!selectedNote || !userAnswer.trim()) return;

        setSubmitting(true);
        try {
            const result = await handleSubmit(selectedNote.quizId, userAnswer.trim());

            if (result.isCorrect) {
                let message = '정답입니다! 오답노트에서 삭제되었습니다.';
                if (result.rewardReceived) {
                    message += ' 50,000원 보상을 받았습니다!';
                }
                setToastMsg(message);
                setSelectedNote(null);
            } else {
                setToastMsg('틀렸습니다. 다시 도전해보세요!');
            }
        } catch (err) {
            console.error('답안 제출 오류:', err);
            setToastMsg('답안 제출에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    // 삭제 확인
    const handleDeleteClick = async (reviewNoteId: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await handleDelete(reviewNoteId);
            setToastMsg('삭제되었습니다.');
        } catch (err) {
            console.error('삭제 오류:', err);
            setToastMsg('삭제에 실패했습니다.');
        }
    };

    if (loading) {
        return (
            <div className="review-note-page">
                <div className="review-note-page__loading">로딩 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="review-note-page">
                <div className="review-note-page__error">{error}</div>
            </div>
        );
    }

    return (
        <div className="review-note-page">
            <ReviewNoteHeader totalCount={totalCount} />

            {totalCount === 0 ? (
                <ReviewNoteEmpty />
            ) : (
                <ReviewNoteList
                    reviewNotes={reviewNotes}
                    onSolve={handleSolveClick}
                    onDelete={handleDeleteClick}
                />
            )}

            {/* 다시 풀기 모달 */}
            {selectedNote && (
                <Modal
                    isOpen={true}
                    onClose={() => setSelectedNote(null)}
                >
                    <div className="review-note-modal">
                        <h3 className="review-note-modal__title">문제 다시 풀기</h3>
                        <p className="review-note-modal__question">{selectedNote.content}</p>

                        {selectedNote.quizType === 'MCQ' && selectedNote.choices ? (
                            <div className="review-note-modal__choices">
                                {selectedNote.choices.map((choice) => (
                                    <label
                                        key={choice.choiceId}
                                        className={`review-note-modal__choice ${
                                            userAnswer === String(choice.choiceId)
                                                ? 'review-note-modal__choice--selected'
                                                : ''
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="answer"
                                            value={choice.choiceId}
                                            checked={userAnswer === String(choice.choiceId)}
                                            onChange={(e) => setUserAnswer(e.target.value)}
                                        />
                                        <span>{choice.choiceText}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="review-note-modal__ox">
                                <button
                                    type="button"
                                    className={`review-note-modal__ox-btn ${
                                        userAnswer === 'O' ? 'review-note-modal__ox-btn--selected' : ''
                                    }`}
                                    onClick={() => setUserAnswer('O')}
                                >
                                    O
                                </button>
                                <button
                                    type="button"
                                    className={`review-note-modal__ox-btn ${
                                        userAnswer === 'X' ? 'review-note-modal__ox-btn--selected' : ''
                                    }`}
                                    onClick={() => setUserAnswer('X')}
                                >
                                    X
                                </button>
                            </div>
                        )}

                        <button
                            type="button"
                            className="review-note-modal__submit"
                            onClick={handleAnswerSubmit}
                            disabled={submitting || !userAnswer}
                        >
                            {submitting ? '제출 중...' : '제출하기'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* 토스트 알림 */}
            {toastMsg && (
                <Toast
                    message={toastMsg}
                    type="success"
                    duration={3000}
                    onClose={() => setToastMsg(null)}
                />
            )}
        </div>
    );
};