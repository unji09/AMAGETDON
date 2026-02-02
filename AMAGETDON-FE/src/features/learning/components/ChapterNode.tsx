import { useState } from 'react';
import { Lock, Play, CheckCircle } from 'lucide-react';
import type { ChapterItem } from '../types/learning';
import './ChapterNode.css';

interface ChapterNodeProps {
    chapter: ChapterItem;
    onClick: (chapter: ChapterItem) => void;
}

//챕터 상태에 따른 아이콘을 렌더링하는 컴포넌트
const StatusIcon = ({ status }: { status: ChapterItem['status'] }) => {
    switch (status) {
        case 'COMPLETED':
            return <CheckCircle size={24} strokeWidth={2.5} />;
        case 'AVAILABLE':
            return <Play size={22} fill="currentColor" strokeWidth={0} />;
        case 'LOCKED':
            return <Lock size={20} />;
    }
};

/**
 * 메인 챕터 노드 컴포넌트
 * - 로드맵에서 각 챕터를 나타내는 노드
 * - 상태(완료/진행가능/잠금)에 따라 다른 스타일 적용
 * - 잠긴 챕터는 클릭 불가
 */
export const ChapterNode = ({ chapter, onClick }: ChapterNodeProps) => {
    // LOCKED 상태가 아닐 때만 클릭 가능
    const isClickable = chapter.status !== 'LOCKED';
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="chapter-node-wrapper">
            <button
                className={`chapter-node chapter-node--${chapter.status.toLowerCase()}`}
                onClick={() => isClickable && onClick(chapter)}
                disabled={!isClickable}
                type="button"
                onMouseEnter={() => isClickable && chapter.chapterSummary && setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <div className="chapter-node__circle">
                    <StatusIcon status={chapter.status} />
                </div>
                <div className="chapter-node__info">
                    <span className="chapter-node__label">CHAPTER {chapter.baseChapterNo}</span>
                    <span className="chapter-node__title">{chapter.chapterTitle}</span>
                    {chapter.status === 'AVAILABLE' && chapter.progress && (
                        <div className="chapter-node__progress-bar">
                            <div className="chapter-node__progress-fill" style={{ width: '50%' }} />
                        </div>
                    )}
                </div>
            </button>
            {showTooltip && chapter.chapterSummary && (
                <div className="chapter-node__tooltip">{chapter.chapterSummary}</div>
            )}
        </div>
    );
};
