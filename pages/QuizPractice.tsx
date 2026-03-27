import React, { useState } from 'react';
import { PageHeader, Button } from '../components/ui';
import { Brain, Grid3X3, Zap, Calculator, Wand2, FileText, ChevronLeft, Target, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import PdfUpload from '../components/quiz/PdfUpload';
import QuizInterface from '../components/quiz/QuizInterface';
import { generateQuizSet } from '../services/geminiService';

type ViewState = 'selection' | 'upload' | 'active-quiz';

const QuizPractice: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [viewState, setViewState] = useState<ViewState>('selection');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);

  const handleStartAiQuiz = () => {
    setViewState('upload');
  };

  const handleTextExtracted = async (text: string) => {
    setIsGenerating(true);
    try {
      const quizJson = await generateQuizSet(text, 10);
      const parsedQuiz = JSON.parse(quizJson);
      
      setActiveQuiz({
        title: 'AI Practice Session',
        questions: parsedQuiz.questions
      });
      setViewState('active-quiz');
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      alert('Failed to generate quiz from the document. Please try a different section or file.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    if (viewState === 'upload') setViewState('selection');
    else if (viewState === 'active-quiz') {
        if (window.confirm('Quit active quiz? Progress will be lost.')) {
            setViewState('selection');
            setActiveQuiz(null);
        }
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {viewState === 'selection' ? (
        <>
          <PageHeader
            title={t('quiz.title') || 'Quizzes & Practice'}
            subtitle={t('quiz.subtitle') || 'Master concepts through interactive challenges and AI-driven practice sessions.'}
          />

          {/* AI Generator Hero Card */}
          <div className="relative group bg-gradient-to-br from-violet-600/20 to-indigo-600/10 border border-violet-500/30 rounded-3xl p-6 md:p-10 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="absolute top-0 right-0 p-6 text-violet-500/10 pointer-events-none">
              <Rocket size={120} className="transform rotate-12 group-hover:scale-110 transition-transform duration-1000" />
            </div>
            
            <div className="relative z-10 max-w-xl flex flex-col items-center md:items-start text-center md:text-left">
              <div className="w-12 h-12 bg-violet-600/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 ring-1 ring-violet-400/30">
                <Wand2 className="text-violet-400" size={24} />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight">AI-Powered Practice Center</h2>
              <p className="text-slate-400 text-sm md:text-base mb-6 leading-relaxed">
                Upload your study notes, textbooks, or research papers and our AI will generate a tailored 10-question practice set to test your knowledge.
              </p>
              <Button 
                onClick={handleStartAiQuiz}
                size="md"
                className="bg-violet-600 hover:bg-violet-500 shadow-xl shadow-violet-900/40 px-8 py-3.5 text-base font-bold"
              >
                Create Custom Quiz
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 px-2 flex items-center gap-2">
              <Target size={14} className="text-rose-400" /> Quick Challenges
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Interview Card */}
                <div
                onClick={() => navigate('/interview')}
                className="group cursor-pointer bg-slate-900/60 p-6 rounded-2xl hover:border-rose-500/50 border border-slate-800 transition-all hover:translate-y-[-4px] active:scale-95"
                >
                    <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mb-4 ring-1 ring-rose-500/20 group-hover:bg-rose-500/20 transition-colors">
                        <Brain className="text-rose-400" size={24} />
                    </div>
                <h3 className="text-lg font-bold text-slate-100">{t('quiz.interviewTitle') || 'Interview Q&A'}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {t('quiz.interviewSubtitle') || 'Prepare with top industry questions.'}
                </p>
                </div>

                {/* Sudoku Card */}
                <div
                onClick={() => navigate('/sudoku')}
                className="group cursor-pointer bg-slate-900/60 p-6 rounded-2xl hover:border-emerald-500/50 border border-slate-800 transition-all hover:translate-y-[-4px] active:scale-95"
                >
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                        <Grid3X3 className="text-emerald-400" size={24} />
                    </div>
                <h3 className="text-lg font-bold text-slate-100">{t('quiz.sudokuTitle') || 'Logic Sudoku'}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {t('quiz.sudokuSubtitle') || 'Sharpen your analytical skills.'}
                </p>
                </div>

                {/* Zip Game Card */}
                <div
                onClick={() => navigate('/zip')}
                className="group cursor-pointer bg-slate-900/60 p-6 rounded-2xl hover:border-yellow-500/50 border border-slate-800 transition-all hover:translate-y-[-4px] active:scale-95"
                >
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4 ring-1 ring-yellow-500/20 group-hover:bg-yellow-500/20 transition-colors">
                    <Zap className="text-yellow-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-100">{t('quiz.zipTitle') || 'Zip Mastery'}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {t('quiz.zipSubtitle') || 'Test your reaction & memory.'}
                </p>
                </div>

                {/* Speed Math Card */}
                <div
                onClick={() => navigate('/speed-math')}
                className="group cursor-pointer bg-slate-900/60 p-6 rounded-2xl hover:border-green-500/50 border border-slate-800 transition-all hover:translate-y-[-4px] active:scale-95"
                >
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 ring-1 ring-green-500/20 group-hover:bg-green-500/20 transition-colors">
                    <Calculator className="text-green-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-100">{t('quiz.speedMathTitle') || 'Speed Sprint'}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {t('quiz.speedMathSubtitle') || 'Crunch numbers under pressure.'}
                </p>
                </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
           <div className="flex items-center justify-between">
                <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={handleBack}>
                    <ChevronLeft size={20} className="mr-1" /> Back to Center
                </Button>
                
                {viewState === 'upload' && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/40 rounded-full border border-white/5">
                        <FileText size={16} className="text-violet-400" />
                        <span className="text-xs font-bold text-slate-300">New AI Generation Session</span>
                    </div>
                )}
           </div>

           {viewState === 'upload' && (
             <PdfUpload 
                onTextExtracted={handleTextExtracted} 
                isProcessing={isGenerating} 
             />
           )}

           {viewState === 'active-quiz' && activeQuiz && (
             <QuizInterface 
                quizData={activeQuiz} 
                onClose={() => setViewState('selection')} 
             />
           )}
        </div>
      )}
    </div>
  );
};

export default QuizPractice;
