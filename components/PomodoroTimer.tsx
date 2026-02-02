import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee, Zap } from 'lucide-react';
import { Button } from './ui';
import { recordPomodoroCycle } from '../services/analyticsService';

const PomodoroTimer: React.FC = () => {
    const [seconds, setSeconds] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'study' | 'break'>('study');

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = useCallback(() => {
        setIsActive(false);
        setSeconds(mode === 'study' ? 25 * 60 : 5 * 60);
    }, [mode]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds((prev) => prev - 1);
            }, 1000);
        } else if (seconds === 0) {
            if (mode === 'study') {
                recordPomodoroCycle();
                alert("Session complete! Time for a break.");
                setMode('break');
                setSeconds(5 * 60);
            } else {
                alert("Break over! Let's focus again.");
                setMode('study');
                setSeconds(25 * 60);
            }
            setIsActive(false);
        }

        return () => clearInterval(interval);
    }, [isActive, seconds, mode]);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-slate-800/80 rounded-2xl p-6 ring-1 ring-slate-700 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                {mode === 'study' ? (
                    <span className="text-sky-400 flex items-center gap-1"><Zap size={14} /> Focus Session</span>
                ) : (
                    <span className="text-emerald-400 flex items-center gap-1"><Coffee size={14} /> Short Break</span>
                )}
            </div>

            <div className="text-5xl font-black text-white tabular-nums">
                {formatTime(seconds)}
            </div>

            <div className="flex gap-2">
                <Button onClick={toggleTimer} variant={isActive ? 'outline' : 'default'} className="w-24">
                    {isActive ? <Pause size={20} /> : <Play size={20} />}
                </Button>
                <Button onClick={resetTimer} variant="ghost" className="text-slate-400">
                    <RotateCcw size={20} />
                </Button>
            </div>
        </div>
    );
};

export default PomodoroTimer;
