import React, { useState } from 'react';

interface FlashcardProps {
  front: string;
  back: string;
  onFlip?: (isFlipped: boolean) => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ front, back, onFlip }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    const newState = !isFlipped;
    setIsFlipped(newState);
    if (onFlip) onFlip(newState);
  };

  return (
    <div
      className="w-full aspect-[3/2] perspective-1000 cursor-pointer group"
      onClick={handleFlip}
    >
      <div
        className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 shadow-xl flex items-center justify-center p-6 text-center">
          <p className="text-lg font-medium text-slate-100 select-none">{front}</p>
          <div className="absolute bottom-3 right-3 text-xs text-slate-500">Tap to flip</div>
        </div>

        {/* Back */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-xl bg-gradient-to-br from-violet-900 to-indigo-900 border border-violet-500/50 shadow-xl shadow-violet-900/20 flex items-center justify-center p-6 text-center">
          <p className="text-lg font-medium text-white select-none">{back}</p>
          <div className="absolute bottom-3 right-3 text-xs text-violet-300/50">Tap to flip back</div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
