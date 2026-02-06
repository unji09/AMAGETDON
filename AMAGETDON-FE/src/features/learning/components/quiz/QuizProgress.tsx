import './QuizProgress.css';

interface QuizProgressProps {
    current: number;
    total: number;
}

/**
 * 퀴즈 진행률 컴포넌트
 * - 현재/전체 표시
 * - 프로그레스 바
 * - 100문제 초과 시 "100+ / 100" 형식으로 표시
 */
export const QuizProgress = ({ current, total }: QuizProgressProps) => {
    // 100문제 기준으로 진행률 계산 (100 초과 시 100%)
    const displayCurrent = Math.min(current, total);
    const percentage = total > 0 ? (displayCurrent / total) * 100 : 0;

    // 100문제 초과 여부
    const isOver100 = current > total;

    return (
        <div className="quiz-progress">
            <div className="quiz-progress__header">
                <h2 className="quiz-progress__title">오늘 맞춘 문제</h2>
                <span className="quiz-progress__count">
                    <strong>{isOver100 ? `${total}+` : current}</strong> / {total}
                </span>
            </div>
            <div className="quiz-progress__bar">
                <div
                    className="quiz-progress__fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {isOver100 && (
                <p className="quiz-progress__bonus-text">
                    🎉 100문제 달성! 보상 없이 계속 도전 중... ({current}문제)
                </p>
            )}
        </div>
    );
};