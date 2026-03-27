import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type AppMode = 'study' | 'placement';

interface ModeContextType {
    mode: AppMode;
    setMode: (mode: AppMode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const location = useLocation();
    const [mode, setMode] = useState<AppMode>('study');

    useEffect(() => {
        const path = location.pathname || '';
        if (path.includes('/placement') || path.includes('/resume-builder') || path.includes('/interview') || path.includes('/practice-hub') || path.includes('/company-hub') || path.includes('/learning-resources')) {
            setMode('placement');
        } else {
            setMode('study');
        }
    }, [location]);

    return (
        <ModeContext.Provider value={{ mode, setMode }}>
            {children}
        </ModeContext.Provider>
    );
};

export const useMode = () => {
    const context = useContext(ModeContext);
    if (context === undefined) {
        throw new Error('useMode must be used within a ModeProvider');
    }
    return context;
};
