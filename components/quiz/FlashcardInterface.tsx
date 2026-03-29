
import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, XCircle, ChevronRight, LayoutGrid, Zap, Shield, Wand2 } from 'lucide-react';
import { Button } from '../ui';
import { useToast } from '../../contexts/ToastContext';

interface Flashcard {
  id: string;
  topic: string;
  front: string;
  back: string;
}

interface ErrorFixItem {
  id: string;
  topic: string;
  brokenStatementOrCode: string;
  task: string;
  solution: string;
}

interface FlashcardInterfaceProps {
  data: {
    title: string;
    flashcards: Flashcard[];
    errorFixItems: ErrorFixItem[];
  };
  onClose: () => void;
}

const FlashcardInterface: React.FC<FlashcardInterfaceProps> = ({ data, onClose }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'flash' | 'error'>('flash');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  
  const currentItems = activeTab === 'flash' ? data.flashcards : data.errorFixItems;
  const isLast = currentIdx >= currentItems.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setCurrentIdx(currentIdx + 1);
      setFlipped(false);
      setShowSolution(false);
    } else {
      showToast("Session Complete! Retaining neural connections...", 'success');
      onClose();
    }
  };

  const currentFlash = data.flashcards[currentIdx];
  const currentError = data.errorFixItems[currentIdx];

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex bg-slate-900/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm">
        <button 
          onClick={() => { setActiveTab('flash'); setCurrentIdx(0); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'flash' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Zap size={14} /> Neural Flashcards
        </button>
        <button 
          onClick={() => { setActiveTab('error'); setCurrentIdx(0); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'error' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Shield size={14} /> Error-Fix Lab
        </button>
      </div>

      {activeTab === 'flash' ? (
        <div className="perspective-1000">
          <div 
            onClick={() => setFlipped(!flipped)}
            className={`
              relative w-full h-[350px] transition-all duration-700 preserve-3d cursor-pointer group
              ${flipped ? 'rotate-y-180' : ''}
            `}
          >
            {/* Front */}
            <div className="absolute inset-0 bg-slate-900 border border-white/10 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center backface-hidden shadow-2xl">
               <div className="absolute top-10 left-10 p-2 bg-violet-500/10 rounded-lg">
                  <Wand2 size={16} className="text-violet-400" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-6">{currentFlash.topic}</span>
               <h2 className="text-2xl md:text-3xl font-black text-white leading-tight px-4">{currentFlash.front}</h2>
               <div className="mt-12 flex items-center gap-2 text-violet-400 group-hover:translate-y-1 transition-transform">
                  <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Touch to Flip</span>
                  <RefreshCw size={12} className="animate-spin-slow" />
               </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-700 border border-white/10 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center rotate-y-180 backface-hidden shadow-2xl overflow-y-auto">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-200 mb-6 opacity-80">{currentFlash.topic}</span>
               <p className="text-lg md:text-xl font-bold text-white leading-relaxed px-4">{currentFlash.back}</p>
               <Button variant="ghost" className="mt-10 text-xs font-black uppercase tracking-widest text-indigo-100 bg-white/10 border border-white/10 hover:bg-white/20">
                  Seal Impression <CheckCircle2 size={14} className="ml-2" />
               </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-emerald-500/20 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 blur-[80px] rounded-full"></div>
           
           <div className="relative z-10 flex flex-col gap-8">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2 block">{currentError.topic}</span>
                <h2 className="text-xl md:text-2xl font-black text-white leading-tight">Identify & Fix the Defect</h2>
                <p className="text-xs text-slate-500 italic mt-2">{currentError.task}</p>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 font-mono text-sm overflow-x-auto text-rose-400/90 leading-relaxed shadow-inner">
                 {currentError.brokenStatementOrCode}
              </div>

              {showSolution && (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2 flex items-center gap-2">
                       <CheckCircle2 size={12} /> Correct Resolution
                    </p>
                    <p className="text-sm font-bold text-emerald-100 leading-relaxed">{currentError.solution}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                 {!showSolution ? (
                   <Button 
                    onClick={() => setShowSolution(true)}
                    className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-500 font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-900/30"
                   >
                     Inspect Payload
                   </Button>
                 ) : (
                   <Button 
                    onClick={handleNext}
                    className="flex-1 h-14 bg-white text-slate-900 hover:bg-slate-200 font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-white/5"
                   >
                     {isLast ? "Conclude Run" : "Next Protocol"} <ChevronRight size={18} className="ml-2" />
                   </Button>
                 )}
              </div>
           </div>
        </div>
      )}

      <div className="flex items-center justify-between px-6">
         <div className="flex gap-1">
            {currentItems.map((_, i) => (
               <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-violet-400' : 'w-3 bg-slate-800'}`}></div>
            ))}
         </div>
         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{currentIdx + 1} / {currentItems.length} Sync Units</span>
      </div>
    </div>
  );
};

export default FlashcardInterface;
