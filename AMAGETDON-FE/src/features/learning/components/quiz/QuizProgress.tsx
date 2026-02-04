import './QuizProgress.css';

interface QuizProgressProps {
    current: number;
    total: number;
}

/**
 * 퀴즈 진행률 컴포넌트
 * - 현재/전체 표시
 * - 프로그레스 바
 */
export const QuizProgress = ({ current, total }: QuizProgressProps) => {
    const percentage = total > 0 ? (current / total) * 100 : 0;

    return (
        <div className="quiz-progress">
            <div className="quiz-progress__header">
                <h2 className="quiz-progress__title">진행 상황</h2>
                <span className="quiz-progress__count">
                    <strong>{current}</strong> / {total}
                </span>
            </div>
            <div className="quiz-progress__bar">
                <div
                    className="quiz-progress__fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};