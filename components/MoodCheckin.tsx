import React, { useState } from 'react';
import { recordMood } from '../services/personalizationService';
import { type MoodLabel } from '../types';
import { motion } from 'framer-motion';
import { useToast } from '../contexts/ToastContext';

const moods: { emoji: string; name: MoodLabel; selectedBg: string; selectedText: string }[] = [
    { emoji: '😄', name: 'Happy',      selectedBg: 'bg-emerald-500/15 border-emerald-400/40', selectedText: 'text-emerald-300' },
    { emoji: '😌', name: 'Calm',       selectedBg: 'bg-sky-500/15 border-sky-400/40',        selectedText: 'text-sky-300' },
    { emoji: '😤', name: 'Overwhelmed',selectedBg: 'bg-amber-500/15 border-amber-400/40',    selectedText: 'text-amber-300' },
    { emoji: '😔', name: 'Sad',        selectedBg: 'bg-indigo-500/15 border-indigo-400/40',  selectedText: 'text-indigo-300' },
    { emoji: '😡', name: 'Angry',      selectedBg: 'bg-rose-500/15 border-rose-400/40',      selectedText: 'text-rose-300' },
];

interface MoodCheckinProps {
    onMoodSelect: (mood: MoodLabel) => void;
}

const MoodCheckin: React.FC<MoodCheckinProps> = ({ onMoodSelect }) => {
    const [selected, setSelected] = useState<MoodLabel | null>(() => {
        const trend = JSON.parse(localStorage.getItem('nexus_mood_trend') || '[]');
        if (trend.length > 0) {
            const last = trend[trend.length - 1];
            if (Date.now() - last.timestamp < 24 * 60 * 60 * 1000) {
                return last.mood as MoodLabel;
            }
        }
        return null;
    });

    const { showToast } = useToast();

    const handleMoodClick = (mood: MoodLabel) => {
        if (selected === mood) return;
        setSelected(mood);
        recordMood({ label: mood });
        onMoodSelect(mood);
        showToast(`Mood logged: ${mood}`, 'success');
        const trend = JSON.parse(localStorage.getItem('nexus_mood_trend') || '[]');
        trend.push({ mood, timestamp: Date.now() });
        localStorage.setItem('nexus_mood_trend', JSON.stringify(trend.slice(-10)));
    };

    return (
        <div className="flex items-center gap-1.5">
            {moods.map(({ emoji, name, selectedBg, selectedText }) => {
                const isActive = selected === name;
                return (
                    <motion.button
                        key={name}
                        onClick={() => handleMoodClick(name)}
                        whileHover={{ scale: 1.15, y: -2 }}
                        whileTap={{ scale: 0.92 }}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                            isActive
                                ? `${selectedBg} shadow-sm`
                                : 'border-white/[0.05] bg-slate-900/40 hover:border-white/10 hover:bg-slate-800/60'
                        }`}
                        aria-label={`Select mood: ${name}`}
                        aria-pressed={isActive}
                    >
                        {/* Emoji — larger and filter-controlled */}
                        <span
                            className={`text-lg leading-none transition-all duration-200 ${
                                isActive ? '' : 'grayscale opacity-50'
                            }`}
                        >
                            {emoji}
                        </span>
                        {/* Label — only show when selected for compactness */}
                        <span
                            className={`text-[9px] font-semibold leading-none transition-colors ${
                                isActive ? selectedText : 'text-slate-600'
                            }`}
                        >
                            {name.slice(0, 3)}
                        </span>
                        {/* Active dot indicator */}
                        {isActive && (
                            <motion.span
                                layoutId="mood-active-dot"
                                className="w-1 h-1 rounded-full bg-current mt-0.5"
                            />
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
};

export default MoodCheckin;
