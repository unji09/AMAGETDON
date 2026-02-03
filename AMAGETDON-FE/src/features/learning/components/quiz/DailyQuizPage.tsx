import { useState, useEffect } from 'react';
import { QuizCard } from '@/components/learning/quiz/QuizCard';
import { QuizProgress } from '@/components/learning/quiz/QuizProgress';
import { QuizFeedbackModal } from '@/components/learning/quiz/QuizFeedbackModal';
import { RewardNotification } from '@/components/learning/quiz/RewardNotification';
import { QuizCelebration } from '@/components/learning/quiz/QuizCelebration';
import { fetchDailyQuiz, submitDailyQuiz } from '@/api/quizApi';
import type { QuizResponse, QuizSubmitResponse } from '@/types/quiz';
import './DailyQuizPage.css';

/**
 * 무한 퀴즈(오늘의 퀴즈) 페이지
 * - 1~100문제: 보상 지급
 * - 100문제 완료 시: 축하 메시지
 * - 101문제~: 보상 없이 계속
 */
export const DailyQuizPage = () => {
    const [quiz, setQuiz] = useState<QuizResponse | null>(null);
    const [submitResult, setSubmitResult] = useState<QuizSubmitResponse | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showReward, setShowReward] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [userAnswerText, setUserAnswerText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 초기 퀴즈 로드
    useEffect(() => {
        loadQuiz();
    }, []);

    // 퀴즈 로드
    const loadQuiz = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchDailyQuiz();
            setQuiz(data);
            setSubmitResult(null);
            setShowFeedback(false);
            setShowCelebration(false);
        } catch (err) {
            console.error('퀴즈 로드 실패:', err);
            setError('퀴즈를 불러오는데 실패했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    // 답안 제출
    const handleSubmit = async (quizId: number, answer: string | number) => {
        if (!quiz) return;

        try {
            // API 호출
            const result = await submitDailyQuiz({
                quizId,
                oxAnswer: typeof answer === 'string' ? (answer === 'O') : undefined,
                choiceId: typeof answer === 'number' ? answer : undefined,
            });

            setSubmitResult(result);
            setUserAnswerText(answer.toString());
            setShowFeedback(true);

            // 보상이 있으면 알림 표시
            if (result.isCorrect && result.rewardAmount > 0) {
                setShowReward(true);
            }

            // 100문제 완료 체크
            if (quiz.quizSequence === 100) {
                // 피드백 모달 닫힌 후 축하 화면 표시
                setTimeout(() => {
                    setShowFeedback(false);
                    setShowCelebration(true);
                }, 2000);
            }
        } catch (err) {
            console.error('답안 제출 실패:', err);
            setError('답안 제출에 실패했습니다. 다시 시도해주세요.');
        }
    };

    // 다음 문제
    const handleNext = () => {
        setShowFeedback(false);
        loadQuiz();
    };

    // 축하 화면 닫기
    const handleCloseCelebration = () => {
        setShowCelebration(false);
    };

    // 축하 화면에서 계속 풀기
    const handleContinueFromCelebration = () => {
        setShowCelebration(false);
        loadQuiz();
    };

    // 답안 텍스트 변환 (피드백 모달용)
    const getUserAnswerText = (): string => {
        if (!quiz || !submitResult) return '';

        if (quiz.quizDetail.quizType === 'OX') {
            return userAnswerText; // 'O' 또는 'X'
        } else {
            // 객관식: choiceId로 텍스트 찾기
            const choiceId = parseInt(userAnswerText);
            const choice = quiz.quizDetail.choices?.find(c => c.choiceId === choiceId);
            return choice ? `${choice.choiceNo}. ${choice.choiceText}` : userAnswerText;
        }
    };

    // 로딩 상태
    if (loading) {
        return (
            <div className="daily-quiz-page">
                <div className="daily-quiz-page__loading">
                    퀴즈를 불러오는 중...
                </div>
            </div>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <div className="daily-quiz-page">
                <div className="daily-quiz-page__error">
                    {error}
                    <button onClick={loadQuiz} className="daily-quiz-page__retry-btn">
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    // 퀴즈 없음
    if (!quiz) {
        return (
            <div className="daily-quiz-page">
                <div className="daily-quiz-page__empty">
                    오늘의 퀴즈가 없습니다.
                </div>
            </div>
        );
    }

    return (
        <div className="daily-quiz-page">
            {/* 100문제 축하 화면 */}
            {showCelebration ? (
                <QuizCelebration
                    onClose={handleCloseCelebration}
                    onContinue={handleContinueFromCelebration}
                />
            ) : (
                <>
                    {/* 진행률 */}
                    <QuizProgress
                        current={quiz.quizSequence}
                        total={100}
                    />

                    {/* 퀴즈 카드 */}
                    <div className="daily-quiz-page__content">
                        <QuizCard
                            quiz={quiz.quizDetail}
                            onSubmit={(answer) => handleSubmit(quiz.quizDetail.quizId, answer)}
                            disabled={showFeedback}
                        />
                    </div>
                </>
            )}

            {/* 피드백 모달 */}
            {submitResult && (
                <QuizFeedbackModal
                    isOpen={showFeedback}
                    isCorrect={submitResult.isCorrect}
                    userAnswer={getUserAnswerText()}
                    correctAnswer={submitResult.correctAnswer}
                    addedToReviewNote={submitResult.addedToReviewNote}
                    onNext={handleNext}
                    onClose={() => setShowFeedback(false)}
                />
            )}

            {/* 보상 알림 */}
            {showReward && submitResult && (
                <RewardNotification
                    amount={submitResult.rewardAmount}
                    currentBalance={submitResult.currentBalance}
                    onClose={() => setShowReward(false)}
                />
            )}
        </div>
    );
};