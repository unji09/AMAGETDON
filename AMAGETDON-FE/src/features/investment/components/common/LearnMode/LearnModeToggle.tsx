import { GraduationCap } from 'lucide-react';
import { useLearnMode } from '../../../contexts/LearnModeContext';
import './LearnModeToggle.css';

export const LearnModeToggle = () => {
    const { isLearnMode, toggleLearnMode } = useLearnMode();

    return (
        <button
            type="button"
            className={`learn-mode-toggle ${isLearnMode ? 'learn-mode-toggle--active' : ''}`}
            onClick={toggleLearnMode}
            title={isLearnMode ? '학습 모드 끄기' : '학습 모드 켜기'}
        >
            <GraduationCap size={18} />
            <span>학습 모드</span>
            <span className="learn-mode-toggle__badge">{isLearnMode ? 'ON' : 'OFF'}</span>
        </button>
    );
};
