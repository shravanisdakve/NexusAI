import React, { useState, useEffect } from 'react';
import { Timer, CheckCircle2, XCircle, ChevronRight, RotateCcw, Award, Check } from 'lucide-react';
import { Button } from '../ui';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string | number;
  explanation?: string;
}

interface QuizInterfaceProps {
  quizData: {
    title: string;
    questions: Question[];
  };
  onClose: () => void;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ quizData, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default
  const [isTimerActive, setIsTimerActive] = useState(true);

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const isCorrect = selectedOption === currentQuestion.correctAnswer;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerActive && timeLeft > 0 && !showResults) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setShowResults(true);
    }
    return () => clearInterval(timer);
  }, [isTimerActive, timeLeft, showResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleOptionClick = (option: string | number) => {
    if (isAnswered) return;
    setSelectedOption(option);
    
    // Auto-submit logic: Skip manual "Submit Answer" button
    setIsAnswered(true);
    if (option === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }

    // Auto-transition to next question
    setTimeout(() => {
      handleNext();
    }, 2000);
  };

  /* Manual submit is now handled automatically on option click
  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };
  */

  const handleNext = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  const calculatePercentage = () => Math.round((score / quizData.questions.length) * 100);

  if (showResults) {
    const percentage = calculatePercentage();
    return (
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-500">
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl animate-pulse"></div>
          <Award className="mx-auto text-yellow-300 mb-2 relative z-10" size={32} />
          <h2 className="text-xl font-black text-white mb-0.5 relative z-10">Quiz Complete!</h2>
          <p className="text-[11px] text-violet-100/80 uppercase tracking-widest font-black relative z-10">Neural sync complete</p>
        </div>
        
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 text-center">
              <span className="block text-xl font-black text-white leading-none mb-1">{score}/{quizData.questions.length}</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Total Score</span>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 text-center">
              <span className="block text-xl font-black text-emerald-400 leading-none mb-1">{percentage}%</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Accuracy</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Performance Analysis
            </h4>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden ring-1 ring-white/5">
              <div 
                className={`h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000`} 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed italic">
              {percentage >= 80 ? 'Mastery achieved. Neural pathways optimized.' : 
               percentage >= 50 ? 'Steady progress. Recommend deeper iteration.' : 
               'Significant gaps. Immediate active recall suggested.'}
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button 
                variant="outline" 
                className="flex-1 h-10 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl"
                onClick={onClose}
            >
              Exit Console
            </Button>
            <Button 
                className="flex-1 h-10 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-violet-900/40"
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setSelectedOption(null);
                  setIsAnswered(false);
                  setScore(0);
                  setShowResults(false);
                  setTimeLeft(600);
                }}
            >
              <RotateCcw size={14} className="mr-2" /> Re-Sync Session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Quiz Progress Header */}
      <div className="p-3 bg-slate-900/10 border-b border-white/5 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-1">Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
          <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-violet-500 transition-all duration-300" 
              style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400">
            <Timer size={14} className="animate-pulse" />
            <span className="text-xs font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
          <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors border border-white/5"
            >
            <XCircle size={18} />
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        {/* Question Text */}
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl font-bold text-white leading-snug">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Options Grid */}
        <div className="grid gap-2">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === option;
            const isCorrectOption = isAnswered && option === currentQuestion.correctAnswer;
            const isWrongOption = isAnswered && isSelected && option !== currentQuestion.correctAnswer;

            return (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                disabled={isAnswered}
                className={`group p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between text-left
                  ${isSelected ? 'ring-2 ring-violet-500/50' : 'hover:bg-white/5'}
                  ${isCorrectOption ? 'bg-emerald-500/10 border-emerald-500/50' : 
                    isWrongOption ? 'bg-rose-500/10 border-rose-500/50' : 
                    isSelected ? 'bg-violet-500/10 border-violet-500/50' : 'bg-slate-800/40 border-white/5'}
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors font-bold text-sm
                    ${isCorrectOption ? 'bg-emerald-500 text-white' : 
                      isWrongOption ? 'bg-rose-500 text-white' : 
                      isSelected ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}
                  `}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className={`text-sm md:text-base font-medium transition-colors
                    ${isCorrectOption ? 'text-emerald-100' : isWrongOption ? 'text-rose-100' : isSelected ? 'text-violet-100' : 'text-slate-300 group-hover:text-slate-100'}
                  `}>
                    {option}
                  </span>
                </div>
                
                {isCorrectOption && <CheckCircle2 size={24} className="text-emerald-500 flex-shrink-0" />}
                {isWrongOption && <XCircle size={24} className="text-rose-500 flex-shrink-0" />}
                {!isAnswered && isSelected && <Check size={20} className="text-violet-500 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation / Footer */}
        <div className="pt-2 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1">
            {isAnswered && currentQuestion.explanation && (
              <div className="p-3 bg-slate-800/60 border border-white/5 rounded-2xl animate-in slide-in-from-bottom-4 duration-300">
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1 flex items-center gap-1.5">
                   <LightbulbIcon className="w-3 h-3" /> Explanation
                </p>
                <p className="text-xs text-slate-300 leading-relaxed italic">{currentQuestion.explanation}</p>
              </div>
            )}
          </div>

          {/* Auto-progression enabled: Manual button hidden to streamline flow */}
        </div>
      </div>
    </div>
  );
};

const LightbulbIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.674a1 1 0 011 1v1a1 1 0 01-1 1H9.663a1 1 0 01-1-1v-1a1 1 0 011-1zM12 3c-4.97 0-9 4.03-9 9 0 2.21.89 4.21 2.34 5.66A9.011 9.011 0 0012 21c2.21 0 4.21-.89 5.66-2.34A9.011 9.011 0 0021 12c0-4.97-4.03-9-9-9z" />
    </svg>
);

export default QuizInterface;
