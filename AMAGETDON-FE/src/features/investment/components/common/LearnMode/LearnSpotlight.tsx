import { useRef, useState, useEffect, type ReactNode } from 'react';
import { Info, Lightbulb, X } from 'lucide-react';
import { useLearnMode } from '../../../contexts/LearnModeContext';
import { LEARN_DATA } from './learnData';
import './LearnSpotlight.css';

interface LearnSpotlightProps {
    id: string;
    children: ReactNode;
}

export const LearnSpotlight = ({ id, children }: LearnSpotlightProps) => {
    const { isLearnMode, activeSpotlight, setActiveSpotlight } = useLearnMode();
    const ref = useRef<HTMLDivElement>(null);
    const [edge, setEdge] = useState<'left' | 'right' | null>(null);
    const learnItem = LEARN_DATA[id];
    const isActive = activeSpotlight === id;

    // 요소 위치에 따라 edge 자동 감지
    useEffect(() => {
        if (isActive && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const cardWidth = 280;
            const cardHalfWidth = cardWidth / 2;
            const elementCenter = rect.left + rect.width / 2;

            // 카드가 왼쪽으로 넘어가는 경우
            if (elementCenter - cardHalfWidth < 16) {
                setEdge('left');
            }
            // 카드가 오른쪽으로 넘어가는 경우
            else if (elementCenter + cardHalfWidth > viewportWidth - 16) {
                setEdge('right');
            }
            // 중앙에 있는 경우
            else {
                setEdge(null);
            }
        }
    }, [isActive]);

    const handleClick = () => {
        if (!isLearnMode) return;
        setActiveSpotlight(isActive ? null : id);
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveSpotlight(null);
    };

    if (!learnItem) return <>{children}</>;

    const edgeClass = edge ? `learn-spotlight--edge-${edge}` : '';

    return (
        <div
            ref={ref}
            className={`learn-spotlight ${isLearnMode ? 'learn-spotlight--enabled' : ''} ${isActive ? 'learn-spotlight--active' : ''} ${edgeClass}`}
            onClick={handleClick}
        >
            {children}

            {/* 학습 모드일 때 표시되는 힌트 아이콘 */}
            {isLearnMode && !isActive && (
                <div className="learn-spotlight__hint">
                    <Info size={16} />
                </div>
            )}

            {/* 활성화된 설명 카드 */}
            {isActive && (
                <div className="learn-spotlight__card">
                    <button className="learn-spotlight__close" onClick={handleClose}>
                        <X size={16} />
                    </button>
                    <h4 className="learn-spotlight__title">{learnItem.title}</h4>
                    <p className="learn-spotlight__description">{learnItem.description}</p>
                    {learnItem.tip && (
                        <div className="learn-spotlight__tip">
                            <Lightbulb size={14} />
                            <span>{learnItem.tip}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
