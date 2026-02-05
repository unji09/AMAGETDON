import { CheckCircle, XCircle } from 'lucide-react';
import { Modal, Button } from '@/components/common';
import './ReviewNoteFeedback.css';

interface ReviewNoteFeedbackProps {
    isOpen: boolean;
    isCorrect: boolean;
    rewardReceived?: boolean;
    onClose: () => void;
}

/**
 * 오답노트 전용 간단한 피드백 모달
 * - 정답: 체크 아이콘 + "정답입니다!"
 * - 오답: X 아이콘 + "오답입니다"
 * - 정답 시 보상 안내 (선택)
 */
export const ReviewNoteFeedback = ({
                                       isOpen,
                                       isCorrect,
                                       rewardReceived = false,
                                       onClose,
                                   }: ReviewNoteFeedbackProps) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="review-feedback">
                {/* 아이콘 */}
                <div className="review-feedback__icon-wrap">
                    {isCorrect ? (
                        <CheckCircle
                            size={72}
                            strokeWidth={2}
                            className="review-feedback__icon review-feedback__icon--correct"
                        />
                    ) : (
                        <XCircle
                            size={72}
                            strokeWidth={2}
                            className="review-feedback__icon review-feedback__icon--wrong"
                        />
                    )}
                </div>

                {/* 메시지 */}
                <p
                    className={`review-feedback__message ${
                        isCorrect
                            ? 'review-feedback__message--correct'
                            : 'review-feedback__message--wrong'
                    }`}
                >
                    {isCorrect ? '정답입니다!' : '오답입니다'}
                </p>

                {/* 보상 안내 (정답 + 보상 받은 경우만) */}
                {isCorrect && rewardReceived && (
                    <div className="review-feedback__reward">
                        첫 풀이 보상 50,000원이 지급되었습니다
                    </div>
                )}

                {/* 확인 버튼 */}
                <div className="review-feedback__button">
                    <Button variant="primary" size="large" fullWidth onClick={onClose}>
                        확인
                    </Button>
                </div>
            </div>
        </Modal>
    );
};