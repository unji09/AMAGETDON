import { Clock, Banknote, Rocket } from 'lucide-react';
import { Modal } from '@/components/common';
import { Button } from '@/components/common';
import type { ChapterItem } from '../../types/learning.ts';
import './ChapterDetailModal.css';

interface ChapterDetailModalProps {
    chapter: ChapterItem | null;
    isOpen: boolean;
    onClose: () => void;
    onStartLearning: (chapterId: number) => void;
}

/**
 * 챕터 상세 정보를 보여주는 모달 컴포넌트
 * - 챕터 번호, 제목, 요약 정보 표시
 * - 소요 시간, 보상, 통과 기준 등 메타 정보 표시
 * - 학습 시작 버튼 제공
 */
export const ChapterDetailModal = ({ chapter, isOpen, onClose, onStartLearning }: ChapterDetailModalProps) => {
    // 챕터 정보가 없으면 랜더링 X
    if (!chapter) return null;

    // NORMAL 타입 여부 확인 및 보상 표시
    const isNormal = chapter.chapterType === 'NORMAL';
    const reward = isNormal ? '300,000' : '100,000';

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="chapter-detail">
                <div className="chapter-detail__badge">
                    CHAPTER {chapter.baseChapterNo}
                </div>
                <h2 className="chapter-detail__title">{chapter.chapterTitle}</h2>
                <p className="chapter-detail__summary">{chapter.chapterSummary}</p>

                <div className="chapter-detail__meta">
                    <div className="chapter-detail__meta-item">
                        <span className="chapter-detail__meta-label">소요 시간</span>
                        <span className="chapter-detail__meta-value">
                            <Clock size={16} className="chapter-detail__meta-icon" />
                            15분
                        </span>
                    </div>
                    <div className="chapter-detail__meta-divider" />
                    <div className="chapter-detail__meta-item">
                        <span className="chapter-detail__meta-label">보상</span>
                        <span className="chapter-detail__meta-value">
                            <Banknote size={16} className="chapter-detail__meta-icon" />
                            {reward}원
                        </span>
                    </div>
                    <div className="chapter-detail__meta-divider" />
                    <div className="chapter-detail__meta-item">
                        <span className="chapter-detail__meta-label">통과 기준</span>
                        <span className="chapter-detail__meta-value">60% 정답</span>
                    </div>
                </div>

                <Button
                    variant="primary"
                    size="large"
                    fullWidth
                    onClick={() => onStartLearning(chapter.chapterId)}
                >
                    학습 시작하기 <Rocket size={18} />
                </Button>
            </div>
        </Modal>
    );
};
