
import React, { useState, useEffect } from 'react';
import { Timer, CheckCircle2, XCircle, ChevronRight, RotateCcw, Award, Zap, Shield, Flame, Target } from 'lucide-react';
import { Button } from '../ui';
import { useToast } from '../../contexts/ToastContext';

interface ChallengeQuestion {
  id: string;
  type: 'mcq' | 'short_answer' | 'code';
  topic: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  timeLimitSeconds?: number;
}

interface AdaptiveChallengeInterfaceProps {
  challengeData: {
    mode: 'speed_drill' | 'streak_mode';
    title: string;
    description: string;
    rules: string[];
    questions: ChallengeQuestion[];
  };
  onClose: () => void;
  onComplete: (stats: { score: number; total: number; accuracy: number }) => void;
}

const AdaptiveChallengeInterface: React.FC<AdaptiveChallengeInterfaceProps> = ({ challengeData, onClose, onComplete }) => {
  const { showToast } = useToast();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    if (challengeData?.questions?.[0]) {
      setTimeLeft(challengeData.questions[0].timeLimitSeconds || 15);
    }
  }, [challengeData]);

  if (!challengeData?.questions || challengeData.questions.length === 0) {
    return (
      <div className="p-12 text-center text-white bg-slate-900 rounded-3xl border border-white/5">
        <h3 className="text-xl font-black mb-4">Incomplete Challenge Sequence</h3>
        <p className="text-slate-400 mb-8">The AI generator failed to synthesize accurate technical challenges for this session.</p>
        <Button onClick={onClose} className="bg-violet-600">Return to Hub</Button>
      </div>
    );
  }

  const currentQ = challengeData.questions[currentIdx];

  useEffect(() => {
    if (isGameOver || showResults || isAnswered) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIdx, isGameOver, showResults, isAnswered]);

  const handleTimeout = () => {
    if (challengeData.mode === 'streak_mode') {
      endGame("Time's up! Streak broken.");
    } else {
      showToast("Time's up for this question!", 'info');
      handleNext();
    }
  };

  const endGame = (reason: string) => {
    setIsGameOver(true);
    showToast(reason, 'error');
    setTimeout(() => setShowResults(true), 1500);
  };

  const handleAnswer = (opt: string) => {
    if (isAnswered || isGameOver) return;
    
    setSelectedOpt(opt);
    setIsAnswered(true);

    const isCorrect = opt === currentQ.correctAnswer;

    if (isCorrect) {
      setScore(s => s + 1);
      setStreak(st => {
        const next = st + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
      showToast("Correct! +10 XP", 'success');
      
      // Auto-transition to next question
      setTimeout(() => {
        if (!isGameOver) handleNext();
      }, 1200);
    } else {
      if (challengeData.mode === 'streak_mode') {
        setStreak(0);
        endGame("Incorrect Answer! Streak terminated.");
        return;
      }
      setStreak(0);
      showToast("Incorrect. Next question incoming...", 'error');
      
      // Auto-transition even on wrong answer for non-streak mode
      setTimeout(() => {
        if (!isGameOver) handleNext();
      }, 1200);
    }
  };

  const handleNext = () => {
    if (currentIdx < challengeData.questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setSelectedOpt(null);
      setIsAnswered(false);
      setTimeLeft(challengeData.questions[nextIdx]?.timeLimitSeconds || 15);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    const accuracy = Math.round((score / challengeData.questions.length) * 100);
    return (
      <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-500">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none"></div>
           <Award className="mx-auto text-yellow-300 mb-2 drop-shadow-2xl" size={32} />
           <h2 className="text-xl font-black text-white mb-1 leading-none uppercase tracking-tighter">Challenge Terminated</h2>
           <p className="text-indigo-200 font-bold uppercase tracking-widest text-[9px] opacity-80">Final Analysis Complete</p>
        </div>

        <div className="p-4 md:p-6 space-y-4">
           <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 text-center">
                 <span className="block text-xl font-black text-white">{score}</span>
                 <p className="text-[7px] uppercase font-black text-slate-500 tracking-widest">Points</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 text-center">
                 <span className="block text-xl font-black text-violet-400">{maxStreak}</span>
                 <p className="text-[7px] uppercase font-black text-slate-500 tracking-widest">Max Streak</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-white/5 text-center">
                 <span className="block text-xl font-black text-emerald-400">{accuracy}%</span>
                 <p className="text-[7px] uppercase font-black text-slate-500 tracking-widest">Accuracy</p>
              </div>
           </div>

           <div className="space-y-4 pt-1">
              <p className="text-center text-xs text-slate-400 italic">
                {accuracy >= 80 ? "Legendary performance. Your neural pathways are optimized." : 
                 accuracy >= 50 ? "Solid effort. More iterations required for mastery." : 
                 "Sub-optimal data. Recommend immediate focused revision."}
              </p>
              <Button onClick={onClose} className="w-full h-10 text-[xs] bg-white text-slate-900 hover:bg-slate-200 font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-white/5">
                Return to Nexus Hub
              </Button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-slate-950 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative">
      {/* Header Info */}
      <div className="px-8 py-3 bg-slate-900/50 border-b border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${challengeData.mode === 'speed_drill' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
               {challengeData.mode === 'speed_drill' ? <Zap size={20} /> : <Flame size={20} />}
            </div>
            <div>
               <h3 className="text-sm font-black text-white uppercase tracking-tight">{challengeData.title}</h3>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{currentIdx + 1} / {challengeData.questions.length} Items</p>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-white/5 px-4 py-2 rounded-2xl flex items-center gap-2">
               <Timer size={14} className={`${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
               <span className={`text-lg font-mono font-black ${timeLeft <= 5 ? 'text-rose-500' : 'text-white'}`}>{timeLeft}s</span>
            </div>
            {challengeData.mode === 'streak_mode' && (
              <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-2xl text-rose-400 flex items-center gap-2">
                 <Flame size={14} className="animate-bounce" />
                 <span className="text-lg font-mono font-black">{streak}</span>
              </div>
            )}
         </div>
      </div>

      <div className="p-5 md:p-6 space-y-4">
         <div className="min-h-[80px]">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-500 mb-2 block">{currentQ.topic}</span>
            <h2 className="text-xl md:text-2xl font-black text-white leading-tight">{currentQ.question}</h2>
         </div>

         <div className="grid gap-2">
            {currentQ.options?.map((opt, i) => {
               const isSelected = selectedOpt === opt;
               const isCorrect = isAnswered && opt === currentQ.correctAnswer;
               const isWrong = isAnswered && isSelected && opt !== currentQ.correctAnswer;

               return (
                  <button
                     key={i}
                     onClick={() => handleAnswer(opt)}
                     disabled={isAnswered || isGameOver}
                     className={`
                        w-full p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group
                        ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-100' : 
                          isWrong ? 'bg-rose-500/10 border-rose-500/50 text-rose-100' :
                          isSelected ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-100' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/20'}
                     `}
                  >
                     <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] transition-colors
                           ${isCorrect ? 'bg-emerald-500 text-white' : 
                             isWrong ? 'bg-rose-500 text-white' :
                             isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}
                        `}>
                           {String.fromCharCode(65+i)}
                        </div>
                        <span className="font-bold flex-1 text-sm">{opt}</span>
                        {isCorrect && <CheckCircle2 size={18} className="text-emerald-500" />}
                        {isWrong && <XCircle size={18} className="text-rose-500" />}
                     </div>
                  </button>
               );
            })}
         </div>

         {/* Auto-progression enabled: Manual button removed for speed */}
      </div>
    </div>
  );
};

export default AdaptiveChallengeInterface;
