import React, { useState } from 'react';
import { PageHeader, Input, Button } from '../components/ui';
import { Brain, Home, Sparkles, AlertCircle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateQuizQuestion } from '../services/geminiService';

type Question = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string; // Enhanced to include explanation
};

type WrongAnswer = {
  question: string;
  selected: string;
  correct: string;
};

const InterviewQuiz: React.FC = () => {
  const navigate = useNavigate();

  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const startQuiz = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setQuestions([]);
    setScore(0);
    setCurrent(0);
    setFinished(false);
    setWrongAnswers([]);

    try {
      // Generate the first question to start
      await generateNextQuestion(topic);
      setGameStarted(true);
    } catch (error) {
      console.error("Failed to start quiz:", error);
      alert("Failed to generate interview questions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateNextQuestion = async (quizTopic: string) => {
    const context = `Generate a technical interview question about "${quizTopic}". Return JSON with: question, options (array of 4 strings), correctOptionIndex (0-3 number).`;
    const jsonStr = await generateQuizQuestion(context);
    const parsed = JSON.parse(jsonStr);

    // Adapt to our local type
    const newQuestion: Question = {
      question: parsed.question,
      options: parsed.options,
      correctIndex: parsed.correctOptionIndex,
      explanation: parsed.explanation // Optional if backend supports it
    };

    setQuestions(prev => [...prev, newQuestion]);
  };

  const handleOptionSelect = (idx: number) => {
    if (selected !== null) return; // Prevent changing answer
    setSelected(idx);

    const q = questions[current];
    const isCorrect = idx === q.correctIndex;

    if (isCorrect) {
      setScore(prev => prev + 1);
      setFeedback("Correct! 🎉");
    } else {
      setFeedback(`Incorrect. The correct answer was: ${q.options[q.correctIndex]}`);
      setWrongAnswers(prev => [
        ...prev,
        {
          question: q.question,
          selected: q.options[idx],
          correct: q.options[q.correctIndex],
        },
      ]);
    }
  };

  const handleNext = async () => {
    setFeedback(null);
    setSelected(null);

    // If we are at the last loaded question, fetch more or finish
    // For this simple version, let's do a 5-question round
    if (current + 1 < 5) {
      // Pre-fetch next question if needed (optional optimization), but here we just wait
      setIsGenerating(true);
      try {
        await generateNextQuestion(topic);
        setCurrent(prev => prev + 1);
      } catch (e) {
        console.error(e);
        setFinished(true); // End if fail to generate
      } finally {
        setIsGenerating(false);
      }
    } else {
      setFinished(true);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-slate-400">
          <Home size={20} />
        </Button>
        <PageHeader
          title="AI Interview Prep"
          subtitle="Master your tech interviews with dynamic, AI-generated questions."
        />
      </div>

      {!gameStarted ? (
        <div className="bg-slate-800/50 rounded-2xl p-10 text-center ring-1 ring-slate-700 shadow-xl max-w-xl mx-auto">
          <div className="bg-violet-600/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain size={40} className="text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Configure Your Interview</h2>
          <p className="text-slate-400 mb-8">Enter a topic (e.g., React Hooks, System Design, Python Basics) and the AI will challenge you.</p>

          <div className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Interview Topic</label>
              <Input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. JavaScript Event Loop"
                autoFocus
              />
            </div>
            <Button
              onClick={startQuiz}
              disabled={!topic || isGenerating}
              className="w-full h-12 text-lg font-semibold bg-violet-600 hover:bg-violet-700"
              isLoading={isGenerating}
            >
              <Sparkles size={18} className="mr-2" /> Start Interview
            </Button>
          </div>
        </div>
      ) : !finished ? (
        <div className="max-w-2xl mx-auto bg-slate-900/80 rounded-2xl p-8 ring-1 ring-slate-700 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 rounded-t-2xl overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all duration-500"
              style={{ width: `${((current + 1) / 5) * 100}%` }}
            />
          </div>

          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Question {current + 1} / 5</span>
            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-mono">Score: {score}</span>
          </div>

          {questions[current] ? (
            <>
              <h2 className="text-xl font-bold text-white mb-6 leading-relaxed">
                {questions[current].question}
              </h2>

              <div className="space-y-3 mb-8">
                {questions[current].options.map((opt, idx) => {
                  let stateClass = "bg-slate-800 border-slate-700 hover:bg-slate-700";
                  if (selected !== null) {
                    if (idx === questions[current].correctIndex) stateClass = "bg-emerald-500/20 border-emerald-500 text-emerald-300";
                    else if (selected === idx) stateClass = "bg-red-500/20 border-red-500 text-red-300";
                    else stateClass = "bg-slate-800 border-slate-700 opacity-50";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={selected !== null}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${stateClass} flex items-center justify-between group`}
                    >
                      <span>{opt}</span>
                      {selected !== null && idx === questions[current].correctIndex && <CheckCircle2 size={18} className="text-emerald-500" />}
                      {selected !== null && selected === idx && idx !== questions[current].correctIndex && <XCircle size={18} className="text-red-500" />}
                    </button>
                  );
                })}
              </div>

              {feedback && (
                <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${selected === questions[current].correctIndex ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {selected === questions[current].correctIndex ? <CheckCircle2 /> : <AlertCircle />}
                  {feedback}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={selected === null || isGenerating}
                  isLoading={isGenerating}
                  className="bg-white text-slate-900 hover:bg-slate-200"
                >
                  {current < 4 ? 'Next Question' : 'Finish Interview'} <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>
            </>
          ) : (
            <div className="py-20 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Generating next challenge...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-xl mx-auto bg-slate-800/50 rounded-2xl p-10 text-center ring-1 ring-slate-700 shadow-xl animate-in zoom-in-95">
          <h2 className="text-3xl font-black text-white mb-2">Interview Complete! 🎉</h2>
          <p className="text-slate-400 mb-8">Here is how you performed on <span className="text-violet-400 font-semibold">{topic}</span>.</p>

          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-8">
            {score} / 5
          </div>

          {wrongAnswers.length > 0 && (
            <div className="mb-8 text-left bg-slate-900/50 rounded-xl p-6 max-h-60 overflow-y-auto">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Areas for Improvement</h3>
              <div className="space-y-4">
                {wrongAnswers.map((wa, idx) => (
                  <div key={idx} className="border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                    <p className="font-medium text-slate-200 text-sm mb-1">{wa.question}</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-red-400">You: {wa.selected}</span>
                      <span className="text-emerald-400">Correct: {wa.correct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => setGameStarted(false)} className="w-full">
              Try Another Topic
            </Button>
            <Button onClick={() => navigate('/')} className="w-full">
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewQuiz;
