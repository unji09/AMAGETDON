import { useEffect, useRef } from 'react';
import { ChapterNode } from './ChapterNode.tsx';
import { SideQuestNode } from './SideQuestNode.tsx';
import type { ChapterItem } from '../../types/learning.ts';
import './RoadmapTimeline.css';

interface RoadmapTimelineProps {
    chapters: ChapterItem[];
    sideChapters: ChapterItem[];
    onChapterClick: (chapter: ChapterItem) => void;
}

/**
 * 학습 로드맵 타임라인 컴포넌트
 * - 메인 챕터와 사이드 챕터를 세로 타임라인 형태로 표시
 * - 각 메인 챕터 뒤에 관련된 사이드 챕터들을 배치
 */
export const RoadmapTimeline = ({ chapters, sideChapters, onChapterClick }: RoadmapTimelineProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const buildTimeline = () => {
        const items: { type: 'main' | 'side'; chapter: ChapterItem }[] = [];
        
         // 각 메인 챕터를 순회
        for (const chapter of chapters) {
            items.push({ type: 'main', chapter });

            // 메인 챕터와 연결된 사이드 챕터들 찾기
            const relatedSides = sideChapters.filter(
                (s) => s.baseChapterNo === chapter.baseChapterNo
            );

            //찾은 사이드 챕터들을 메인 챕터 바로 뒤에 추가
            for (const side of relatedSides) {
                items.push({ type: 'side', chapter: side });
            }
        }

        return items;
    };

    const timeline = buildTimeline();

    // 스크롤 해서 fade 처리
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Add class to the actual node button inside
                        const node = entry.target.querySelector('.chapter-node, .side-quest');
                        if (node) node.classList.add('node-visible');
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -20px 0px' }
        );

        const items = container.querySelectorAll('.roadmap-timeline__item');
        items.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [chapters, sideChapters]);

    return (
        <div className="roadmap-timeline" ref={containerRef}>
            <div className="roadmap-timeline__line" />
            <div className="roadmap-timeline__items">
                {timeline.map((item) => (
                    <div
                        key={`${item.type}-${item.chapter.chapterId}`}
                        className={`roadmap-timeline__item roadmap-timeline__item--${item.type}`}
                    >
                        {item.type === 'main' ? (
                            <ChapterNode chapter={item.chapter} onClick={onChapterClick} />
                        ) : (
                            <SideQuestNode chapter={item.chapter} onClick={onChapterClick} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
