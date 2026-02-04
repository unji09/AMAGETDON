import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface LearnModeContextType {
    isLearnMode: boolean;
    activeSpotlight: string | null;
    toggleLearnMode: () => void;
    setActiveSpotlight: (id: string | null) => void;
}

const LearnModeContext = createContext<LearnModeContextType | null>(null);

export const LearnModeProvider = ({ children }: { children: ReactNode }) => {
    const [isLearnMode, setIsLearnMode] = useState(false);
    const [activeSpotlight, setActiveSpotlight] = useState<string | null>(null);

    const toggleLearnMode = useCallback(() => {
        setIsLearnMode((prev) => {
            if (prev) setActiveSpotlight(null);
            return !prev;
        });
    }, []);

    return (
        <LearnModeContext.Provider
            value={{ isLearnMode, activeSpotlight, toggleLearnMode, setActiveSpotlight }}
        >
            {children}
        </LearnModeContext.Provider>
    );
};

export const useLearnMode = () => {
    const context = useContext(LearnModeContext);
    if (!context) {
        throw new Error('useLearnMode must be used within LearnModeProvider');
    }
    return context;
};
