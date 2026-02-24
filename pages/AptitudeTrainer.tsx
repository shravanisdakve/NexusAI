import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Button, Card } from '../components/ui';
import {
    Calculator, Brain, BookOpen, BarChart3, ArrowLeft, ArrowRight,
    CheckCircle2, XCircle, Clock, Sparkles, Target, Trophy,
    RefreshCw, Zap, ChevronRight
} from 'lucide-react';
import { generateQuizQuestion } from '../services/geminiService';
import { trackToolUsage } from '../services/personalizationService';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Category = 'quantitative' | 'logical' | 'verbal' | 'data-interpretation';

interface Question {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
}

interface SessionStats {
    total: number;
    correct: number;
    wrong: number;
    skipped: number;
    timeSpent: number;
}

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode; color: string; gradient: string; topics: string[] }[] = [
    {
        id: 'quantitative', label: 'Quantitative Aptitude', icon: <Calculator className="w-6 h-6" />,
        color: 'text-blue-400', gradient: 'from-blue-600/20 to-cyan-600/10',
        topics: ['Percentages', 'Time & Work', 'Speed, Distance & Time', 'Probability', 'Permutation & Combination', 'Profit & Loss', 'Number Systems', 'Algebra', 'Averages', 'Ratio & Proportion', 'Simple & Compound Interest', 'Ages']
    },
    {
        id: 'logical', label: 'Logical Reasoning', icon: <Brain className="w-6 h-6" />,
        color: 'text-violet-400', gradient: 'from-violet-600/20 to-purple-600/10',
        topics: ['Blood Relations', 'Coding-Decoding', 'Number & Letter Series', 'Syllogisms', 'Seating Arrangement', 'Puzzles', 'Direction Sense', 'Statement & Conclusion', 'Data Sufficiency', 'Analogies', 'Odd One Out', 'Clocks & Calendars']
    },
    {
        id: 'verbal', label: 'Verbal Ability', icon: <BookOpen className="w-6 h-6" />,
        color: 'text-emerald-400', gradient: 'from-emerald-600/20 to-teal-600/10',
        topics: ['Reading Comprehension', 'Sentence Correction', 'Para Jumbles', 'Synonyms & Antonyms', 'Fill in the Blanks', 'Error Identification', 'Sentence Completion', 'Vocabulary', 'Idioms & Phrases', 'Active & Passive Voice']
    },
    {
        id: 'data-interpretation', label: 'Data Interpretation', icon: <BarChart3 className="w-6 h-6" />,
        color: 'text-amber-400', gradient: 'from-amber-600/20 to-orange-600/10',
        topics: ['Tables', 'Bar Charts', 'Pie Charts', 'Line Graphs', 'Mixed Charts', 'Caselets']
    },
];

const DIFFICULTY_CONFIG: { id: Difficulty; label: string; color: string; questionsPerTopic: number }[] = [
    { id: 'Easy', label: 'Easy', color: 'text-emerald-400', questionsPerTopic: 5 },
    { id: 'Medium', label: 'Medium', color: 'text-amber-400', questionsPerTopic: 5 },
    { id: 'Hard', label: 'Hard', color: 'text-rose-400', questionsPerTopic: 5 },
];

