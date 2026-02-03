import { useState } from 'react';
import { Button } from '@/components/common';
import type { QuizDetail } from '@/types/quiz';
import './QuizCard.css';

interface QuizCardProps {
    quiz: QuizDetail;
    sequence?: number;
    onSubmit: (answer: { oxAnswer?: boolean; choiceId?: number }) => void;
    disabled?: boolean;
}

/**
 * 퀴즈 카드 컴포넌트
 * - OX 퀴즈: 큰 O/X 버튼
 * - MCQ 퀴즈: 선택지 목록
 */
export const QuizCard = ({ quiz, sequence, onSubmit, disabled = false }: QuizCardProps) => {
    const [selectedAnswer, setSelectedAnswer] = useState<{
        oxAnswer?: boolean;
        choiceId?: number;
    } | null>(null);

    const isOX = quiz.quizType === 'OX';
    const canSubmit = selectedAnswer !== null && !disabled;

    const handleOptionClick = (answer: { oxAnswer?: boolean; choiceId?: number }) => {
        if (disabled) return;
        setSelectedAnswer(answer);
    };

    const handleSubmit = () => {
        if (!canSubmit || !selectedAnswer) return;
        onSubmit(selectedAnswer);
    };

    return (
        <div className="quiz-card">
            {/* 헤더 */}
            <div className="quiz-card__header">
                {sequence && (
                    <span className="quiz-card__sequence">
                        문제 {sequence}
                    </span>
                )}
                <span className="quiz-card__type-badge">
                    {isOX ? 'OX' : '4지선다'}
                </span>
            </div>

            {/* 문제 */}
            <p className="quiz-card__question">{quiz.quizContent}</p>

            {/* 선택지 */}
            <div className={`quiz-card__options ${isOX ? 'quiz-card__options--ox' : ''}`}>
                {isOX ? (
                    /* OX 퀴즈 */
                    <>
                        <button
                            type="button"
                            className={`quiz-card__option quiz-card__option--ox ${
                                selectedAnswer?.oxAnswer === true ? 'quiz-card__option--selected' : ''
                            }`}
                            onClick={() => handleOptionClick({ oxAnswer: true })}
                            disabled={disabled}
                        >
                            <span className="quiz-card__option-text">O</span>
                        </button>
                        <button
                            type="button"
                            className={`quiz-card__option quiz-card__option--ox ${
                                selectedAnswer?.oxAnswer === false ? 'quiz-card__option--selected' : ''
                            }`}
                            onClick={() => handleOptionClick({ oxAnswer: false })}
                            disabled={disabled}
                        >
                            <span className="quiz-card__option-text">X</span>
                        </button>
                    </>
                ) : (
                    /* MCQ 퀴즈 */
                    quiz.choices?.map((choice) => (
                        <button
                            key={choice.choiceId}
                            type="button"
                            className={`quiz-card__option ${
                                selectedAnswer?.choiceId === choice.choiceId
                                    ? 'quiz-card__option--selected'
                                    : ''
                            }`}
                            onClick={() => handleOptionClick({ choiceId: choice.choiceId })}
                            disabled={disabled}
                        >
                            <span className="quiz-card__option-no">{choice.choiceNo}</span>
                            <span className="quiz-card__option-text">{choice.choiceText}</span>
                        </button>
                    ))
                )}
            </div>

            {/* 제출 버튼 */}
            <div className="quiz-card__submit">
                <Button
                    variant="primary"
                    size="large"
                    fullWidth
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                >
                    정답 제출
                </Button>
            </div>
        </div>
    );
};