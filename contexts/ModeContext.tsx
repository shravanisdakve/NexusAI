import React, { createContext, useContext, useState, ReactNode } from 'react';

type AppMode = 'study' | 'placement';

interface ModeContextType {
    mode: AppMode;
    setMode: (mode: AppMode) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<AppMode>(() => {
        const path = typeof window !== 'undefined' ? window.location.hash || window.location.pathname : '';
        if (path.includes('/placement') || path.includes('/resume-builder') || path.includes('/interview')) {
            return 'placement';
        }
        return 'study';
    });

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
