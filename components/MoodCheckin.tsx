import React, { useState } from 'react';
import { recordMood } from '../services/personalizationService';
import { type MoodLabel } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../contexts/ToastContext';

const moods: { emoji: string; name: MoodLabel }[] = [
    { emoji: '😊', name: 'Happy' },
    { emoji: '😌', name: 'Calm' },
    { emoji: '🤯', name: 'Overwhelmed' },
    { emoji: '😥', name: 'Sad' },
    { emoji: '😡', name: 'Angry' },
];

interface MoodCheckinProps {
    onMoodSelect: (mood: MoodLabel) => void;
}

const MoodCheckin: React.FC<MoodCheckinProps> = ({ onMoodSelect }) => {
    const [selectedMood, setSelectedMood] = useState<MoodLabel | null>(() => {
        // Initial state from localStorage to ensure persistence on reload
        const trend = JSON.parse(localStorage.getItem('nexus_mood_trend') || '[]');
        if (trend.length > 0) {
            const lastEntry = trend[trend.length - 1];
            // If it's from today, pre-select it
            if (Date.now() - lastEntry.timestamp < 24 * 60 * 60 * 1000) {
                return lastEntry.mood as MoodLabel;
            }
        }
        return null;
    });
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const { showToast } = useToast();

    const handleMoodClick = (mood: MoodLabel) => {
        if (selectedMood === mood) return;
        
        setSelectedMood(mood);
        const moodObj = moods.find(m => m.name === mood);
        recordMood({ label: mood, emoji: moodObj?.emoji });
        onMoodSelect(mood);
        
        showToast(`Registered: ${moodObj?.emoji || ''} ${mood}. Keep up the great work! ✨`, 'success');

        // Intervention Logic
        if (mood === 'Overwhelmed') {
            setSuggestion("Take a 5-min guided breath. Break your target into 3 micro-tasks.");
        } else if (mood === 'Sad') {
            setSuggestion("Remember, progress isn't linear. Try a 2-min 'Flashcard' session to keep the momentum.");
        } else if (mood === 'Angry') {
            setSuggestion("Channel that energy! Solve one difficult 'Numerical' problem then take a break.");
        } else {
            setSuggestion(null);
        }
        
        // Persist to localStorage for "Mood Trend" (already handled by services, but double-down here)
        const trend = JSON.parse(localStorage.getItem('nexus_mood_trend') || '[]');
        trend.push({ mood, timestamp: Date.now() });
        localStorage.setItem('nexus_mood_trend', JSON.stringify(trend.slice(-10))); // keep last 10
    };

    return (
        <div className="bg-slate-800 rounded-xl p-8 border border-white/10 shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-16 bg-violet-500/5 blur-[50px] rounded-full group-hover:bg-violet-500/10 transition-colors duration-700"></div>

            <h3 className="text-sm font-black text-slate-500 mb-8 text-center uppercase tracking-[0.3em] font-sans">
                Vibe Check
            </h3>

            <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-2xl border border-white/5 backdrop-blur-sm relative">
                {moods.map(({ emoji, name }) => {
                    const isActive = selectedMood === name;
                    return (
                        <motion.button
                            key={name}
                            onClick={() => handleMoodClick(name)}
                            whileHover={{ scale: 1.15, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            animate={isActive ? { scale: 1.25 } : { scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            className={`relative w-14 h-14 flex items-center justify-center rounded-3xl transition-all duration-500 ${isActive
                                ? 'bg-indigo-600 shadow-[0_0_30px_rgba(79,70,229,0.5)] ring-2 ring-indigo-400 border-2 border-white/30 z-10'
                                : 'hover:bg-slate-800 text-slate-400 grayscale-[0.4] hover:grayscale-0'
                                }`}
                            aria-label={`Select mood: ${name}`}
                        >
                            <span className="text-3xl relative z-10">
                                {emoji}
                            </span>
                            
                            {isActive && (
                                <motion.div
                                    layoutId="mood-active-ring"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: [1, 1.4, 1.2], opacity: [0, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 rounded-3xl border-2 border-indigo-400/50"
                                />
                            )}
                            
                            {isActive && (
                                <motion.span 
                                    layoutId="mood-active-glow"
                                    className="absolute inset-0 bg-white/20 rounded-3xl blur-md"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <AnimatePresence>
                {suggestion && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/20 border-dashed">
                                    <motion.div
                                        animate={{ rotate: [0, 15, -15, 0] }}
                                        transition={{ repeat: Infinity, duration: 4 }}
                                    >
                                        <span className="text-indigo-400 text-sm font-bold">✨</span>
                                    </motion.div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1.5 opacity-80">Nexus Suggestion</p>
                                    <p className="text-sm text-slate-200 leading-relaxed font-medium">{suggestion}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MoodCheckin;
