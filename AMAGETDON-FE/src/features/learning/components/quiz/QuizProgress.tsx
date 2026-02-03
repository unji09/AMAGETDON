import './QuizProgress.css';

interface QuizProgressProps {
    current: number;
    total: number;
    correctCount: number;
    wrongCount: number;
}

/**
 * 퀴즈 진행률 표시 컴포넌트
 * - 진행률 바
 * - 정답/오답 통계
 */
export const QuizProgress = ({ current, total, correctCount, wrongCount }: QuizProgressProps) => {
    const progress = total > 0 ? (current / total) * 100 : 0;

    return (
        <div className="quiz-progress">
            <div className="quiz-progress__header">
                <span className="quiz-progress__label">진행 상황</span>
                <span className="quiz-progress__count">
                    <strong>{current}</strong> / {total}
                </span>
            </div>

            <div className="quiz-progress__bar">
                <div
                    className="quiz-progress__fill"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="quiz-progress__stats">
                <div className="quiz-progress__stat">
                    <span className="quiz-progress__stat-icon quiz-progress__stat-icon--correct">
                        ✓
                    </span>
                    <span>정답:</span>
                    <span className="quiz-progress__stat-value">{correctCount}</span>
                </div>
                <div className="quiz-progress__stat">
                    <span className="quiz-progress__stat-icon quiz-progress__stat-icon--wrong">
                        ✕
                    </span>
                    <span>오답:</span>
                    <span className="quiz-progress__stat-value">{wrongCount}</span>
                </div>
            </div>
        </div>
    );
};