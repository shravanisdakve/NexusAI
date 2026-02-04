import React from 'react';
import { Trophy, Zap, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface XPBarProps {
    xp: number;
    level: number;
    nextLevelXP: number;
}

export const XPBar: React.FC<XPBarProps> = ({ xp, level, nextLevelXP }) => {
    const minXP = level === 1 ? 0 : 500 * level * (level - 1);
    const range = nextLevelXP - minXP;
    const currentProgress = xp - minXP;
    const progress = Math.min(Math.max((currentProgress / range) * 100, 0), 100);

    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                        {level}
                    </div>
                    <span className="text-sm font-bold text-slate-200">Level Explorer</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{xp} / {nextLevelXP} XP</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                />
            </div>
        </div>
    );
};


export const StreakCounter: React.FC<{ streak: number }> = ({ streak }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
        <Zap className="w-4 h-4 fill-amber-500" />
        <span className="text-sm font-black">{streak} DAY STREAK</span>
    </div>
);

export const BadgeSmall: React.FC<{ name: string; icon?: React.ReactNode }> = ({ name, icon }) => (
    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group hover:border-amber-500/50 hover:text-amber-400 transition-all cursor-help relative">
        {icon || <Star className="w-5 h-5" />}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
            {name}
        </div>
    </div>
);
