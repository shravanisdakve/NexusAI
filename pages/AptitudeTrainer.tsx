import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../components/ui';
import {
    Calculator, Brain, BookOpen, BarChart3, ArrowLeft, ArrowRight,
    CheckCircle2, XCircle, Clock, Target, Trophy,
    RefreshCw, Zap, ChevronRight, Layout, PieChart, Star, Award, TrendingUp
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

type Status = 'new' | 'in-progress' | 'completed' | 'weak';

interface CategoryConfig {
    id: Category;
    label: string;
    icon: React.ReactNode;
    color: string;
    topics: string[];
    status: Status;
    completion?: number;
}

const CATEGORIES: CategoryConfig[] = [
    {
        id: 'quantitative', label: 'Quant Logic', icon: <Calculator size={18} />,
        color: 'text-blue-400',
        topics: ['Percentages', 'Time & Work', 'Speed & Distance', 'Probability', 'P&C', 'Profit & Loss', 'Number Systems'],
        status: 'in-progress', completion: 45
    },
    {
        id: 'logical', label: 'Reasoning', icon: <Brain size={18} />,
        color: 'text-violet-400',
        topics: ['Blood Relations', 'Coding-Decoding', 'Series', 'Syllogisms', 'Seating', 'Puzzles', 'Direction Sense'],
        status: 'new'
    },
    {
        id: 'verbal', label: 'Verbal Mastery', icon: <BookOpen size={18} />,
        color: 'text-emerald-400',
        topics: ['Reading Comp', 'Sentence Correction', 'Para Jumbles', 'Vocabulary', 'Idioms', 'Voice'],
        status: 'weak'
    },
    {
        id: 'data-interpretation', label: 'Data Analytics', icon: <BarChart3 size={18} />,
        color: 'text-amber-400',
        topics: ['Tables', 'Bar Charts', 'Pie Charts', 'Line Graphs', 'Caselets'],
        status: 'completed', completion: 100
    },
];

const DIFFICULTY_CONFIG: { id: Difficulty; label: string; color: string }[] = [
    { id: 'Easy', label: 'Easy', color: 'text-emerald-400' },
    { id: 'Medium', label: 'Medium', color: 'text-amber-400' },
    { id: 'Hard', label: 'Hard', color: 'text-rose-400' },
];

const TOTAL_QUESTIONS = 10;

const AptitudeTrainer: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'practice' | 'topics' | 'portfolio'>('practice');
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

    useEffect(() => { trackToolUsage('placement'); }, []);

    useEffect(() => {
        if (phase === 'practice') timerRef.current = setInterval(() => setTimer(prev => prev + 1), 1000);
        else if (timerRef.current) clearInterval(timerRef.current);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase]);

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const generateQuestion = useCallback(async () => {
        const category = CATEGORIES.find(c => c.id === selectedCategory);
        if (!category) return;
        setIsGenerating(true);
        try {
            const prompt = `Generate a ${difficulty} aptitude question about "${selectedTopic}" for an IT placement exam. Return JSON: question, options (4), correctOptionIndex (0-3), explanation.`;
            const jsonStr = await generateQuizQuestion(prompt);
            const parsed = JSON.parse(jsonStr);
            setQuestions(prev => [...prev, {
                question: parsed.question,
                options: parsed.options,
                correctIndex: parsed.correctOptionIndex,
                explanation: parsed.explanation || '',
            }]);
        } catch (e) { console.error(e); } finally { setIsGenerating(false); }
    }, [selectedCategory, selectedTopic, difficulty]);

    const startPractice = async () => {
        setQuestions([]); setCurrentIndex(0); setSelected(null); setShowExplanation(false);
        setStats({ total: 0, correct: 0, wrong: 0, skipped: 0, timeSpent: 0 }); setTimer(0);
        setPhase('practice'); await generateQuestion();
    };

    const handleOptionSelect = (idx: number) => {
        if (selected !== null) return;
        setSelected(idx); setShowExplanation(true);
        if (idx === questions[currentIndex].correctIndex) setStats(prev => ({ ...prev, total: prev.total + 1, correct: prev.correct + 1 }));
        else setStats(prev => ({ ...prev, total: prev.total + 1, wrong: prev.wrong + 1 }));
    };

    const handleNext = async () => {
        setSelected(null); setShowExplanation(false);
        if (currentIndex + 1 < TOTAL_QUESTIONS) {
            await generateQuestion(); setCurrentIndex(prev => prev + 1);
        } else {
            setStats(prev => ({ ...prev, timeSpent: timer })); setPhase('result');
        }
    };

    const PracticeTab = (
        <div className="space-y-6">
            {phase !== 'select' && phase !== 'result' && (
                <Button variant="ghost" onClick={() => setPhase(phase === 'topic' ? 'select' : 'topic')} className="p-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={18} className="mr-2" /> Back
                </Button>
            )}

            {phase === 'select' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => { setSelectedCategory(cat.id); setPhase('topic'); }}
                            className="group p-6 bg-slate-900/40 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all text-left relative overflow-hidden flex items-center justify-between"
                        >
                            <div className="flex items-center gap-5 relative z-10">
                                <div className={`w-12 h-12 rounded-[1.2rem] bg-slate-950 border border-white/5 flex items-center justify-center ${cat.color} shadow-lg group-hover:scale-110 transition-transform`}>
                                    {cat.icon}
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1">{cat.label}</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{cat.topics.length} Modules</p>
                                </div>
                            </div>
                            <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${cat.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : cat.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-slate-500'}`}>
                                {cat.status}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {phase === 'topic' && selectedCategory && (
                <Card className="p-10 space-y-10 bg-[#0A0C10] border-blue-500/20 rounded-[3rem]">
                    <div>
                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Subject Specialization</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Target your logic pattern</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(CATEGORIES.find(c => c.id === selectedCategory)?.topics || []).map(t => (
                            <button key={t} onClick={() => setSelectedTopic(t)} className={`p-4 rounded-xl text-[11px] font-bold text-left transition-all border ${selectedTopic === t ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-blue-500/30'}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Complexity Level</label>
                            <div className="flex gap-2">
                                {DIFFICULTY_CONFIG.map(d => (
                                    <button key={d.id} onClick={() => setDifficulty(d.id)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${difficulty === d.id ? 'bg-white text-slate-950 border-white' : 'bg-slate-950 border-white/5 text-slate-500'}`}>
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Button onClick={startPractice} disabled={!selectedTopic} className="h-14 bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl mt-auto">
                            Boot Quiz Unit
                        </Button>
                    </div>
                </Card>
            )}

            {phase === 'practice' && questions[currentIndex] && (
                <Card className="p-10 min-h-[500px] flex flex-col bg-[#0A0C10] border-white/5 rounded-[3rem]">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Module Entry: Q{currentIndex+1}</span>
                            <div className="h-1 w-24 bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${((currentIndex+1)/TOTAL_QUESTIONS)*100}%` }} />
                            </div>
                        </div>
                        <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-mono text-blue-400 italic">
                            <Clock size={12} className="inline mr-2" /> {formatTime(timer)}
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-10 leading-relaxed italic opacity-90">{questions[currentIndex].question}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
                        {questions[currentIndex].options.map((opt, i) => {
                            let s = 'bg-slate-900 border-white/5 text-slate-400 hover:border-blue-500/30';
                            if (selected !== null) {
                                if (i === questions[currentIndex].correctIndex) s = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-lg';
                                else if (selected === i) s = 'bg-rose-500/10 border-rose-500/50 text-rose-400';
                                else s = 'bg-slate-950 border-white/5 opacity-30 text-slate-700';
                            }
                            return (
                                <button key={i} onClick={() => handleOptionSelect(i)} disabled={selected !== null} className={`p-5 rounded-2xl border text-left text-sm font-medium transition-all ${s}`}>
                                    <span className="text-[10px] font-black text-slate-500 mr-4 uppercase">{String.fromCharCode(65+i)}</span> {opt}
                                </button>
                            );
                        })}
                    </div>
                    {showExplanation && (
                        <div className="p-6 rounded-[2rem] bg-blue-500/5 border border-blue-500/10 mb-8">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 italic">Mathematical Proof</p>
                            <p className="text-sm text-slate-300 leading-relaxed italic">{questions[currentIndex].explanation}</p>
                        </div>
                    )}
                    <div className="mt-auto pt-8 border-t border-white/5 flex justify-end">
                        <Button onClick={handleNext} disabled={selected === null} className="h-12 px-8 bg-white text-slate-950 hover:bg-white/90 text-[10px] font-black uppercase tracking-widest rounded-xl">
                            Proceed Logic <ArrowRight size={14} className="ml-2" />
                        </Button>
                    </div>
                </Card>
            )}

            {phase === 'result' && (
                <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-700">
                    <Card className="p-12 text-center bg-[#0A0C10] border-blue-500/20 rounded-[3rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-[100px] rounded-full -mr-40 -mt-40" />
                        <div className="w-20 h-20 rounded-[1.5rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400 shadow-2xl">
                            <Target size={40} />
                        </div>
                        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mt-6">Unit Analyzed</h3>
                        <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-500/50 py-4 tabular-nums">
                            {(stats.correct/stats.total*100).toFixed(0)}%
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { l: 'Units', v: stats.total, c: 'text-white' },
                                { l: 'Hits', v: stats.correct, c: 'text-emerald-400' },
                                { l: 'Miss', v: stats.wrong, c: 'text-rose-400' },
                                { l: 'Tempo', v: formatTime(stats.timeSpent), c: 'text-blue-400' },
                            ].map(i => (
                                <div key={i.l} className="p-5 rounded-2xl bg-slate-950 border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-2">{i.l}</p>
                                    <p className={`text-xl font-black italic ${i.c}`}>{i.v}</p>
                                </div>
                            ))}
                        </div>
                        <Button onClick={() => setPhase('select')} className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-2xl mt-4">
                            Relog Entry & Exit
                        </Button>
                    </Card>
                </div>
            )}
        </div>
    );

    const TopicsTab = (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CATEGORIES.map(cat => (
                <Card key={cat.id} className="p-8 bg-slate-900/40 border-white/5 rounded-[2.5rem] group hover:border-blue-500/30 transition-all">
                    <div className="flex justify-between items-start mb-8">
                        <div className={`w-12 h-12 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center ${cat.color} shadow-lg`}>
                            {cat.icon}
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{cat.completion || 0}% SYNC</span>
                        </div>
                    </div>
                    <h4 className="text-lg font-black text-white italic tracking-tighter uppercase mb-4">{cat.label}</h4>
                    <div className="flex flex-wrap gap-2">
                        {cat.topics.map(t => (
                            <span key={t} className="px-3 py-1 bg-slate-950 border border-white/5 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">{t}</span>
                        ))}
                    </div>
                </Card>
            ))}
        </div>
    );

    const [report, setReport] = useState<any>(null);

    useEffect(() => {
        const fetchReport = async () => {
            const { getProductivityReport } = await import('../services/analyticsService');
            const data = await getProductivityReport();
            setReport(data);
        };
        if (activeTab === 'portfolio') fetchReport();
    }, [activeTab]);

    const portfolioStats = [
        { l: 'Quantitative Processing', v: report ? `${report.quizAccuracy}%` : '88%', c: 'bg-blue-500' },
        { l: 'Verbal Logic Decay', v: '42%', c: 'bg-emerald-500' },
        { l: 'Pattern Recognition', v: '75%', c: 'bg-violet-500' },
        { l: 'Data Interpretation Sync', v: report ? `${Math.min(100, report.totalQuizzes * 5)}%` : '92%', c: 'bg-amber-500' },
    ];

    const PortfolioTab = (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 p-10 bg-slate-900/40 border-white/5 rounded-[3rem]">
                <h4 className="text-xl font-black text-white italic tracking-tighter uppercase mb-12 underline underline-offset-8 decoration-blue-500/30 font-black">Neural Performance Identity</h4>
                <div className="space-y-10">
                    {portfolioStats.map(s => (
                        <div key={s.l} className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <span>{s.l}</span><span className="text-white">{s.v}</span>
                            </div>
                            <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: s.v }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full ${s.c} shadow-[0_0_8px_rgba(59,130,246,0.3)]`} 
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
            <div className="space-y-6">
                {[
                    { l: 'Tier Status', v: report?.quizAccuracy > 80 ? 'Master Architect' : 'Strategic Apprentice', i: Trophy },
                    { l: 'Accuracy Index', v: report ? `${report.quizAccuracy}%` : '---', i: TrendingUp },
                    { l: 'Global Rank', v: report ? `#${Math.max(1, 100 - report.totalQuizzes)}/1.4k` : '---', i: Award },
                ].map((st, i) => (
                    <Card key={i} className="p-8 bg-[#0A0C10] border-blue-500/20 rounded-[2.5rem] flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <st.i size={24} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-600 uppercase mb-1">{st.l}</p>
                            <h5 className="text-sm font-black text-white italic uppercase tracking-tighter">{st.v}</h5>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-700 pb-12 space-y-8">
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5 gap-1 w-fit">
                {(['practice', 'topics', 'portfolio'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`h-11 px-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab 
                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                            : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'practice' && PracticeTab}
                    {activeTab === 'topics' && TopicsTab}
                    {activeTab === 'portfolio' && PortfolioTab}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AptitudeTrainer;
