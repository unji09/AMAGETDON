import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Layout} from '@/components/layout';
import {QuizCard} from '@/features/learning/components/quiz/QuizCard';
import {QuizProgress} from '@/features/learning/components/quiz/QuizProgress';
import {QuizFeedbackModal} from '@/features/learning/components/quiz/QuizFeedbackModal';
import {RewardNotification} from '@/features/learning/components/quiz/RewardNotification';
import {QuizCelebration} from '@/features/learning/components/quiz/QuizCelebration';
import {fetchDailyQuiz, submitDailyQuiz} from '@/api/quizApi';
import type {QuizResponse, QuizSubmitResponse} from '@/types/quiz';
import './DailyQuizPage.css';

/**
 * 무한 퀴즈(오늘의 퀴즈) 페이지
 * - 1~100문제: 보상 지급
 * - 100문제 완료 시: 축하 메시지
 * - 101문제~: 보상 없이 계속
 */
export const DailyQuizPage = () => {
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<QuizResponse | null>(null);
    const [submitResult, setSubmitResult] = useState<QuizSubmitResponse | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showReward, setShowReward] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [userAnswerText, setUserAnswerText] = useState('');
    const [shuffledChoices, setShuffledChoices] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 초기 퀴즈 로드
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login', {replace: true});
            return;
        }
        loadQuiz();
    }, [navigate]);

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
            setShuffledChoices(null);
            setUserAnswerText('');
        } catch (err) {
            console.error('퀴즈 로드 실패:', err);
            setError('퀴즈를 불러오는데 실패했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    // 답안 제출
    const handleSubmit = async (quizId: number, answer: string | number, shuffled?: any[]) => {
        if (!quiz) return;

        try {
            // 섞인 선택지 저장
            if (shuffled) {
                setShuffledChoices(shuffled);
            }

            // API 호출
            const result = await submitDailyQuiz({
                quizId,
                answer: answer.toString(),
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
        navigate('/learning');
    };

    // 축하 화면에서 계속 풀기
    const handleContinueFromCelebration = () => {
        setShowCelebration(false);
        loadQuiz();
    };

    // 답안 텍스트 변환 (피드백 모달용)
    const getUserAnswerText = (): string => {
        if (!quiz || !submitResult) return '';

        if (quiz.quiz.quizType === 'OX') {
            return userAnswerText;
        } else {
            const choiceId = parseInt(userAnswerText);
            const choicesToUse = shuffledChoices || quiz.quiz.choices;
            const choice = choicesToUse?.find(c => c.choiceId === choiceId);

            if (choice) {
                const shuffledIndex = choicesToUse?.findIndex(c => c.choiceId === choiceId);
                const displayNumber = shuffledIndex !== undefined ? shuffledIndex + 1 : '?';
                return `${displayNumber}. ${choice.choiceText}`;
            }
            return userAnswerText;
        }
    };

    // 정답 텍스트 변환 (피드백 모달용)
    const getCorrectAnswerText = (): string => {
        if (!quiz || !submitResult) return '';

        if (quiz.quiz.quizType === 'OX') {
            return submitResult.correctAnswer;
        } else {
            const correctChoiceId = parseInt(submitResult.correctAnswer);
            const choicesToUse = shuffledChoices || quiz.quiz.choices;
            const choice = choicesToUse?.find(c => c.choiceId === correctChoiceId);

            if (choice) {
                const shuffledIndex = choicesToUse?.findIndex(c => c.choiceId === correctChoiceId);
                const displayNumber = shuffledIndex !== undefined ? shuffledIndex + 1 : '?';
                return `${displayNumber}. ${choice.choiceText}`;
            }
            return submitResult.correctAnswer;
        }
    };

    // 로딩 상태
    if (loading) {
        return (
            <Layout>
                <div className="daily-quiz-page">
                    <div className="daily-quiz-page__loading">
                        퀴즈를 불러오는 중...
                    </div>
                </div>
            </Layout>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <Layout>
                <div className="daily-quiz-page">
                    <div className="daily-quiz-page__error">
                        {error}
                        <button onClick={loadQuiz} className="daily-quiz-page__retry-btn">
                            다시 시도
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    // 퀴즈 없음
    if (!quiz || !quiz.quiz) {
        return (
            <Layout>
                <div className="daily-quiz-page">
                    <div className="daily-quiz-page__empty">
                        오늘의 퀴즈가 없습니다.
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="daily-quiz-page">
                {showCelebration ? (
                    <QuizCelebration
                        onClose={handleCloseCelebration}
                        onContinue={handleContinueFromCelebration}
                    />
                ) : (
                    <>
                        <div className="daily-quiz-page__progress-wrapper">
                            <QuizProgress
                                current={quiz.quizSequence - 1}
                                total={100}
                                label="맞춘 문제"
                            />
                        </div>

                        <div className="daily-quiz-page__content">
                            <QuizCard
                                key={quiz.quiz.quizId}
                                quiz={quiz.quiz}
                                onSubmit={(answer) => {
                                    const answerValue = answer.oxAnswer !== undefined
                                        ? (answer.oxAnswer ? 'O' : 'X')
                                        : answer.choiceId!;
                                    handleSubmit(quiz.quiz.quizId, answerValue, answer.shuffledChoices);
                                }}
                                disabled={showFeedback}
                            />
                        </div>
                    </>
                )}

                {submitResult && (
                    <QuizFeedbackModal
                        isOpen={showFeedback}
                        isCorrect={submitResult.isCorrect}
                        userAnswer={getUserAnswerText()}
                        correctAnswer={getCorrectAnswerText()}
                        addedToReviewNote={submitResult.addedToReviewNote}
                        onNext={handleNext}
                        onClose={() => setShowFeedback(false)}
                    />
                )}

                {showReward && submitResult && (
                    <RewardNotification
                        amount={submitResult.rewardAmount}
                        currentBalance={submitResult.currentBalance}
                        onClose={() => setShowReward(false)}
                    />
                )}
            </div>
        </Layout>
    );
};