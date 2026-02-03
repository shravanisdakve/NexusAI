import React, { useState } from 'react';
import { recordMood } from '../services/personalizationService';
import { type MoodLabel } from '../types';

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
  const [selectedMood, setSelectedMood] = useState<MoodLabel | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleMoodClick = (mood: MoodLabel) => {
    setSelectedMood(mood);
    const moodObj = moods.find(m => m.name === mood);
    recordMood({ label: mood, emoji: moodObj?.emoji });
    onMoodSelect(mood);

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
  };

  return (
    <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-[2rem] ring-1 ring-white/10 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 blur-3xl -z-10"></div>

      <h3 className="text-sm font-black text-slate-400 mb-6 text-center uppercase tracking-[0.2em]">
        Vibe Check
      </h3>

      <div className="flex justify-between items-center bg-slate-900/40 p-2 rounded-full border border-white/5">
        {moods.map(({ emoji, name }) => {
          const isActive = selectedMood === name;
          return (
            <button
              key={name}
              onClick={() => handleMoodClick(name)}
              className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 overflow-hidden ${isActive
                ? 'bg-violet-600 shadow-lg shadow-violet-900/40'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              aria-label={`Select mood: ${name}`}
            >
              <span className={`text-2xl transition-transform duration-500 ${isActive ? 'scale-110' : 'grayscale-[0.5] hover:grayscale-0'}`}>
                {emoji}
              </span>
              {isActive && (
                <span className="absolute inset-0 bg-white/20 animate-ping rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>

      {suggestion && (
        <div className="mt-6 p-4 bg-violet-600/10 border border-violet-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center shrink-0">
              <span className="text-violet-400 text-xs font-bold">N</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-violet-400 tracking-widest mb-1">Nexus Suggestion</p>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">{suggestion}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodCheckin;
