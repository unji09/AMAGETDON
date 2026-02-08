import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { QuizCard } from '@/features/learning/components/quiz/QuizCard';
import { ChapterQuizResult } from '@/features/learning/components/quiz/ChapterQuizResult';
import { fetchChapterQuiz, submitChapterQuiz } from '@/api/quizApi';
import type { ChapterQuizResponse, ChapterAnswerItem } from '@/types/quiz';
import './ChapterQuizPage.css';

/**
 * 챕터 퀴즈 페이지
 * - 10문제 출제 (OX 4문제, 객관식 6문제)
 * - 60% 이상 정답 시 통과
 * - 틀린 문제 자동 오답노트 저장
 * - 일반 커리큘럼: 300,000원, 성향별: 100,000원
 */
export const ChapterQuizPage = () => {
    const { chapterId } = useParams<{ chapterId: string }>();
    const navigate = useNavigate();
    const [quizData, setQuizData] = useState<ChapterQuizResponse | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<number, string>>(new Map());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const [_shuffledChoicesMap, setShuffledChoicesMap] = useState<Map<number, any[]>>(new Map());
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 퀴즈 로드 함수
    const loadQuiz = async () => {
        if (!chapterId) return;

        console.log('🔄 챕터 퀴즈 로드 시작:', chapterId);

        try {
            setLoading(true);
            setError(null);
            const data = await fetchChapterQuiz(Number(chapterId));
            console.log('✅ 챕터 퀴즈 로드 완료:', data);
            setQuizData(data);
        } catch (err: any) {
            console.error('❌ 챕터 퀴즈 로드 실패:', err);
            if (err.response?.status === 403) {
                setError('잠긴 챕터입니다. 이전 챕터를 먼저 완료해주세요.');
            } else {
                setError('퀴즈를 불러오는데 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    // 초기 로드
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login', { replace: true });
            return;
        }

        loadQuiz();
    }, [chapterId, navigate]);

    // 현재 퀴즈
    const currentQuiz = quizData?.quizzes[currentIndex];
    const isLastQuiz = currentIndex === (quizData?.quizzes.length ?? 0) - 1;
    const progress = quizData ? ((currentIndex + 1) / quizData.quizzes.length) * 100 : 0;

    // 답안 선택
    const handleAnswer = async (answer: { oxAnswer?: boolean; choiceId?: number; shuffledChoices?: any[] }) => {
        if (!currentQuiz) return;

        const answerValue = answer.oxAnswer !== undefined
            ? (answer.oxAnswer ? 'O' : 'X')
            : answer.choiceId!.toString();

        const newAnswers = new Map(answers).set(currentQuiz.quizId, answerValue);
        setAnswers(newAnswers);

        // 섞인 선택지 저장
        if (answer.shuffledChoices) {
            setShuffledChoicesMap(prev => new Map(prev).set(currentQuiz.quizId, answer.shuffledChoices!));
        }

        // 10문제 모두 답변 완료 시 자동 제출
        if (newAnswers.size === quizData?.quizzes.length) {
            // 확인 후 자동 제출
            setTimeout(async () => {
                if (window.confirm('모든 문제에 답변하셨습니다. 제출하시겠습니까?')) {
                    await handleSubmit(newAnswers);
                }
            }, 500);
            return;
        }

        // 자동으로 다음 문제로 이동 (마지막 문제 제외)
        if (!isLastQuiz) {
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 300);
        }
    };

    // 제출
    const handleSubmit = async (answersToSubmit: Map<number, string> = answers) => {
        if (!quizData || answersToSubmit.size !== quizData.quizzes.length) {
            alert('모든 문제에 답변해주세요.');
            return;
        }

        try {
            const answerList: ChapterAnswerItem[] = Array.from(answersToSubmit.entries()).map(([quizId, answer]) => ({
                quizId,
                answer
            }));

            const response = await submitChapterQuiz(Number(chapterId), { answers: answerList });
            setResult(response.data);
            setShowResult(true);
        } catch (err) {
            console.error('퀴즈 제출 실패:', err);
            alert('퀴즈 제출에 실패했습니다. 다시 시도해주세요.');
        }
    };

    // 로딩
    if (loading) {
        return (
            <Layout>
                <div className="chapter-quiz-page">
                    <div className="chapter-quiz-page__loading">
                        퀴즈를 불러오는 중...
                    </div>
                </div>
            </Layout>
        );
    }

    // 에러
    if (error) {
        return (
            <Layout>
                <div className="chapter-quiz-page">
                    <div className="chapter-quiz-page__error">
                        {error}
                        <button
                            onClick={() => navigate(`/learning/${chapterId}`)}
                            className="chapter-quiz-page__back-btn"
                        >
                            챕터로 돌아가기
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    // 퀴즈 없음
    if (!quizData || !currentQuiz) {
        return (
            <Layout>
                <div className="chapter-quiz-page">
                    <div className="chapter-quiz-page__empty">
                        퀴즈를 찾을 수 없습니다.
                    </div>
                </div>
            </Layout>
        );
    }

    // 결과 화면
    if (showResult && result) {
        return (
            <Layout>
                <ChapterQuizResult
                    result={result}
                    chapterId={Number(chapterId)}
                    chapterTitle={quizData?.chapterTitle || ''}
                    onRetry={async () => {
                        console.log('🔁 다시 풀기 시작');
                        // 상태 완전 초기화
                        setAnswers(new Map());
                        setShuffledChoicesMap(new Map());
                        setCurrentIndex(0);
                        setShowResult(false);
                        setResult(null);
                        setQuizData(null); // 기존 데이터 제거
                        // 새로운 문제셋 로드
                        await loadQuiz();
                        console.log('✅ 다시 풀기 완료');
                    }}
                    onExit={() => navigate(`/learning/${chapterId}`)}
                />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="chapter-quiz-page">
                {/* 헤더 */}
                <div className="chapter-quiz-page__header">
                    <h2 className="chapter-quiz-page__title">{quizData.chapterTitle}</h2>
                    <p className="chapter-quiz-page__subtitle">
                        합격 기준: {quizData.passThreshold}% 이상
                    </p>
                </div>

                {/* 진행률 바 */}
                <div className="chapter-quiz-page__progress-wrapper">
                    <div className="chapter-quiz-page__progress-info">
                        <span className="chapter-quiz-page__progress-text">
                            문제 {currentIndex + 1} / {quizData.quizzes.length}
                        </span>
                        <span className="chapter-quiz-page__progress-percent">
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="chapter-quiz-page__progress-bar">
                        <div
                            className="chapter-quiz-page__progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* 퀴즈 카드 */}
                <div className="chapter-quiz-page__content">
                    <QuizCard
                        key={currentQuiz.quizId}
                        quiz={currentQuiz}
                        sequence={currentIndex + 1}
                        onSubmit={handleAnswer}
                        disabled={answers.has(currentQuiz.quizId)}
                    />

                    {/* 제출 완료 안내 */}
                    {answers.has(currentQuiz.quizId) && (
                        <div className="chapter-quiz-page__submitted-notice">
                            <span className="chapter-quiz-page__submitted-icon">✓</span>
                            <span className="chapter-quiz-page__submitted-text">
                                답변이 제출되었습니다
                            </span>
                        </div>
                    )}
                </div>

                {/* 네비게이션 */}
                <div className="chapter-quiz-page__nav">
                    <button
                        onClick={() => setCurrentIndex(prev => prev - 1)}
                        disabled={currentIndex === 0}
                        className="chapter-quiz-page__nav-btn"
                    >
                        이전
                    </button>

                    <button
                        onClick={() => setCurrentIndex(prev => prev + 1)}
                        disabled={isLastQuiz}
                        className="chapter-quiz-page__nav-btn"
                    >
                        다음
                    </button>
                </div>

                {/* 미완료 문제 안내 */}
                {answers.size < quizData.quizzes.length && answers.size > 0 && (
                    <div className="chapter-quiz-page__incomplete-notice">
                        아직 답변하지 않은 문제가 있습니다. ({quizData.quizzes.length - answers.size}개 남음)
                    </div>
                )}

                {/* 모든 문제 답변 완료 시 최종 제출 버튼 */}
                {answers.size === quizData.quizzes.length && !showResult && (
                    <div className="chapter-quiz-page__final-submit">
                        <p className="chapter-quiz-page__complete-message">
                            모든 문제에 답변하셨습니다!
                        </p>
                        <button
                            className="chapter-quiz-page__submit-btn"
                            onClick={async () => {
                                if (window.confirm('퀴즈를 제출하시겠습니까?')) {
                                    await handleSubmit();
                                }
                            }}
                        >
                            최종 제출
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
};