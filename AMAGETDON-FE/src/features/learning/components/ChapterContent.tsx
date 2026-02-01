import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common';
import type { ChapterDetailResponse, ChapterItem } from '../types/learning';
import './ChapterContent.css';

/** 챕터 타입별 한글 라벨 */
const TYPE_LABELS: Record<string, string> = {
    NORMAL: '기본편',
    AGGRESSIVE: '공격형',
    NEUTRAL: '중립형',
    STABLE: '안정형',
};

interface ChapterContentProps {
    chapter: ChapterDetailResponse;
    /** 이전/다음 이동 가능한 챕터 목록 (NORMAL 기준) */
    siblings: ChapterItem[];
}

/**
 * 챕터 본문 조회 컴포넌트
 * - 뒤로가기 버튼
 * - 챕터 헤더 (태그, 제목, 요약)
 * - HTML 본문 렌더링
 * - 퀴즈 풀기 버튼
 * - 읽기 완료 버튼
 * - 이전/다음 챕터 네비게이션
 */
export const ChapterContent = ({ chapter, siblings }: ChapterContentProps) => {
    const navigate = useNavigate();

    // 현재 챕터의 이전/다음 챕터 찾기
    const currentIndex = siblings.findIndex((c) => c.chapterId === chapter.chapterId);
    const prevChapter = currentIndex > 0 ? siblings[currentIndex - 1] : null;
    const nextChapter = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

    // 잠긴 챕터로는 이동 불가
    const canGoPrev = prevChapter && prevChapter.status !== 'LOCKED';
    const canGoNext = nextChapter && nextChapter.status !== 'LOCKED';

    return (
        <div className="chapter-content">
            {/* 뒤로가기 */}
            <button
                type="button"
                className="chapter-content__back"
                onClick={() => navigate('/learning')}
            >
                &#8592; 코스로 돌아가기
            </button>

            {/* 챕터 헤더 */}
            <header className="chapter-content__header">
                <div className="chapter-content__tags">
                    <span className="chapter-content__tag chapter-content__tag--type">
                        {TYPE_LABELS[chapter.chapterType] ?? chapter.chapterType}
                    </span>
                    <span className="chapter-content__tag">
                        Chapter {chapter.baseChapterNo}
                    </span>
                </div>
                <h1 className="chapter-content__title">{chapter.chapterTitle}</h1>
                <p className="chapter-content__summary">{chapter.chapterSummary}</p>
            </header>

            {/* HTML 본문 */}
            <article
                className="chapter-content__body"
                dangerouslySetInnerHTML={{ __html: chapter.chapterContent }}
            />

            {/* 퀴즈 풀기 버튼 */}
            <div className="chapter-content__quiz-action">
                <Button
                    variant="primary"
                    size="large"
                    onClick={() => navigate(`/learning/${chapter.chapterId}/quiz`)}
                >
                    &#128221; 퀴즈 풀기
                </Button>
            </div>

            {/* 읽기 완료 버튼 */}
            <div className="chapter-content__complete-action">
                <button
                    type="button"
                    className="chapter-content__complete-btn"
                    onClick={() => navigate('/learning')}
                >
                    &#128578; 읽기 완료!
                </button>
            </div>

            {/* 이전/다음 챕터 네비게이션 */}
            <nav className="chapter-content__nav">
                <div className="chapter-content__nav-item chapter-content__nav-item--prev">
                    {canGoPrev ? (
                        <button
                            type="button"
                            className="chapter-content__nav-btn"
                            onClick={() => navigate(`/learning/${prevChapter.chapterId}`)}
                        >
                            <span className="chapter-content__nav-label">이전 학습</span>
                            <span className="chapter-content__nav-title">
                                {prevChapter.baseChapterNo}. {prevChapter.chapterTitle}
                            </span>
                        </button>
                    ) : (
                        <div />
                    )}
                </div>
                <div className="chapter-content__nav-item chapter-content__nav-item--next">
                    {canGoNext ? (
                        <button
                            type="button"
                            className="chapter-content__nav-btn"
                            onClick={() => navigate(`/learning/${nextChapter.chapterId}`)}
                        >
                            <span className="chapter-content__nav-label">다음 학습</span>
                            <span className="chapter-content__nav-title">
                                {nextChapter.baseChapterNo}. {nextChapter.chapterTitle}
                            </span>
                        </button>
                    ) : (
                        <div />
                    )}
                </div>
            </nav>
        </div>
    );
};
