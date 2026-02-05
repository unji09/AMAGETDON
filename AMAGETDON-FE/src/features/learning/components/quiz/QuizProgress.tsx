import './QuizProgress.css';

interface QuizProgressProps {
    current: number;
    total: number;
    label?: string;
}

/**
 * 퀴즈 진행률 컴포넌트
 * - 현재/전체 표시
 * - 프로그레스 바
 */

export const QuizProgress = ({ current, total, label = "진행 상황" }: QuizProgressProps) => {
    return (
        <div className="quiz-progress">
            <div className="quiz-progress__header">
                <h2 className="quiz-progress__title">{label}</h2>
                <span className="quiz-progress__count">
                    <strong>{current}</strong> / {total}
                </span>
            </div>
            {/* ... */}
        </div>
    );
};