const AptitudeTrainer: React.FC = () => {
    const navigate = useNavigate();
    const [phase, setPhase] = useState<'select' | 'topic' | 'practice' | 'result'>('select');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [difficulty, setDifficulty] = useState<Difficulty>('Medium');

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [stats, setStats] = useState<SessionStats>({ total: 0, correct: 0, wrong: 0, skipped: 0, timeSpent: 0 });

    const [timer, setTimer] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const TOTAL_QUESTIONS = 5;

    useEffect(() => {
        trackToolUsage('placement');
    }, []);

    useEffect(() => {
        if (phase === 'practice') {
            timerRef.current = setInterval(() => setTimer(prev => prev + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    };

    const generateQuestion = useCallback(async () => {
        const category = CATEGORIES.find(c => c.id === selectedCategory);
        if (!category) return;

        setIsGenerating(true);
        try {
            const prompt = `Generate a ${difficulty} difficulty aptitude test question about "${selectedTopic}" under "${category.label}" for an Indian engineering placement exam (TCS NQT / Infosys / Wipro style). Return JSON with: question (string), options (array of exactly 4 strings), correctOptionIndex (0-3 number), explanation (string explaining the correct answer briefly).`;
            const jsonStr = await generateQuizQuestion(prompt);
            const parsed = JSON.parse(jsonStr);
            const newQuestion: Question = {
                question: parsed.question,
                options: parsed.options,
                correctIndex: parsed.correctOptionIndex,
                explanation: parsed.explanation || '',
            };
            setQuestions(prev => [...prev, newQuestion]);
        } catch (error) {
            console.error('Failed to generate question:', error);
        } finally {
            setIsGenerating(false);
        }
    }, [selectedCategory, selectedTopic, difficulty]);

    const startPractice = async () => {
        setQuestions([]);
        setCurrentIndex(0);
        setSelected(null);
        setShowExplanation(false);
        setStats({ total: 0, correct: 0, wrong: 0, skipped: 0, timeSpent: 0 });
        setTimer(0);
        setPhase('practice');
        await generateQuestion();
    };

    const handleOptionSelect = (idx: number) => {
        if (selected !== null) return;
        setSelected(idx);
        setShowExplanation(true);

        const q = questions[currentIndex];
        if (idx === q.correctIndex) {
            setStats(prev => ({ ...prev, total: prev.total + 1, correct: prev.correct + 1 }));
        } else {
            setStats(prev => ({ ...prev, total: prev.total + 1, wrong: prev.wrong + 1 }));
        }
    };

    const handleNext = async () => {
        setSelected(null);
        setShowExplanation(false);

        if (currentIndex + 1 < TOTAL_QUESTIONS) {
            setIsGenerating(true);
            try {
                await generateQuestion();
                setCurrentIndex(prev => prev + 1);
            } catch {
                setStats(prev => ({ ...prev, timeSpent: timer }));
                setPhase('result');
            } finally {
                setIsGenerating(false);
            }
        } else {
            setStats(prev => ({ ...prev, timeSpent: timer }));
            setPhase('result');
        }
    };

    const handleSkip = async () => {
        setStats(prev => ({ ...prev, total: prev.total + 1, skipped: prev.skipped + 1 }));
        await handleNext();
    };

    const categoryObj = CATEGORIES.find(c => c.id === selectedCategory);
    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {phase !== 'select' && (
                <Button variant="ghost" onClick={() => setPhase(phase === 'topic' ? 'select' : phase === 'practice' ? 'topic' : 'select')} className="p-2 text-slate-400">
                    <ArrowLeft size={20} /> Back
                </Button>
            )}

            {/* PHASE 1: Category Selection */}
            {phase === 'select' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setSelectedCategory(cat.id); setPhase('topic'); }}
                                className={`p-8 rounded-2xl border border-slate-700/50 bg-gradient-to-br ${cat.gradient} hover:border-slate-500 transition-all text-left group hover:scale-[1.02]`}
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center ${cat.color} mb-4 group-hover:scale-110 transition-transform`}>
                                    {cat.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{cat.label}</h3>
                                <p className="text-sm text-slate-400">{cat.topics.length} topics • TCS, Infosys, Wipro patterns</p>
                                <div className="flex flex-wrap gap-1.5 mt-4">
                                    {cat.topics.slice(0, 4).map(t => (
                                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">{t}</span>
                                    ))}
                                    {cat.topics.length > 4 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500">+{cat.topics.length - 4} more</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* PHASE 2: Topic & Difficulty Selection */}
            {phase === 'topic' && categoryObj && (
                <div className="space-y-6 max-w-3xl mx-auto">
                    <Card className="p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center ${categoryObj.color}`}>
                                {categoryObj.icon}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{categoryObj.label}</h3>
                                <p className="text-xs text-slate-400">Select a topic and difficulty</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-bold text-slate-300 mb-3">Choose Topic</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {categoryObj.topics.map(topic => (
                                    <button
                                        key={topic}
                                        onClick={() => setSelectedTopic(topic)}
                                        className={`p-3 rounded-xl text-sm text-left transition-all border ${selectedTopic === topic
                                            ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                                            }`}
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-bold text-slate-300 mb-3">Difficulty Level</p>
                            <div className="flex gap-3">
                                {DIFFICULTY_CONFIG.map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => setDifficulty(d.id)}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${difficulty === d.id
                                            ? 'bg-slate-700 border-slate-500 text-white'
                                            : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-600'
                                            }`}
                                    >
                                        <span className={difficulty === d.id ? d.color : ''}>{d.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={startPractice}
                            disabled={!selectedTopic}
                            className="w-full py-4 text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-xl"
                        >
                            <Zap className="w-5 h-5 mr-2" /> Start Practice ({TOTAL_QUESTIONS} Questions)
                        </Button>
                    </Card>
                </div>
            )}

            {/* PHASE 3: Practice Mode */}
            {phase === 'practice' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        <Card className="p-8 min-h-[400px] flex flex-col">
                            {/* Progress Bar */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 rounded-t-2xl overflow-hidden" style={{ position: 'relative' }}>
                                <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / TOTAL_QUESTIONS) * 100}%` }} />
                            </div>

                            <div className="flex justify-between items-center mb-6 mt-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                        Q {currentIndex + 1} / {TOTAL_QUESTIONS}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' : difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        {difficulty}
                                    </span>
                                </div>
                                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                                    <Clock size={12} /> {formatTime(timer)}
                                </span>
                            </div>

                            {questions[currentIndex] ? (
                                <>
                                    <h2 className="text-xl font-bold text-white mb-8 leading-relaxed">{questions[currentIndex].question}</h2>

                                    <div className="space-y-3 mb-6 flex-1">
                                        {questions[currentIndex].options.map((opt, idx) => {
                                            let stateClass = 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:border-slate-500';
                                            if (selected !== null) {
                                                if (idx === questions[currentIndex].correctIndex) stateClass = 'bg-emerald-500/15 border-emerald-500 text-emerald-300';
                                                else if (selected === idx) stateClass = 'bg-red-500/15 border-red-500 text-red-300';
                                                else stateClass = 'bg-slate-800/30 border-slate-700/50 opacity-50';
                                            }
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleOptionSelect(idx)}
                                                    disabled={selected !== null}
                                                    className={`w-full p-4 rounded-xl border text-left transition-all ${stateClass} flex items-center justify-between`}
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <span className="text-slate-500 font-bold">{String.fromCharCode(65 + idx)}.</span>
                                                        <span>{opt}</span>
                                                    </span>
                                                    {selected !== null && idx === questions[currentIndex].correctIndex && <CheckCircle2 size={18} className="text-emerald-500" />}
                                                    {selected !== null && selected === idx && idx !== questions[currentIndex].correctIndex && <XCircle size={18} className="text-red-500" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {showExplanation && questions[currentIndex].explanation && (
                                        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-6 animate-in fade-in slide-in-from-bottom-2">
                                            <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Explanation</p>
                                            <p className="text-sm text-slate-300 leading-relaxed">{questions[currentIndex].explanation}</p>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-6 border-t border-slate-700/50">
                                        {selected === null ? (
                                            <Button variant="ghost" onClick={handleSkip} className="text-slate-400">Skip</Button>
                                        ) : (
                                            <div />
                                        )}
                                        <Button
                                            onClick={handleNext}
                                            disabled={selected === null || isGenerating}
                                            isLoading={isGenerating}
                                            className="gap-2 bg-white text-slate-900 hover:bg-slate-200"
                                        >
                                            {currentIndex < TOTAL_QUESTIONS - 1 ? 'Next Question' : 'Finish'} <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
                                        <p className="text-slate-400">Generating question...</p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-4">
                        <Card className="p-5 border-slate-700 bg-slate-900/50">
                            <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3">Session</h5>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Correct</span>
                                    <span className="font-bold text-emerald-400">{stats.correct}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Wrong</span>
                                    <span className="font-bold text-rose-400">{stats.wrong}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Skipped</span>
                                    <span className="font-bold text-slate-400">{stats.skipped}</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-5 border-slate-700">
                            <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Topic</h5>
                            <p className="text-sm font-bold text-white">{selectedTopic}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{categoryObj?.label}</p>
                        </Card>
                    </div>
                </div>
            )}

            {/* PHASE 4: Results */}
            {phase === 'result' && (
                <div className="max-w-2xl mx-auto">
                    <Card className="p-10 text-center space-y-8 bg-gradient-to-br from-slate-800/80 to-slate-900">
                        <Trophy className="w-20 h-20 text-amber-400 mx-auto" />
                        <h3 className="text-3xl font-black text-white">Practice Complete!</h3>
                        <p className="text-slate-400">{selectedTopic} • {difficulty} • {categoryObj?.label}</p>

                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                            {accuracy}%
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                                <p className="text-[10px] font-black text-slate-500 uppercase">Total</p>
                                <p className="text-2xl font-bold text-white">{stats.total}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                                <p className="text-[10px] font-black text-slate-500 uppercase">Correct</p>
                                <p className="text-2xl font-bold text-emerald-400">{stats.correct}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                                <p className="text-[10px] font-black text-slate-500 uppercase">Wrong</p>
                                <p className="text-2xl font-bold text-rose-400">{stats.wrong}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                                <p className="text-[10px] font-black text-slate-500 uppercase">Time</p>
                                <p className="text-2xl font-bold text-blue-400">{formatTime(stats.timeSpent)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" onClick={() => { setPhase('topic'); }} className="w-full">
                                Try Another Topic
                            </Button>
                            <Button onClick={() => startPractice()} className="w-full bg-gradient-to-r from-blue-600 to-violet-600">
                                <RefreshCw className="w-4 h-4 mr-2" /> Retry Same
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AptitudeTrainer;
