import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Zap, Volume2, VolumeX, CheckCircle2, Circle } from 'lucide-react';
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

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ tasks = [], onTaskComplete }) => {
    const [seconds, setSeconds] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'study' | 'break'>('study');
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
        // Check if context is valid
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5); // Drop to A4

        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    }, [soundEnabled]);

    const toggleTimer = () => setIsActive(!isActive);

    const switchMode = useCallback(() => {
        const newMode = mode === 'study' ? 'break' : 'study';
        setMode(newMode);
        setSeconds(newMode === 'study' ? 25 * 60 : 5 * 60);
        setIsActive(false);
    }, [mode]);

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
        } else if (seconds === 0 && isActive) { // Only trigger if it WAS active
            setIsActive(false);
            playNotificationSound();
            recordPomodoroCycle();
        }

        return () => clearInterval(interval);
    }, [isActive, seconds, mode, playNotificationSound]);

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = mode === 'study'
        ? ((25 * 60 - seconds) / (25 * 60)) * 100
        : ((5 * 60 - seconds) / (5 * 60)) * 100;

    const handleTaskCheck = (task: Task) => {
        if (onTaskComplete) {
            onTaskComplete(task);
        }
    };

    // Filter incomplete tasks for selection
    const availableTasks = tasks.filter(t => !t.completed);

    return (
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-slate-700/50 flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden group hover:ring-slate-600 transition-all">
            {/* Background Gradient/Glow */}
            <div className={`absolute top-0 left-0 w-full h-1 transition-all duration-1000 ${mode === 'study' ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}></div>

            <div className="w-full flex justify-between items-center z-10">
                <div className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-md text-white ${mode === 'study' ? 'bg-violet-600/20' : 'bg-emerald-600/20'}`}>
                    {mode === 'study' ? (
                        <span className="flex items-center gap-1.5 text-violet-300"><Zap size={12} className="fill-current" /> Focus</span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-emerald-300"><Coffee size={12} className="fill-current" /> Break</span>
                    )}
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/5" title={soundEnabled ? "Mute" : "Unmute"}>
                        {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    </button>
                </div>
            </div>

            {/* Task Selector */}
            {tasks.length > 0 && mode === 'study' && (
                <div className="w-full z-10">
                    <select
                        value={selectedTaskId}
                        onChange={(e) => setSelectedTaskId(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-slate-300 focus:ring-violet-500 focus:border-violet-500"
                    >
                        <option value="">-- Select Goal from Study Plan --</option>
                        {availableTasks.map(task => (
                            <option key={task.id} value={task.id}>{task.title}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Selected Task Display */}
            {selectedTaskId && (
                <div className="flex items-center gap-3 w-full bg-slate-900/30 p-3 rounded-lg border border-slate-700/50">
                    <button
                        onClick={() => {
                            const task = tasks.find(t => t.id === selectedTaskId);
                            if (task) handleTaskCheck(task);
                        }}
                        className="text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Mark as Done"
                    >
                        <Circle size={20} />
                    </button>
                    <span className="text-sm font-medium text-slate-200 line-clamp-1 flex-1">
                        {tasks.find(t => t.id === selectedTaskId)?.title}
                    </span>
                </div>
            )}


            {/* Timer Display */}
            <div className="relative z-10 py-2 text-center">
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tabular-nums tracking-tight filter drop-shadow-sm">
                    {formatTime(seconds)}
                </div>
                {/* Progress Bar Underneath */}
                <div className="w-full h-1.5 bg-slate-700/50 rounded-full mt-4 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-linear ${mode === 'study' ? 'bg-violet-500' : 'bg-emerald-500'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3 z-10 w-full justify-center">
                <Button
                    onClick={switchMode}
                    variant="ghost"
                    className="flex-1 text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-slate-700"
                    size="sm"
                >
                    {mode === 'study' ? 'Skip to Break' : 'Skip to Focus'}
                </Button>
            </div>

            <div className="flex gap-3 w-full z-10">
                <Button
                    onClick={toggleTimer}
                    variant={isActive ? 'outline' : 'default'}
                    className={`flex-1 h-12 text-base font-semibold shadow-lg transition-all ${isActive
                        ? 'border-slate-600 text-slate-200 hover:bg-slate-800'
                        : mode === 'study'
                            ? 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/25'
                            : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
                        }`}
                >
                    {isActive ? <span className="flex items-center gap-2"><Pause size={18} fill="currentColor" /> Pause</span> : <span className="flex items-center gap-2"><Play size={18} fill="currentColor" /> Start</span>}
                </Button>

                <Button
                    onClick={resetTimer}
                    variant="secondary"
                    className="w-12 h-12 p-0 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/30"
                >
                    <RotateCcw size={18} />
                </Button>
            </div>
        </div>
    );
};

export default PomodoroTimer;
