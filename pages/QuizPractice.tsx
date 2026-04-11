
import React, { useState, useEffect } from 'react';
import { PageHeader, Button } from '../components/ui';
import { Brain, Grid3X3, Zap, Calculator, Wand2, FileText, ChevronLeft, Target, Rocket, Flame, Shield, Sparkles, Binary, Timer, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import PdfUpload from '../components/quiz/PdfUpload';
import QuizInterface from '../components/quiz/QuizInterface';
import AdaptiveChallengeInterface from '../components/quiz/AdaptiveChallengeInterface';
import FlashcardInterface from '../components/quiz/FlashcardInterface';
import { 
  generateQuizSet, 
  generatePersonalizedQuiz, 
  generateTimedChallenge, 
  generateFlashcardChallenge,
  generateQuizFromFile
} from '../services/geminiService';
import { getPersonalizationRecommendations } from '../services/personalizationService';

type ViewState = 'selection' | 'upload' | 'active-quiz' | 'adaptive-challenge' | 'flashcard-mode';

const QuizPractice: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();
  
  const [viewState, setViewState] = useState<ViewState>('selection');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [activeFlashcards, setActiveFlashcards] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);

  useEffect(() => {
    const fetchRecs = async () => {
      const recs = await getPersonalizationRecommendations();
      setRecommendations(recs);
    };
    fetchRecs();
  }, []);

  const handleStartAiQuiz = () => {
    setViewState('upload');
  };

  const handleFileProcessed = async (base64: string, mimeType: string) => {
    setIsGenerating(true);
    try {
      const quizJson = await generateQuizFromFile(base64, mimeType, 10);
      const parsedQuiz = JSON.parse(quizJson);
      
      setActiveQuiz({
        title: 'AI Practice Session',
        questions: parsedQuiz.questions || parsedQuiz
      });
      setViewState('active-quiz');
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      showToast('Failed to generate quiz from this file. It might be too large or complex.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartAdaptiveQuiz = async () => {
    setIsGenerating(true);
    try {
      const weakTopics = recommendations?.weakTopics?.map((t: any) => t.topic).join(', ') || 'Computer Engineering Fundamentals';
      const quiz = await generatePersonalizedQuiz({
        weakTopics,
        targetExam: 'Upcoming MU Exams',
        difficulty: 'mixed',
        questionCount: 10
      });
      
      if (quiz) {
        setActiveQuiz(quiz);
        setViewState('active-quiz');
      }
    } catch (error) {
        showToast("Personalized generation failed. Reverting to base model.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartTimedChallenge = async (mode: 'speed_drill' | 'streak_mode') => {
    setIsGenerating(true);
    try {
      const weakTopics = recommendations?.weakTopics?.map((t: any) => t.topic).join(', ') || 'Data Structures & Algorithms';
      const challenge = await generateTimedChallenge({
        weakTopics,
        accuracyPercent: recommendations?.latestPlacement?.accuracy || 65,
        timeAvailableMinutes: 5,
        mode
      });

      if (challenge) {
        setActiveChallenge(challenge);
        setViewState('adaptive-challenge');
      }
    } catch (error) {
       showToast("Challenge generation failed.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartFlashcards = async () => {
    setIsGenerating(true);
    try {
      const weakTopics = recommendations?.weakTopics?.map((t: any) => t.topic).join(', ') || 'Operating Systems & Networks';
      const data = await generateFlashcardChallenge({
        weakTopics,
        targetExam: 'Semester Exams',
        count: 8
      });

      if (data) {
        setActiveFlashcards(data);
        setViewState('flashcard-mode');
      }
    } catch (error) {
       showToast("Flashcard lab initialization failed.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    if (viewState === 'upload') setViewState('selection');
    else if (viewState !== 'selection') {
        if (window.confirm('Quit session? Results will not be saved.')) {
            setViewState('selection');
            setActiveQuiz(null);
            setActiveChallenge(null);
            setActiveFlashcards(null);
        }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12">
      {viewState === 'selection' ? (
        <>
          <PageHeader
            title={t('quiz.title') || 'Quizzes & Practice'}
            subtitle={t('quiz.subtitle') || 'Neuro-adaptive practice powered by Mumbai University exam patterns.'}
          />

          {/* AI Generator Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="relative group bg-gradient-to-br from-violet-600/10 to-indigo-600/5 border border-violet-500/20 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 transition-all hover:bg-violet-600/15 overflow-hidden">

               <div className="absolute -top-12 -right-12 p-32 bg-violet-500/10 blur-[60px] rounded-full group-hover:bg-violet-500/20 transition-all duration-700"></div>
               <div className="relative z-10">
                  <Wand2 className="text-violet-400 mb-6" size={40} />
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tighter">AI-Generated Quiz</h2>
                  <p className="text-slate-500 text-sm mb-8 leading-relaxed font-bold">
                    We've scanned your performance. This practice set zooms in on {recommendations?.weakTopics?.length || 0} weak areas identified in your recent sessions.
                  </p>
                  <Button 
                    onClick={handleStartAdaptiveQuiz} 
                    className="h-14 px-10 bg-violet-600 shadow-xl shadow-violet-900/40 rounded-2xl font-black uppercase tracking-widest text-xs"
                    disabled={isGenerating}
                  >
                    {isGenerating ? "Synthesizing Neural Map..." : "Start Personalized Quiz"}
                  </Button>
               </div>
            </div>

            <div className="relative group bg-slate-900/50 border border-emerald-500/20 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 overflow-hidden">

               <div className="relative z-10">
                  <Target className="text-emerald-400 mb-6" size={40} />
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase tracking-tighter">Adaptive Challenge</h2>
                  <p className="text-slate-500 text-sm mb-8 leading-relaxed font-bold">
                    Serious academic drills designed to force rapid recall. Choose a mode to test your technical endurance.
                  </p>
                  <div className="flex flex-wrap gap-4">
                     <Button 
                       onClick={() => handleStartTimedChallenge('speed_drill')}
                       className="h-12 px-6 bg-emerald-600 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-900/30"
                       disabled={isGenerating}
                     >
                       <Zap size={14} className="mr-2" /> Speed Drill
                     </Button>
                     <Button 
                       onClick={() => handleStartTimedChallenge('streak_mode')}
                       className="h-12 px-6 bg-rose-600 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-900/30"
                       disabled={isGenerating}
                     >
                       <Flame size={14} className="mr-2" /> Streak Mode
                     </Button>
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-10">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-slate-800"></span> 
              Practice Annex & Gamified Labs
              <span className="w-8 h-[1px] bg-slate-800"></span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div onClick={handleStartFlashcards} className="group cursor-pointer bg-slate-900/40 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 hover:border-violet-500/40 transition-all hover:translate-y-[-4px] backdrop-blur-sm">
                   <div className="w-12 h-12 md:w-14 md:h-14 bg-violet-500/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 ring-1 ring-violet-500/20 group-hover:bg-violet-500/20 transition-all">
                      <Sparkles className="text-violet-400" size={24} />
                   </div>
                   <h3 className="text-lg md:text-xl font-black text-white mb-1 md:mb-2 uppercase tracking-tighter">Memory Labs</h3>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">Spaced Repetition</p>
                </div>

                <div onClick={handleStartAiQuiz} className="group cursor-pointer bg-slate-900/40 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 hover:border-indigo-500/40 transition-all hover:translate-y-[-4px] backdrop-blur-sm">
                   <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-500/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 ring-1 ring-indigo-500/20 group-hover:bg-indigo-500/20 transition-all">
                      <FileText className="text-indigo-400" size={24} />
                   </div>
                   <h3 className="text-lg md:text-xl font-black text-white mb-1 md:mb-2 uppercase tracking-tighter">Note Scanner</h3>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">PDF to Quiz</p>
                </div>

                <div onClick={() => navigate('/sudoku')} className="group cursor-pointer bg-slate-900/40 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 hover:border-emerald-500/40 transition-all hover:translate-y-[-4px] backdrop-blur-sm">
                   <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-500/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                      <Grid3X3 className="text-emerald-400" size={24} />
                   </div>
                   <h3 className="text-lg md:text-xl font-black text-white mb-1 md:mb-2 uppercase tracking-tighter">Logic Grid</h3>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">Architectural Thinking</p>
                </div>

                <div onClick={() => navigate('/speed-math')} className="group cursor-pointer bg-slate-900/40 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 hover:border-rose-500/40 transition-all hover:translate-y-[-4px] backdrop-blur-sm">
                   <div className="w-12 h-12 md:w-14 md:h-14 bg-rose-500/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 ring-1 ring-rose-500/20 group-hover:bg-rose-500/20 transition-all">
                      <Calculator className="text-rose-400" size={24} />
                   </div>
                   <h3 className="text-lg md:text-xl font-black text-white mb-1 md:mb-2 uppercase tracking-tighter">Data Sprint</h3>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">Number Crunching</p>
                </div>

            </div>
          </div>
        </>
      ) : (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
           <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <Button variant="ghost" className="text-slate-400 hover:text-white group" onClick={handleBack}>
                    <ChevronLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Exit Session
                </Button>
                
                <div className="flex items-center gap-4">
                   <div className="px-4 py-2 bg-slate-950 border border-white/5 rounded-xl flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Run Mode: ACTIVE</span>
                   </div>
                </div>
           </div>

           {isGenerating ? (
             <div className="flex flex-col items-center justify-center py-32 space-y-8">
                <div className="relative">
                   <div className="w-24 h-24 bg-violet-600/20 rounded-full flex items-center justify-center ring-4 ring-violet-500/10">
                      <Brain className="text-violet-400 animate-bounce" size={48} />
                   </div>
                   <div className="absolute -inset-4 border-4 border-violet-500/30 border-t-white rounded-full animate-spin"></div>
                </div>
                <div className="text-center">
                   <h3 className="text-2xl font-black text-white tracking-tight uppercase">Encrypting Neural Sequence</h3>
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Personalizing content to match weak topic vectors...</p>
                </div>
             </div>
           ) : (
             <>
               {viewState === 'upload' && <PdfUpload onFileProcessed={handleFileProcessed} isProcessing={isGenerating} />}
               {viewState === 'active-quiz' && activeQuiz && <QuizInterface quizData={activeQuiz} onClose={() => setViewState('selection')} />}
               {viewState === 'adaptive-challenge' && activeChallenge && <AdaptiveChallengeInterface challengeData={activeChallenge} onClose={() => setViewState('selection')} onComplete={() => {}} />}
               {viewState === 'flashcard-mode' && activeFlashcards && <FlashcardInterface data={activeFlashcards} onClose={() => setViewState('selection')} />}
             </>
           )}
        </div>
      )}
    </div>
  );
};

export default QuizPractice;
