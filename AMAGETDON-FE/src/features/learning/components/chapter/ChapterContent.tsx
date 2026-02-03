import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common';
import { Toast } from '@/components/common';
import type { ChapterDetailResponse, ChapterItem } from '../../types/learning.ts';
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
    /** 이전/다음 이동 가능한 챕터 목록 */
    siblings: ChapterItem[];
}

/**
 * HTML 본문을 h3 기준으로 섹션 카드로 분할
 * - 각 h3 ~ 다음 h3 사이의 내용을 하나의 섹션으로 묶음
 * - h3 이전의 도입부는 별도의 인트로 섹션으로 처리
 */
const splitIntoSections = (html: string): { intro: string; sections: { heading: string; body: string }[] } => {
    const parts = html.split(/<h3>(.*?)<\/h3>/);
    // parts: [intro, heading1, body1, heading2, body2, ...]
    const intro = parts[0] || '';
    const sections: { heading: string; body: string }[] = [];

    for (let i = 1; i < parts.length; i += 2) {
        sections.push({
            heading: parts[i],
            body: parts[i + 1] || '',
        });
    }
    return { intro, sections };
};

/**
 * 섹션 본문을 <p> 기준으로 청크 단위로 분할
 * - 모바일에서 한 카드에 텍스트가 과하게 몰리는 문제 해결용
 * - <p> 앞에서 잘라서 각 청크가 하나의 문단 블록이 되도록 함
 * - 비-p 요소(blockquote, ul 등)는 앞 문단에 붙음
 */
const splitBodyIntoChunks = (bodyHtml: string): string[] => {
    const chunks = bodyHtml.split(/(?=<p[\s>])/).filter((s) => s.trim());
    if (chunks.length <= 1) return [bodyHtml];
    return chunks;
};

/**
 * 챕터 본문 조회 컴포넌트
 * - 상단 읽기 진행률 바
 * - 뒤로가기 버튼
 * - 챕터 헤더 (태그, 제목, 요약)
 * - HTML 본문을 섹션 카드 단위로 렌더링 (스크롤 애니메이션)
 * - 퀴즈 풀기 버튼
 * - 스크롤 85% 이상 시 읽기 완료 토스트 알림
 * - 이전/다음 챕터 네비게이션
 */
export const ChapterContent = ({ chapter, siblings }: ChapterContentProps) => {
    const navigate = useNavigate();
    const [readProgress, setReadProgress] = useState(0);
    const [showCompleteToast, setShowCompleteToast] = useState(false);
    const hasShownToast = useRef(false);
    const bodyRef = useRef<HTMLDivElement>(null);

    // 현재 챕터의 이전/다음 챕터 찾기
    const currentIndex = siblings.findIndex((c) => c.chapterId === chapter.chapterId);
    const prevChapter = currentIndex > 0 ? siblings[currentIndex - 1] : null;
    const nextChapter = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

    // 잠긴 챕터로는 이동 불가
    const canGoPrev = prevChapter && prevChapter.status !== 'LOCKED';
    const canGoNext = nextChapter && nextChapter.status !== 'LOCKED';

    // HTML을 섹션 단위로 분할
    const { intro, sections } = splitIntoSections(chapter.chapterContent);

    // 스크롤 진행률 추적 + 읽기 완료 감지
    const handleScroll = useCallback(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
        setReadProgress(progress);

        // 85% 이상 스크롤 시 읽기 완료 토스트 (1회만)
        if (progress >= 85 && !hasShownToast.current) {
            hasShownToast.current = true;
            setShowCompleteToast(true);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // 스크롤 시 섹션 카드 fade-in 애니메이션 (IntersectionObserver)
    useEffect(() => {
        const container = bodyRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('section-visible');
                    }
                });
            },
            { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
        );

        // 섹션 카드 + 인트로 관찰
        const targets = container.querySelectorAll('.chapter-section, .chapter-intro, .chapter-section__chunk');
        targets.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [chapter.chapterId]);

    // 챕터 변경 시 토스트 상태 초기화
    useEffect(() => {
        hasShownToast.current = false;
        setShowCompleteToast(false);
        setReadProgress(0);
        window.scrollTo(0, 0);
    }, [chapter.chapterId]);

    return (
        <div className="chapter-content">
            {/* 상단 읽기 진행률 바 */}
            <div className="chapter-content__progress-bar">
                <div
                    className="chapter-content__progress-fill"
                    style={{ width: `${readProgress}%` }}
                />
            </div>

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

            {/* 구분선 */}
            <div className="chapter-content__divider" />

            {/* 본문: 섹션 카드 단위 렌더링 */}
            <div className="chapter-content__body" ref={bodyRef}>
                {/* 인트로 (h3 이전 내용) */}
                {intro.trim() && (
                    <div
                        className="chapter-intro"
                        dangerouslySetInnerHTML={{ __html: intro }}
                    />
                )}

                {/* 각 섹션 카드 — 모바일에서는 <p> 기준으로 청크 분할 */}
                {sections.map((section, idx) => (
                    <div className="chapter-section" key={idx}>
                        <div className="chapter-section__number">{idx + 1}</div>
                        <h3
                            className="chapter-section__heading"
                            dangerouslySetInnerHTML={{ __html: section.heading }}
                        />
                        <div className="chapter-section__body">
                            {splitBodyIntoChunks(section.body).map((chunk, pIdx) => (
                                <div
                                    key={pIdx}
                                    className="chapter-section__chunk"
                                    dangerouslySetInnerHTML={{ __html: chunk }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

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

            {/* 읽기 완료 토스트 알림 */}
            {showCompleteToast && (
                <Toast
                    message="읽기 완료! 퀴즈를 풀어 챕터를 마무리하세요."
                    type="success"
                    duration={4000}
                    onClose={() => setShowCompleteToast(false)}
                />
            )}
        </div>
    );
};
