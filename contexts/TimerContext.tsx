import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { recordPomodoroCycle } from '../services/analyticsService';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface TimerState {
    seconds: number;
    isActive: boolean;
    mode: TimerMode;
    sessionsCompleted: number;
    soundEnabled: boolean;
}

interface TimerContextType extends TimerState {
    setSeconds: (s: number) => void;
    setIsActive: (a: boolean) => void;
    setMode: (m: TimerMode) => void;
    setSessionsCompleted: (n: number) => void;
    setSoundEnabled: (s: boolean) => void;
    toggleTimer: () => void;
    resetTimer: () => void;
    switchMode: (m: TimerMode) => void;
    playNotificationSound: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (!context) throw new Error('useTimer must be used within a TimerProvider');
    return context;
};

const getInitialSeconds = (m: TimerMode) => {
    switch (m) {
        case 'focus': return 25 * 60;
        case 'shortBreak': return 5 * 60;
        case 'longBreak': return 15 * 60;
        default: return 25 * 60;
    }
};

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [seconds, setSeconds] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<TimerMode>('focus');
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);

    const audioContextRef = useRef<AudioContext | null>(null);

    const playNotificationSound = useCallback(() => {
        if (!soundEnabled) return;
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {
            console.warn("Audio feedback failed:", e);
        }
    }, [soundEnabled]);

    const switchMode = useCallback((newMode: TimerMode) => {
        setMode(newMode);
        setSeconds(getInitialSeconds(newMode));
        setIsActive(false);
    }, []);

    const toggleTimer = useCallback(() => setIsActive(prev => !prev), []);

    const resetTimer = useCallback(() => {
        setIsActive(false);
        setSeconds(getInitialSeconds(mode));
    }, [mode]);

    useEffect(() => {
        // Load persisted state on mount
        const savedState = localStorage.getItem('nexus_timer_state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                setMode(parsed.mode || 'focus');
                setSessionsCompleted(parsed.sessionsCompleted || 0);
                setSoundEnabled(parsed.soundEnabled !== false);
                
                // If it was active, calculate elapsed time
                if (parsed.isActive && parsed.lastTimestamp) {
                    const elapsedSinceExit = Math.floor((Date.now() - parsed.lastTimestamp) / 1000);
                    const remainingSeconds = Math.max(0, (parsed.seconds || 0) - elapsedSinceExit);
                    setSeconds(remainingSeconds);
                    // Only resume if there's time left
                    if (remainingSeconds > 0) {
                        setIsActive(true);
                    }
                } else {
                    setSeconds(parsed.seconds || getInitialSeconds(parsed.mode || 'focus'));
                    setIsActive(false);
                }
            } catch (e) {
                console.error("Failed to restore timer state:", e);
                setSeconds(getInitialSeconds('focus'));
            }
        } else {
            setSeconds(getInitialSeconds('focus'));
        }
    }, []);

    // Persist state to localStorage whenever it changes
    useEffect(() => {
        const stateToSave = {
            seconds,
            isActive,
            mode,
            sessionsCompleted,
            soundEnabled,
            lastTimestamp: Date.now()
        };
        localStorage.setItem('nexus_timer_state', JSON.stringify(stateToSave));
    }, [seconds, isActive, mode, sessionsCompleted, soundEnabled]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds((prev) => prev - 1);
            }, 1000);
        } else if (seconds === 0 && isActive) {
            setIsActive(false);
            
            // Auto switch logic
            if (mode === 'focus') {
                const nextSessionCount = sessionsCompleted + 1;
                setSessionsCompleted(nextSessionCount);
                recordPomodoroCycle();
                if (nextSessionCount % 4 === 0) {
                    setMode('longBreak');
                    setSeconds(getInitialSeconds('longBreak'));
                } else {
                    setMode('shortBreak');
                    setSeconds(getInitialSeconds('shortBreak'));
                }
            } else {
                setMode('focus');
                setSeconds(getInitialSeconds('focus'));
            }
            playNotificationSound();
        }

        return () => clearInterval(interval);
    }, [isActive, seconds, mode, sessionsCompleted, playNotificationSound]);

    return (
        <TimerContext.Provider value={{
            seconds, isActive, mode, sessionsCompleted, soundEnabled,
            setSeconds, setIsActive, setMode, setSessionsCompleted, setSoundEnabled,
            toggleTimer, resetTimer, switchMode, playNotificationSound
        }}>
            {children}
        </TimerContext.Provider>
    );
};
