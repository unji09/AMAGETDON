import { CheckCircle, XCircle } from 'lucide-react';
import { Modal, Button } from '@/components/common';
import './SimpleFeedbackModal.css';

interface SimpleFeedbackModalProps {
    isOpen: boolean;
    isCorrect: boolean;
    onNext: () => void;
}

/**
 * 101번 이후 무한 퀴즈 간소화 피드백 모달
 * - 정답/오답 상태만 표시
 * - 상세 정보 없음 (보상 없음, 오답노트 저장 없음)
 * - 빠른 다음 문제 진행
 */
export const SimpleFeedbackModal = ({
    isOpen,
    isCorrect,
    onNext,
}: SimpleFeedbackModalProps) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onNext}>
            <div className={`simple-feedback ${isCorrect ? 'simple-feedback--correct' : 'simple-feedback--wrong'}`}>
                {/* 상태 아이콘 */}
                <div className="simple-feedback__icon-wrap">
                    {isCorrect ? (
                        <CheckCircle size={80} className="simple-feedback__icon simple-feedback__icon--correct" />
                    ) : (
                        <XCircle size={80} className="simple-feedback__icon simple-feedback__icon--wrong" />
                    )}
                </div>

                {/* 제목 */}
                <h3 className="simple-feedback__title">
                    {isCorrect ? '정답!' : '오답!'}
                </h3>

                {/* 메시지 */}
                <p className="simple-feedback__message">
                    {isCorrect 
                        ? '잘하셨습니다!' 
                        : '다음 문제도 도전해보세요!'}
                </p>

                {/* 버튼 */}
                <div className="simple-feedback__actions">
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