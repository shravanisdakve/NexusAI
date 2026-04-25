import React, { useState } from 'react';
import { History } from 'lucide-react';

interface FlashcardProps {
  front: string;
  back: string;
  isFlagged?: boolean;
  onFlip?: (isFlipped: boolean) => void;
  onFlag?: () => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ front, back, isFlagged, onFlip, onFlag }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    const newState = !isFlipped;
    setIsFlipped(newState);
    if (onFlip) onFlip(newState);
  };

  return (
    <div
      className="w-full aspect-[3/2] [perspective:1000px] cursor-pointer group active:scale-[0.98] transition-all relative"
      onClick={handleFlip}
    >
      {onFlag && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFlag();
          }}
          className={`absolute -top-1 -right-1 z-30 w-7 h-7 rounded-full flex items-center justify-center transition-all border shadow-lg ${
            isFlagged 
              ? 'bg-amber-500 border-amber-400 text-white shadow-amber-500/20' 
              : 'bg-slate-900 border-white/10 text-slate-500 hover:text-white hover:border-violet-500/50'
          }`}
          title="Flag for Review"
        >
          <History size={12} className={isFlagged ? 'animate-pulse' : ''} />
        </button>
      )}

      <div
        className={`relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        {/* Front */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 shadow-xl flex flex-col p-5 text-center overflow-hidden">
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <p className="text-xs sm:text-sm font-bold text-slate-100 select-none tracking-tight leading-relaxed overflow-y-auto max-h-full pr-1 no-scrollbar break-words">
              {front}
            </p>
          </div>
          <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-slate-500 opacity-40 shrink-0">QUESTION</div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 border border-violet-400/30 shadow-xl flex flex-col p-5 text-center overflow-hidden">
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <p className="text-xs sm:text-sm font-bold text-white select-none tracking-tight leading-relaxed overflow-y-auto max-h-full pr-1 no-scrollbar break-words">
              {back}
            </p>
          </div>
          <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-violet-200 opacity-60 shrink-0">ANSWER</div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
