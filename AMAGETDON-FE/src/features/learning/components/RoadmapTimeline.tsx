import { ChapterNode } from './ChapterNode';
import { SideQuestNode } from './SideQuestNode';
import type { ChapterItem } from '../types/learning';
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
    // 타임라인 아이템 배열을 구성하는 함수 : 메인 챕터 순서대로 배치, 각 메인 챕터 뒤에 해당 baseChapterNo와 연결된 사이드 챕터들 삽입
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

    return (
        <div className="roadmap-timeline">
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
