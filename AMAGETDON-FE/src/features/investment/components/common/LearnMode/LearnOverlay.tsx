import { useLearnMode } from '../../../contexts/LearnModeContext';
import './LearnOverlay.css';

export const LearnOverlay = () => {
    const { isLearnMode, activeSpotlight, setActiveSpotlight } = useLearnMode();

    if (!isLearnMode) return null;

    const handleClick = () => {
        if (activeSpotlight) {
            setActiveSpotlight(null);
        }
    };

    return (
        <div
            className={`learn-overlay ${activeSpotlight ? 'learn-overlay--active' : ''}`}
            onClick={handleClick}
        />
    );
};
