import {useNavigate} from 'react-router-dom';
import {Button} from '@/components/common';
import './ChapterQuizResult.css';

interface ChapterQuizResultProps {
    result: {
        correctCount: number;
        totalCount: number;
        correctRate: number;
        passed: boolean;
        rewardAmount: number;
        wrongQuizCount: number;
        currentBalance: number;
        nextChapterUnlocked: boolean;
    };
    chapterId: number;
    chapterTitle: string;
    onRetry?: () => void | Promise<void>;
    onExit: () => void;
}

/**
 * 챕터 퀴즈 결과 화면
 * - 정답률, Pass/NonPass 표시
 * - 보상 금액 표시
 * - 다음 챕터 잠금 해제 알림
 * - 재시도 / 나가기 버튼
 */
export const ChapterQuizResult = ({
                                      result,
                                      chapterId,
                                      chapterTitle,
                                      onRetry,
                                      onExit
                                  }: ChapterQuizResultProps) => {
    const navigate = useNavigate();

    const handleNextChapter = () => {
        // 다음 챕터로 이동 (chapterId + 1)
        navigate(`/learning/${chapterId + 1}`);
    };

    return (
        <div className="chapter-quiz-result">
            <div className="chapter-quiz-result__container">
                {/* 결과 아이콘 */}
                <div className={`chapter-quiz-result__icon ${result.passed ? 'passed' : 'failed'}`}>
                    {result.passed ? '✓' : '✗'}
                </div>

                {/* 상태 */}
                <h2 className={`chapter-quiz-result__status ${result.passed ? 'passed' : 'failed'}`}>
                    {result.passed ? '축하합니다! 🎉' : '아쉽네요 😢'}
                </h2>

                {/* 챕터 제목 */}
                <p className="chapter-quiz-result__chapter">{chapterTitle}</p>

                {/* 점수 */}
                <div className="chapter-quiz-result__score">
                    <span className="chapter-quiz-result__score-number">
                        {result.correctCount}
                    </span>
                    <span className="chapter-quiz-result__score-divider">/</span>
                    <span className="chapter-quiz-result__score-total">
                        {result.totalCount}
                    </span>
                </div>

                {/* 정답률 */}
                <div className="chapter-quiz-result__rate">
                    정답률 {result.correctRate}%
                </div>

                {/* 구분선 */}
                <div className="chapter-quiz-result__divider"/>

                {/* 상세 정보 */}
                <div className="chapter-quiz-result__details">
                    {result.passed ? (
                        <>
                            {result.rewardAmount > 0 && (
                                <div className="chapter-quiz-result__detail-item">
                                    <span className="chapter-quiz-result__detail-label">보상</span>
                                    <span className="chapter-quiz-result__detail-value reward">
                                        +{result.rewardAmount.toLocaleString()}원
                                    </span>
                                </div>
                            )}
                            {result.nextChapterUnlocked && (
                                <div className="chapter-quiz-result__detail-item">
                                    <span className="chapter-quiz-result__detail-label">다음 챕터</span>
                                    <span className="chapter-quiz-result__detail-value unlock">
                                        🔓 잠금 해제
                                    </span>
                                </div>
                            )}
                            <div className="chapter-quiz-result__detail-item">
                                <span className="chapter-quiz-result__detail-label">현재 자산</span>
                                <span className="chapter-quiz-result__detail-value">
                                    {result.currentBalance.toLocaleString()}원
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="chapter-quiz-result__detail-item">
                                <span className="chapter-quiz-result__detail-label">틀린 문제</span>
                                <span className="chapter-quiz-result__detail-value">
                                    {result.wrongQuizCount}개
                                </span>
                            </div>
                            <div className="chapter-quiz-result__message">
                                틀린 문제는 오답노트에 저장되었습니다.
                            </div>
                        </>
                    )}
                </div>

                {/* 버튼 */}
                <div className="chapter-quiz-result__actions">
                    {result.passed ? (
                        <>
                            {result.nextChapterUnlocked && (
                                <Button
                                    variant="primary"
                                    size="large"
                                    fullWidth
                                    onClick={handleNextChapter}
                                >
                                    다음 챕터 학습하기
                                </Button>
                            )}
                            <Button
                                variant="secondary"
                                size="large"
                                fullWidth
                                onClick={onExit}
                            >
                                학습 목록으로
                            </Button>
                        </>
                    ) : (
                        <>
                            {onRetry && (
                                <Button
                                    variant="primary"
                                    size="large"
                                    fullWidth
                                    onClick={onRetry}
                                >
                                    다시 도전하기
                                </Button>
                            )}
                            <Button
                                variant="secondary"
                                size="large"
                                fullWidth
                                onClick={onExit}
                            >
                                챕터로 돌아가기
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};