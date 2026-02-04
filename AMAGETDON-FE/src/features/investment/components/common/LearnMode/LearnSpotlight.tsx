import { useRef, type ReactNode } from 'react';
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
    const learnItem = LEARN_DATA[id];
    const isActive = activeSpotlight === id;

    const handleClick = () => {
        if (!isLearnMode) return;
        setActiveSpotlight(isActive ? null : id);
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveSpotlight(null);
    };

    if (!learnItem) return <>{children}</>;

    return (
        <div
            ref={ref}
            className={`learn-spotlight ${isLearnMode ? 'learn-spotlight--enabled' : ''} ${isActive ? 'learn-spotlight--active' : ''}`}
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
