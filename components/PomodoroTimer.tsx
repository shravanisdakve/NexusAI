import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Zap, Volume2, VolumeX, CheckCircle2, Circle, Info } from 'lucide-react';
import { Button } from './ui';
import { recordPomodoroCycle } from '../services/analyticsService';

interface Task {
    id: string;
    title: string;
    completed: boolean;
    dayIndex?: number;
    courseId?: string;
}

interface PomodoroTimerProps {
    tasks?: Task[];
    onTaskComplete?: (task: Task) => void;
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ tasks = [], onTaskComplete }) => {
    const [seconds, setSeconds] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<TimerMode>('focus');
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');

    // Audio Context Ref
    const audioContextRef = useRef<AudioContext | null>(null);

    const playNotificationSound = useCallback(() => {
        if (!soundEnabled) return;

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContextRef.current;
        if (!ctx) return;

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
    }, [soundEnabled]);

    const getInitialSeconds = (m: TimerMode) => {
        switch (m) {
            case 'focus': return 25 * 60;
            case 'shortBreak': return 5 * 60;
            case 'longBreak': return 15 * 60;
            default: return 25 * 60;
        }
    };

    const toggleTimer = () => setIsActive(!isActive);

    const switchMode = useCallback((newMode: TimerMode) => {
        setMode(newMode);
        setSeconds(getInitialSeconds(newMode));
        setIsActive(false);
    }, []);

    const handleAutoSwitch = useCallback(() => {
        if (mode === 'focus') {
            const nextSessionCount = sessionsCompleted + 1;
            setSessionsCompleted(nextSessionCount);
            recordPomodoroCycle();

            if (nextSessionCount % 4 === 0) {
                switchMode('longBreak');
            } else {
                switchMode('shortBreak');
            }
        } else {
            switchMode('focus');
        }
        playNotificationSound();
    }, [mode, sessionsCompleted, switchMode, playNotificationSound]);

    const resetTimer = useCallback(() => {
        setIsActive(false);
        setSeconds(getInitialSeconds(mode));
    }, [mode]);

    const resetSessionProgress = () => {
        setSessionsCompleted(0);
        switchMode('focus');
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds((prev) => prev - 1);
            }, 1000);
        } else if (seconds === 0 && isActive) {
            setIsActive(false);
            handleAutoSwitch();
        }

        return () => clearInterval(interval);
    }, [isActive, seconds, handleAutoSwitch]);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const totalSeconds = getInitialSeconds(mode);
    const progress = ((totalSeconds - seconds) / totalSeconds) * 100;

    const handleTaskCheck = (task: Task) => {
        if (onTaskComplete) {
            onTaskComplete(task);
        }
    };

    const availableTasks = tasks.filter(t => !t.completed);

    return (
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-slate-700/50 flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden group hover:ring-slate-600 transition-all w-full max-w-sm mx-auto">
            {/* Background Gradient/Glow */}
            <div className={`absolute top-0 left-0 w-full h-1 transition-all duration-1000 ${mode === 'focus' ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' :
                mode === 'shortBreak' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                    'bg-gradient-to-r from-blue-400 to-indigo-500'}`}>
            </div>

            <div className="w-full flex justify-between items-center z-10">
                <div className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white ${mode === 'focus' ? 'bg-violet-600/20 text-violet-300' :
                    mode === 'shortBreak' ? 'bg-emerald-600/20 text-emerald-300' :
                        'bg-blue-600/20 text-blue-300'}`}>
                    {mode === 'focus' ? (
                        <span className="flex items-center gap-1.5"><Zap size={10} className="fill-current" /> Focus Mode</span>
                    ) : mode === 'shortBreak' ? (
                        <span className="flex items-center gap-1.5"><Coffee size={10} className="fill-current" /> Short Break</span>
                    ) : (
                        <span className="flex items-center gap-1.5"><Info size={10} className="fill-current" /> Long Break</span>
                    )}
                </div>

                <div className="flex gap-2">
                    <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5" title={soundEnabled ? "Mute" : "Unmute"}>
                        {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    </button>
                    <button onClick={resetSessionProgress} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5" title="Reset Sessions">
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>

            {/* Session Progress Dots */}
            <div className="flex gap-2 z-10">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all duration-500 ${(sessionsCompleted % 4 >= i || (sessionsCompleted > 0 && sessionsCompleted % 4 === 0))
                            ? 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]'
                            : 'bg-slate-700'
                            }`}
                    />
                ))}
                <span className="text-[10px] text-slate-500 font-mono ml-1">Session {sessionsCompleted + 1}</span>
            </div>

            {/* Task Selector */}
            {tasks.length > 0 && mode === 'focus' && (
                <div className="w-full z-10 animate-in fade-in slide-in-from-top-2 duration-300">
                    <select
                        value={selectedTaskId}
                        onChange={(e) => setSelectedTaskId(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 focus:ring-violet-500 focus:border-violet-500 transition-all"
                    >
                        <option value="">-- Active Study Goal --</option>
                        {availableTasks.map(task => (
                            <option key={task.id} value={task.id}>{task.title}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Selected Task Display */}
            {selectedTaskId && mode === 'focus' && (
                <div className="flex items-center gap-3 w-full bg-violet-600/5 p-3 rounded-xl border border-violet-500/20 animate-in zoom-in-95 duration-300">
                    <button
                        onClick={() => {
                            const task = tasks.find(t => t.id === selectedTaskId);
                            if (task) handleTaskCheck(task);
                            setSelectedTaskId('');
                        }}
                        className="text-violet-400 hover:text-emerald-400 transition-colors"
                        title="Mark as Done"
                    >
                        <Circle size={18} />
                    </button>
                    <span className="text-xs font-medium text-slate-300 line-clamp-1 flex-1">
                        {tasks.find(t => t.id === selectedTaskId)?.title}
                    </span>
                </div>
            )}

            {/* Timer Display */}
            <div className="relative z-10 py-2 text-center w-full">
                <div className={`text-7xl font-black tabular-nums tracking-tighter filter drop-shadow-lg transition-colors duration-1000 ${mode === 'focus' ? 'text-white' : 'text-emerald-400'
                    }`}>
                    {formatTime(seconds)}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-900/50 rounded-full mt-6 overflow-hidden border border-white/5">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-linear ${mode === 'focus' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500' :
                            mode === 'shortBreak' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                                'bg-gradient-to-r from-blue-500 to-indigo-400'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Main Controls */}
            <div className="flex gap-3 w-full z-10">
                <Button
                    onClick={toggleTimer}
                    variant={isActive ? 'outline' : 'primary'}
                    className={`flex-[2] h-14 text-base font-bold shadow-xl transition-all active:scale-95 ${isActive
                        ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                        : mode === 'focus'
                            ? 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/25 ring-1 ring-violet-400/50'
                            : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25 ring-1 ring-emerald-400/50'
                        }`}
                >
                    {isActive ? (
                        <span className="flex items-center gap-2 animate-in fade-in duration-300"><Pause size={20} fill="currentColor" /> Pause</span>
                    ) : (
                        <span className="flex items-center gap-2 animate-in fade-in duration-300"><Play size={20} fill="currentColor" /> {mode === 'focus' ? 'Start Focus' : 'Start Break'}</span>
                    )}
                </Button>

                <Button
                    onClick={resetTimer}
                    variant="secondary"
                    className="flex-1 h-14 p-0 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/30 transition-all font-semibold"
                >
                    Reset
                </Button>
            </div>

            {/* Quick Switch */}
            <div className="flex gap-2 w-full z-10 pt-2">
                <button
                    onClick={() => switchMode('focus')}
                    className={`flex-1 text-[10px] font-bold py-2 rounded-lg transition-all ${mode === 'focus' ? 'bg-violet-600/20 text-violet-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Focus
                </button>
                <button
                    onClick={() => switchMode('shortBreak')}
                    className={`flex-1 text-[10px] font-bold py-2 rounded-lg transition-all ${mode === 'shortBreak' ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Short
                </button>
                <button
                    onClick={() => switchMode('longBreak')}
                    className={`flex-1 text-[10px] font-bold py-2 rounded-lg transition-all ${mode === 'longBreak' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Long
                </button>
            </div>
        </div>
    );
};

export default PomodoroTimer;
