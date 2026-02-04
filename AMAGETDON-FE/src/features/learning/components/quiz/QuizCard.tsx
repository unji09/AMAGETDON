import {useState} from 'react';
import {Button} from '@/components/common';
import type {QuizDetail} from '@/types/quiz';
import './QuizCard.css';

interface QuizCardProps {
    quiz: QuizDetail;
    sequence?: number;
    onSubmit: (answer: {
        oxAnswer?: boolean;
        choiceId?: number;
        shuffledChoices?: any[];
    }) => void;
    disabled?: boolean;
}

/**
 * 퀴즈 카드 컴포넌트
 * - OX 퀴즈: O/X 버튼 표시
 * - 객관식 퀴즈: 4지선다 선택지 표시 (랜덤 순서)
 */
export const QuizCard = ({quiz, sequence, onSubmit, disabled = false}: QuizCardProps) => {
    if (!quiz) {
        return <div className="quiz-card__error">
            선택지 데이터를 불러올 수 없습니다.
        </div>
    }

    const [selectedAnswer, setSelectedAnswer] = useState<{
        oxAnswer?: boolean;
        choiceId?: number;
    } | null>(null);

    // 선택지 순서 랜덤화 (객관식만, choices가 존재할 때만)
    const [shuffledChoices] = useState(() => {
        if (quiz.quizType === 'MCQ' && quiz.choices && quiz.choices.length > 0) {
            return [...quiz.choices].sort(() => Math.random() - 0.5);
        }
        return null;
    });

    const isOX = quiz.quizType === 'OX';
    const canSubmit = selectedAnswer !== null && !disabled;

    const handleOptionClick = (answer: { oxAnswer?: boolean; choiceId?: number }) => {
        if (disabled) return;
        setSelectedAnswer(answer);
    };

    const handleSubmit = () => {
        if (!canSubmit || !selectedAnswer) return;

        // 객관식이고 섞인 선택지가 있으면 함께 전달
        if (!isOX && shuffledChoices) {
            onSubmit({...selectedAnswer, shuffledChoices});
        } else {
            onSubmit(selectedAnswer);
        }
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
            <p className="quiz-card__question">{quiz.content}</p>

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
                            onClick={() => handleOptionClick({oxAnswer: true})}
                            disabled={disabled}
                        >
                            <span className="quiz-card__option-text">O</span>
                        </button>
                        <button
                            type="button"
                            className={`quiz-card__option quiz-card__option--ox ${
                                selectedAnswer?.oxAnswer === false ? 'quiz-card__option--selected' : ''
                            }`}
                            onClick={() => handleOptionClick({oxAnswer: false})}
                            disabled={disabled}
                        >
                            <span className="quiz-card__option-text">X</span>
                        </button>
                    </>
                ) : shuffledChoices && shuffledChoices.length > 0 ? (
                    /* MCQ 퀴즈 - 선택지 렌더링 */
                    shuffledChoices.map((choice, index) => (
                        <button
                            key={choice.choiceId}
                            type="button"
                            className={`quiz-card__option ${
                                selectedAnswer?.choiceId === choice.choiceId
                                    ? 'quiz-card__option--selected'
                                    : ''
                            }`}
                            onClick={() => handleOptionClick({choiceId: choice.choiceId})}
                            disabled={disabled}
                        >
                            <span className="quiz-card__option-no">{index + 1}</span>
                            <span className="quiz-card__option-text">{choice.choiceText}</span>
                        </button>
                    ))
                ) : (
                    /* 객관식인데 선택지가 없는 경우 (에러 상태) */
                    <div className="quiz-card__error">
                        선택지 데이터를 불러올 수 없습니다.
                    </div>
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