import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { useReviewNote } from '@/features/learning/hooks/useReviewNote';
import {
    ReviewNoteHeader,
    ReviewNoteList,
    ReviewNoteEmpty,
    ReviewNoteFeedback,
} from '@/features/learning/components/review';
import { Modal, Button, Toast } from '@/components/common';
import type { ReviewNoteDetail, ReviewNoteSubmitRequest } from '@/types/quiz';
import './ReviewNotePage.css';

/**
 * 오답노트 페이지
 * - 챕터별 그룹화된 오답 목록
 * - 다시 풀기 모달 (OX/객관식)
 * - 개별 삭제
 */
export const ReviewNotePage = () => {
    const navigate = useNavigate();
    const { reviewNotes, totalCount, todayRewardReceived, loading, error, handleSubmit, handleDelete } = useReviewNote();

    const [selectedNote, setSelectedNote] = useState<ReviewNoteDetail | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string>('');
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const [submitting, setSubmitting] = useState(false);

    // 피드백 모달
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackData, setFeedbackData] = useState<{
        isCorrect: boolean;
        rewardReceived: boolean;
    } | null>(null);

    // 다시 풀기 모달 열기
    const handleSolveClick = (note: ReviewNoteDetail) => {
        setSelectedNote(note);
        setSelectedAnswer('');
        setShowModal(true);
    };

    // 다시 풀기 모달 닫기
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedNote(null);
        setSelectedAnswer('');
    };

    // OX 버튼 클릭
    const handleOXClick = async (answer: 'O' | 'X') => {
        if (!selectedNote || submitting) return;

        setSubmitting(true);
        try {
            const request: ReviewNoteSubmitRequest = {
                quizId: selectedNote.quizId,
                answer,
            };
            const response = await handleSubmit(request);

            // 피드백 모달 표시
            setFeedbackData({
                isCorrect: response.isCorrect,
                rewardReceived: response.rewardReceived || false,
            });
            setShowFeedback(true);
            handleCloseModal();
        } catch (err) {
            setToastType('error');
            setToastMsg('답안 제출에 실패했습니다');
        } finally {
            setSubmitting(false);
        }
    };

    // 객관식 제출
    const handleMCQSubmit = async () => {
        if (!selectedNote || !selectedAnswer || submitting) return;

        setSubmitting(true);
        try {
            const request: ReviewNoteSubmitRequest = {
                quizId: selectedNote.quizId,
                answer: selectedAnswer,
            };
            const response = await handleSubmit(request);

            // 피드백 모달 표시
            setFeedbackData({
                isCorrect: response.isCorrect,
                rewardReceived: response.rewardReceived || false,
            });
            setShowFeedback(true);
            handleCloseModal();
        } catch (err) {
            setToastType('error');
            setToastMsg('답안 제출에 실패했습니다');
        } finally {
            setSubmitting(false);
        }
    };

    // 피드백 모달 닫기
    const handleCloseFeedback = () => {
        if (!feedbackData) return;

        setShowFeedback(false);

        // 오답인 경우에만 Toast 표시
        if (!feedbackData.isCorrect) {
            setToastType('error');
            setToastMsg('다시 도전해보세요!');
        }

        setFeedbackData(null);
    };

    // 개별 삭제
    const handleDeleteClick = async (reviewNoteId: number) => {
        if (!confirm('이 문제를 오답노트에서 삭제하시겠습니까?')) return;

        try {
            await handleDelete(reviewNoteId);
            setToastType('success');
            setToastMsg('오답노트에서 삭제되었습니다');
        } catch (err) {
            setToastType('error');
            setToastMsg('삭제에 실패했습니다');
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="review-note-page">
                    <div className="review-note-page__loading">
                        <p className="review-note-page__loading-text">오답노트를 불러오는 중...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="review-note-page">
                    <div className="review-note-page__error">
                        <p className="review-note-page__error-text">{error}</p>
                        <Button variant="secondary" onClick={() => window.location.reload()}>
                            다시 시도
                        </Button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="review-note-page">
                <ReviewNoteHeader totalCount={totalCount} />

                {totalCount === 0 ? (
                    <ReviewNoteEmpty onStartLearning={() => navigate('/learning')} />
                ) : (
                    <ReviewNoteList
                        reviewNotes={reviewNotes || {}}
                        onSolveClick={handleSolveClick}
                        onDeleteClick={handleDeleteClick}
                    />
                )}

                {/* 다시 풀기 모달 */}
                {showModal && selectedNote && (
                    <Modal isOpen onClose={handleCloseModal}>
                        <div className="review-note-modal">
                            <span className="review-note-modal__type">
                                {selectedNote.quizType === 'OX' ? 'OX 퀴즈' : '객관식'}
                            </span>
                            <p className="review-note-modal__content">{selectedNote.content}</p>

                            {selectedNote.quizType === 'OX' ? (
                                <div className="review-note-modal__ox-buttons">
                                    <button
                                        type="button"
                                        className="review-note-modal__ox-btn review-note-modal__ox-btn--o"
                                        onClick={() => handleOXClick('O')}
                                        disabled={submitting}
                                    >
                                        O
                                    </button>
                                    <button
                                        type="button"
                                        className="review-note-modal__ox-btn review-note-modal__ox-btn--x"
                                        onClick={() => handleOXClick('X')}
                                        disabled={submitting}
                                    >
                                        X
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="review-note-modal__choices">
                                        {selectedNote.choices?.map((choice) => (
                                            <label
                                                key={choice.choiceId}
                                                className="review-note-modal__choice"
                                            >
                                                <input
                                                    type="radio"
                                                    name="answer"
                                                    value={choice.choiceId.toString()}
                                                    checked={selectedAnswer === choice.choiceId.toString()}
                                                    onChange={(e) => setSelectedAnswer(e.target.value)}
                                                />
                                                <span className="review-note-modal__choice-text">
                                                    {choice.choiceText}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="large"
                                        fullWidth
                                        onClick={handleMCQSubmit}
                                        disabled={!selectedAnswer || submitting}
                                    >
                                        제출하기
                                    </Button>
                                </>
                            )}
                        </div>
                    </Modal>
                )}

                {/* 피드백 모달 */}
                {feedbackData && (
                    <ReviewNoteFeedback
                        isOpen={showFeedback}
                        isCorrect={feedbackData.isCorrect}
                        rewardReceived={feedbackData.rewardReceived}
                        onClose={handleCloseFeedback}
                    />
                )}

                {/* 토스트 알림 */}
                {toastMsg && (
                    <Toast
                        message={toastMsg}
                        type={toastType}
                        duration={4000}
                        onClose={() => setToastMsg(null)}
                    />
                )}
            </div>
        </Layout>
    );
};