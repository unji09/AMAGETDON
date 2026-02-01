import type { ChapterItem } from '../types/learning';
import './SideQuestNode.css';

interface SideQuestNodeProps {
    chapter: ChapterItem;
    onClick: (chapter: ChapterItem) => void;
}

// TODO (지원) : 자물괴, 진행가능 이모지 변경
/**
 * 성향별 학습(사이드) 노드 컴포넌트
 * - 메인 챕터에 연결된 부가 학습 컨텐츠를 표시
 * - 메인 타임라인에서 분기되는 형태로 표시됨
 */
export const SideQuestNode = ({ chapter, onClick }: SideQuestNodeProps) => {
    // LOCKED 상태가 아니면 클릭 가능
    const isClickable = chapter.status !== 'LOCKED';

    return (
        <button
            className={`side-quest side-quest--${chapter.status.toLowerCase()}`}
            onClick={() => isClickable && onClick(chapter)}
            disabled={!isClickable}
            type="button"
        >
            <div className="side-quest__connector" />
            <div className="side-quest__circle">
                {chapter.status === 'LOCKED' ? (
                    <span>&#128274;</span>
                ) : chapter.status === 'COMPLETED' ? (
                    <span>&#10003;</span>
                ) : (
                    <span>&#128218;</span>
                )}
            </div>
            <div className="side-quest__info">
                <span className="side-quest__label">Side 교차학습</span>
                <span className="side-quest__title">{chapter.chapterTitle}</span>
            </div>
        </button>
    );
};
