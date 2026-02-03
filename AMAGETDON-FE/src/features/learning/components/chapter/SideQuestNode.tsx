import { useState } from 'react';
import { Lock, CheckCircle, BookOpen } from 'lucide-react';
import type { ChapterItem } from '../../types/learning.ts';
import './SideQuestNode.css';

interface SideQuestNodeProps {
    chapter: ChapterItem;
    onClick: (chapter: ChapterItem) => void;
}

/**
 * 성향별 학습(사이드) 노드 컴포넌트
 * - 메인 챕터에 연결된 부가 학습 컨텐츠를 표시
 * - 메인 타임라인에서 분기되는 형태로 표시됨
 */
export const SideQuestNode = ({ chapter, onClick }: SideQuestNodeProps) => {
    // LOCKED 상태가 아니면 클릭 가능
    const isClickable = chapter.status !== 'LOCKED';
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="side-quest-wrapper">
            <button
                className={`side-quest side-quest--${chapter.status.toLowerCase()}`}
                onClick={() => isClickable && onClick(chapter)}
                disabled={!isClickable}
                type="button"
                onMouseEnter={() => isClickable && chapter.chapterSummary && setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <div className="side-quest__connector" />
                <div className="side-quest__circle">
                    {chapter.status === 'LOCKED' ? (
                        <Lock size={16} />
                    ) : chapter.status === 'COMPLETED' ? (
                        <CheckCircle size={18} strokeWidth={2.5} />
                    ) : (
                        <BookOpen size={18} />
                    )}
                </div>
                <div className="side-quest__info">
                    <span className="side-quest__label">Side 교차학습</span>
                    <span className="side-quest__title">{chapter.chapterTitle}</span>
                </div>
            </button>
            {showTooltip && chapter.chapterSummary && (
                <div className="side-quest__tooltip">{chapter.chapterSummary}</div>
            )}
        </div>
    );
};
