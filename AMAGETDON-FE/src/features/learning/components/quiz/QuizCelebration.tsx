import { Button } from '@/components/common';
import { PartyPopper } from 'lucide-react';
import './QuizCelebration.css';

interface QuizCelebrationProps {
    onClose: () => void;
    onContinue: () => void;
}

/**
 * 100문제 완료 축하 컴포넌트
 * - 축하 메시지 표시
 * - 닫기 / 계속 풀기 선택
 */
export const QuizCelebration = ({ onClose, onContinue }: QuizCelebrationProps) => {
    return (
        <div className="quiz-celebration">
            <div className="quiz-celebration__content">
                {/* 축하 아이콘 */}
                <div className="quiz-celebration__icon-wrap">
                    <PartyPopper size={64} className="quiz-celebration__icon" />
                </div>

                {/* 축하 메시지 */}
                <h2 className="quiz-celebration__title">
                    와우, 벌써 100번 문제까지
                    <br />
                    완벽하게 정복하셨네요! 대단해요! 👏
                </h2>

                <p className="quiz-celebration__message">
                    오늘 준비된 보상은 여기까지지만,
                    <br />
                    퀴즈를 향한 열정은 계속하셔도 좋아요.
                </p>

                {/* 버튼 */}
                <div className="quiz-celebration__actions">
                    <Button
                        variant="secondary"
                        size="large"
                        onClick={onClose}
                    >
                        닫기
                    </Button>
                    <Button
                        variant="primary"
                        size="large"
                        onClick={onContinue}
                    >
                        계속 풀기
                    </Button>
                </div>
            </div>
        </div>
    );
};