import { CheckCircle, XCircle } from 'lucide-react';
import { Modal, Button } from '@/components/common';
import './QuizFeedbackModal.css';

interface QuizFeedbackModalProps {
    isOpen: boolean;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
    addedToReviewNote: boolean;
    onNext: () => void;
    onClose: () => void;
}

/**
 * 무한 퀴즈 제출 후 피드백 모달
 * - 정답/오답 상태 표시
 * - 사용자 답안 vs 정답 비교
 * - 오답노트 추가 여부 안내
 * - 다음 문제로 이동
 */
export const QuizFeedbackModal = ({
                                      isOpen,
                                      isCorrect,
                                      userAnswer,
                                      correctAnswer,
                                      addedToReviewNote,
                                      onNext,
                                      onClose,
                                  }: QuizFeedbackModalProps) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className={`quiz-feedback ${isCorrect ? 'quiz-feedback--correct' : 'quiz-feedback--wrong'}`}>
                {/* 상태 아이콘 */}
                <div className="quiz-feedback__icon-wrap">
                    {isCorrect ? (
                        <CheckCircle size={64} className="quiz-feedback__icon quiz-feedback__icon--correct" />
                    ) : (
                        <XCircle size={64} className="quiz-feedback__icon quiz-feedback__icon--wrong" />
                    )}
                </div>

                {/* 제목 */}
                <h3 className="quiz-feedback__title">
                    {isCorrect ? '정답입니다!' : '오답입니다'}
                </h3>

                {/* 답안 정보 */}
                <div className="quiz-feedback__answers">
                    <div className="quiz-feedback__answer-item">
                        <span className="quiz-feedback__answer-label">선택한 답</span>
                        <span className={`quiz-feedback__answer-value ${isCorrect ? 'quiz-feedback__answer-value--correct' : 'quiz-feedback__answer-value--wrong'}`}>
                            {userAnswer}
                        </span>
                    </div>
                    {!isCorrect && (
                        <div className="quiz-feedback__answer-item">
                            <span className="quiz-feedback__answer-label">정답</span>
                            <span className="quiz-feedback__answer-value quiz-feedback__answer-value--correct">
                                {correctAnswer}
                            </span>
                        </div>
                    )}
                </div>

                {/* 오답노트 추가 안내 */}
                {addedToReviewNote && (
                    <div className="quiz-feedback__note">
                        📝 오답노트에 추가되었습니다
                    </div>
                )}

                {/* 버튼 */}
                <div className="quiz-feedback__actions">
                    <Button
                        variant="primary"
                        size="large"
                        fullWidth
                        onClick={onNext}
                    >
                        다음 문제
                    </Button>
                </div>
            </div>
        </Modal>
    );
};