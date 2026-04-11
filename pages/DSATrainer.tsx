import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card } from '../components/ui';
import {
    Code2, ArrowLeft, ChevronRight, CheckCircle2, XCircle, Clock,
    RefreshCw, Zap, Trophy, Lightbulb, BookOpen, Star, Eye, EyeOff, Target, Database,
    TrendingUp, Layout, ShieldCheck, ZapOff
} from 'lucide-react';
import { generateQuizQuestion } from '../services/geminiService';
import { trackToolUsage } from '../services/personalizationService';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface DSAQuestion {
    question: string;
    code?: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    hint?: string;
    approach?: string;
}

interface SessionStats {
    total: number;
    correct: number;
    wrong: number;
    skipped: number;
    timeSpent: number;
}

interface TopicConfig {
    id: string;
    label: string;
    subtopics: string[];
    companyTags: string[];
    status: Status;
    completion?: number;
}

type Status = 'new' | 'in-progress' | 'completed' | 'weak';

const DSA_TOPICS: TopicConfig[] = [
    {
        id: 'arrays', label: 'Arrays & Strings',
        subtopics: ['Two Pointer', 'Sliding Window', 'Kadane\'s Algorithm', 'Prefix Sum', 'Dutch National Flag', 'String Matching', 'Anagram Problems', 'Subarray Sum'],
        companyTags: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant'],
        status: 'completed', completion: 100
    },
    {
        id: 'linkedlist', label: 'Linked Lists',
        subtopics: ['Reversal', 'Cycle Detection', 'Merge Two Lists', 'Middle Element', 'Intersection Point', 'Palindrome Check'],
        companyTags: ['TCS', 'Persistent', 'LTIMindtree'],
        status: 'in-progress', completion: 60
    },
    {
        id: 'stacks-queues', label: 'Stacks & Queues',
        subtopics: ['Next Greater Element', 'Valid Parentheses', 'Min Stack', 'Queue using Stacks', 'Stock Span', 'Sliding Window Maximum'],
        companyTags: ['TCS', 'Infosys', 'Capgemini'],
        status: 'new'
    },
    {
        id: 'trees', label: 'Trees & BST',
        subtopics: ['Traversals (Inorder, Preorder, Postorder)', 'Height / Depth', 'Level Order', 'BST Search & Insert', 'Lowest Common Ancestor', 'Diameter', 'Mirror Tree'],
        companyTags: ['Persistent', 'LTIMindtree', 'TCS Digital'],
        status: 'weak'
    },
    {
        id: 'graphs', label: 'Graphs',
        subtopics: ['BFS', 'DFS', 'Shortest Path (Dijkstra)', 'Cycle Detection', 'Topological Sort', 'Connected Components', 'Adjacency Representation'],
        companyTags: ['LTIMindtree', 'Persistent', 'TCS Digital'],
        status: 'new'
    },
    {
        id: 'dp', label: 'Dynamic Programming',
        subtopics: ['Fibonacci Pattern', '0/1 Knapsack', 'Longest Common Subsequence', 'Coin Change', 'Longest Increasing Subsequence', 'Matrix Chain', 'Edit Distance'],
        companyTags: ['LTIMindtree', 'Persistent', 'TCS Digital'],
        status: 'new'
    },
    {
        id: 'sorting-searching', label: 'Sorting & Searching',
        subtopics: ['Binary Search', 'Merge Sort', 'Quick Sort', 'Counting Sort', 'Search in Rotated Array', 'Kth Largest Element', 'Peak Element'],
        companyTags: ['TCS', 'Infosys', 'Wipro', 'Cognizant', 'Capgemini'],
        status: 'new'
    },
    {
        id: 'recursion', label: 'Recursion & Backtracking',
        subtopics: ['Subset Generation', 'Permutations', 'N-Queens', 'Sudoku Solver', 'Rat in a Maze', 'Tower of Hanoi', 'Power Set'],
        companyTags: ['LTIMindtree', 'Persistent'],
        status: 'new'
    },
    {
        id: 'hashing', label: 'Hashing & Maps',
        subtopics: ['Two Sum', 'Frequency Count', 'Group Anagrams', 'Longest Substring Without Repeating', 'Subarray with Given Sum', 'First Non-Repeating Character'],
        companyTags: ['TCS', 'Infosys', 'Wipro', 'Accenture'],
        status: 'new'
    },
    {
        id: 'greedy', label: 'Greedy Algorithms',
        subtopics: ['Activity Selection', 'Fractional Knapsack', 'Job Sequencing', 'Huffman Coding', 'Minimum Platforms', 'Minimum Coins'],
        companyTags: ['Cognizant', 'Capgemini', 'TCS'],
        status: 'new'
    },
];

const DIFFICULTY_CONFIG: { id: Difficulty; label: string; color: string; bgColor: string }[] = [
    { id: 'Easy', label: 'Easy', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    { id: 'Medium', label: 'Medium', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    { id: 'Hard', label: 'Hard', color: 'text-rose-400', bgColor: 'bg-rose-500/20' },
];

const TOTAL_QUESTIONS = 5;

const DSATrainer: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'practice' | 'roadmap' | 'insights'>('practice');
    const [phase, setPhase] = useState<'select' | 'subtopic' | 'practice' | 'result'>('select');
    const [selectedTopic, setSelectedTopic] = useState<TopicConfig | null>(null);
    const [selectedSubtopic, setSelectedSubtopic] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('Medium');

    const [questions, setQuestions] = useState<DSAQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [stats, setStats] = useState<SessionStats>({ total: 0, correct: 0, wrong: 0, skipped: 0, timeSpent: 0 });
    const [timer, setTimer] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => { trackToolUsage('placement'); }, []);

    useEffect(() => {
        if (phase === 'practice') {
            timerRef.current = setInterval(() => setTimer(prev => prev + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase]);

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const generateQuestion = useCallback(async () => {
        if (!selectedTopic) return;
        setIsGenerating(true);
        try {
            const prompt = `Generate a ${difficulty} difficulty DSA question about "${selectedSubtopic}" (under "${selectedTopic.label}") for an Indian IT placement test. Return JSON with: question, code, options (4), correctOptionIndex, explanation, hint, approach.`;
            const jsonStr = await generateQuizQuestion(prompt);
            const parsed = JSON.parse(jsonStr);
            const newQ: DSAQuestion = {
                question: parsed.question,
                code: parsed.code || undefined,
                options: parsed.options,
                correctIndex: parsed.correctOptionIndex,
                explanation: parsed.explanation || '',
                hint: parsed.hint,
                approach: parsed.approach,
            };
            setQuestions(prev => [...prev, newQ]);
        } catch (error) {
            console.error('DSA gen error:', error);
        } finally {
            setIsGenerating(false);
        }
    }, [selectedTopic, selectedSubtopic, difficulty]);

    const startPractice = async () => {
        setQuestions([]); setCurrentIndex(0); setSelected(null); setShowExplanation(false); setShowHint(false); setStats({ total: 0, correct: 0, wrong: 0, skipped: 0, timeSpent: 0 }); setTimer(0); setPhase('practice');
        await generateQuestion();
    };

    const handleOptionSelect = (idx: number) => {
        if (selected !== null) return;
        setSelected(idx); setShowExplanation(true);
        const isCorrect = idx === questions[currentIndex].correctIndex;
        if (isCorrect) setStats(prev => ({ ...prev, total: prev.total + 1, correct: prev.correct + 1 }));
        else setStats(prev => ({ ...prev, total: prev.total + 1, wrong: prev.wrong + 1 }));
    };

    const handleNext = async () => {
        setSelected(null); setShowExplanation(false); setShowHint(false);
        if (currentIndex + 1 < TOTAL_QUESTIONS) {
            setCurrentIndex(prev => prev + 1);
            await generateQuestion();
        } else {
            setStats(prev => ({ ...prev, timeSpent: timer }));
            setPhase('result');
        }
    };

    const PracticeTab = (
        <div className="space-y-6">
            {phase !== 'select' && phase !== 'result' && (
                <Button variant="ghost" onClick={() => setPhase(phase === 'subtopic' ? 'select' : phase === 'practice' ? 'subtopic' : 'select')} className="p-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={18} className="mr-2" /> Back
                </Button>
            )}

            {phase === 'select' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {DSA_TOPICS.map(topic => (
                        <button
                            key={topic.id}
                            onClick={() => { setSelectedTopic(topic); setPhase('subtopic'); }}
                            className="group p-6 bg-slate-900/40 rounded-2xl border border-white/5 hover:border-violet-500/30 transition-all text-left relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 blur-[40px] rounded-full -mr-16 -mt-16" />
                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className="p-3 rounded-xl bg-slate-950 border border-white/5 group-hover:border-violet-500/50 transition-colors shadow-lg">
                                    <Database size={20} className="text-violet-400" />
                                </div>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                    topic.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                    topic.status === 'in-progress' ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-slate-500'
                                }`}>
                                    {topic.status}
                                </span>
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-2 relative z-10">{topic.label}</h3>
                            <div className="flex flex-wrap gap-1 relative z-10">
                                {topic.companyTags.slice(0, 3).map(tag => (
                                    <span key={tag} className="text-[8px] font-black px-2 py-0.5 rounded bg-white/5 text-slate-500 border border-white/5 uppercase">{tag}</span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {phase === 'subtopic' && selectedTopic && (
                <Card className="p-10 space-y-10 bg-[#0A0C10] border-violet-500/20 rounded-[3rem]">
                    <div>
                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-1">{selectedTopic.label}</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Choose your sub-module focus</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {selectedTopic.subtopics.map(st => (
                            <button
                                key={st}
                                onClick={() => setSelectedSubtopic(st)}
                                className={`p-4 rounded-xl text-[11px] font-bold text-left transition-all border ${selectedSubtopic === st
                                    ? 'bg-violet-600 border-violet-500 text-white shadow-xl shadow-violet-600/20'
                                    : 'bg-slate-900 border-white/5 text-slate-400 hover:border-violet-500/30'
                                }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                    <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Challenge Depth</label>
                        <div className="flex gap-4">
                            {DIFFICULTY_CONFIG.map(d => (
                                <button
                                    key={d.id}
                                    onClick={() => setDifficulty(d.id)}
                                    className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${difficulty === d.id
                                        ? 'bg-white text-slate-950 border-white'
                                        : 'bg-slate-950 border-white/5 text-slate-500 hover:text-white'
                                    }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Button onClick={startPractice} disabled={!selectedSubtopic} className="w-full h-14 bg-violet-600 hover:bg-violet-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-violet-600/30">
                        Initialize Engine
                    </Button>
                </Card>
            )}

            {phase === 'practice' && questions[currentIndex] && (
                <Card className="p-10 min-h-[500px] flex flex-col bg-[#0A0C10] border-white/5 rounded-[3rem]">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Q{currentIndex + 1} / {TOTAL_QUESTIONS}</span>
                            <div className="h-1 w-32 bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / TOTAL_QUESTIONS) * 100}%` }} />
                            </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 italic">
                            <Clock size={12} className="text-violet-500" /> {formatTime(timer)}
                        </span>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-8 leading-relaxed max-w-4xl italic transition-all duration-500">
                        {questions[currentIndex].question}
                    </h2>

                    {questions[currentIndex].code && (
                        <div className="relative group mb-8">
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur opacity-25" />
                            <pre className="relative p-6 rounded-xl bg-slate-950 border border-white/5 text-[13px] text-emerald-400 font-mono overflow-x-auto">
                                {questions[currentIndex].code}
                            </pre>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                        {questions[currentIndex].options.map((opt, idx) => {
                            let stateClass = 'bg-slate-900 border-white/5 hover:border-violet-500/40 text-slate-300';
                            if (selected !== null) {
                                if (idx === questions[currentIndex].correctIndex) stateClass = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/5';
                                else if (selected === idx) stateClass = 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-lg shadow-rose-500/5';
                                else stateClass = 'bg-slate-950 border-white/5 opacity-30 text-slate-600';
                            }
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionSelect(idx)}
                                    disabled={selected !== null}
                                    className={`w-full p-5 rounded-2xl border text-left transition-all ${stateClass} flex items-center justify-between group`}
                                >
                                    <span className="flex items-center gap-4">
                                        <span className="text-[10px] font-black text-slate-500 group-hover:text-violet-400 transition-colors uppercase">{String.fromCharCode(65 + idx)}</span>
                                        <span className="text-sm font-medium tracking-tight">{opt}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {showExplanation && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mb-8">
                            <div className="p-6 rounded-[1.5rem] bg-indigo-500/5 border border-indigo-500/10 shadow-inner">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Lightbulb size={12} /> Execution Logic
                                </p>
                                <p className="text-[13px] text-slate-300 leading-relaxed italic">{questions[currentIndex].explanation}</p>
                            </div>
                        </motion.div>
                    )}

                    <div className="mt-auto pt-8 border-t border-white/5 flex justify-between items-center">
                        <div className="flex gap-4">
                            {selected === null && (
                                <Button variant="ghost" onClick={handleNext} className="text-[10px] text-slate-500 font-black uppercase tracking-widest hover:text-white transition-colors">Skip Cycle</Button>
                            )}
                        </div>
                        <Button 
                            onClick={handleNext} 
                            disabled={selected === null}
                            className="h-12 px-8 bg-white text-slate-950 hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl"
                        >
                            Next Logic Unit <ChevronRight size={14} className="ml-2" />
                        </Button>
                    </div>
                </Card>
            )}

            {phase === 'result' && (
                <div className="max-w-3xl mx-auto">
                    <Card className="p-12 text-center space-y-10 bg-[#0A0C10] border-violet-500/20 rounded-[3rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/5 blur-[100px] rounded-full -mr-40 -mt-40" />
                        <div className="w-24 h-24 rounded-[2rem] bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto text-violet-400 shadow-2xl ring-4 ring-violet-500/5">
                            <Trophy size={48} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Simulation Complete</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{selectedSubtopic} • {difficulty} Level</p>
                        </div>
                        <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-violet-500/50 py-2 tabular-nums">
                            {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { label: 'Units', value: stats.total, color: 'text-white' },
                                { label: 'Correct', value: stats.correct, color: 'text-emerald-400' },
                                { label: 'Optimality', value: 'High', color: 'text-violet-400' },
                                { label: 'Cycle Time', value: formatTime(stats.timeSpent), color: 'text-blue-400' },
                            ].map(item => (
                                <div key={item.label} className="p-5 rounded-2xl bg-slate-950 border border-white/5 group hover:border-violet-500/20 transition-all">
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-2">{item.label}</p>
                                    <p className={`text-xl font-black italic tracking-tight ${item.color}`}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                        <Button onClick={() => setPhase('select')} className="w-full h-14 bg-violet-600 hover:bg-violet-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-violet-600/30">
                            Persist Log & Exit
                        </Button>
                    </Card>
                </div>
            )}

            {isGenerating && phase === 'practice' && !questions[currentIndex] && (
                <div className="h-[500px] flex flex-col items-center justify-center space-y-6 opacity-40">
                    <RefreshCw size={48} className="text-violet-500 animate-spin" strokeWidth={1} />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Compiling Logic...</p>
                </div>
            )}
        </div>
    );

    const RoadmapTab = (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 p-10 bg-slate-900/40 border-white/5 rounded-[3rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-[80px] rounded-full -mr-32 -mt-32" />
                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-12 underline underline-offset-8 decoration-violet-500/30">Algorithm Evolution Path</h3>
                <div className="space-y-16 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-white/10">
                    {[
                        { step: 'Phase 01', title: 'Linear Structures', items: 'Arrays, Strings, LL', state: 'done' },
                        { step: 'Phase 02', title: 'Non-Linear Logic', items: 'Trees, BST, Heaps', state: 'active' },
                        { step: 'Phase 03', title: 'Network Theory', items: 'Graphs, DSU', state: 'locked' },
                        { step: 'Phase 04', title: 'Global Optimization', items: 'DP, Backtracking', state: 'locked' },
                    ].map((p, i) => (
                        <div key={i} className="flex gap-10 relative">
                            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all ${
                                p.state === 'done' ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20 shadow-lg' :
                                p.state === 'active' ? 'bg-violet-600 border-violet-600 text-white shadow-violet-600/40 shadow-xl' :
                                'bg-slate-950 border-white/10 text-slate-700'
                            }`}>
                                {p.state === 'done' ? <CheckCircle2 size={20} /> : <Zap size={18} />}
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{p.step}</p>
                                <h4 className={`text-base font-black italic tracking-tight ${p.state === 'locked' ? 'text-slate-700' : 'text-white'}`}>{p.title}</h4>
                                <p className="text-[11px] text-slate-500 font-medium italic mt-1">{p.items}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
            <div className="space-y-6">
                <Card className="p-8 bg-violet-600/5 border-violet-500/20 rounded-[2.5rem]">
                    <h4 className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-6">Expertise Matrix</h4>
                    <div className="space-y-6">
                        {['Array Logic', 'Tree Traversal', 'Recursion'].map(skill => (
                            <div key={skill} className="space-y-2">
                                <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                    <span>{skill}</span>
                                    <span className="text-white">82%</span>
                                </div>
                                <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                                    <div className="h-full bg-violet-500/40 w-[82%]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );

    const InsightsTab = (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
                { label: 'Cycle Accuracy', value: '88.4%', trend: 'surging', icon: TrendingUp },
                { label: 'Avg Complexity', value: 'O(log N)', trend: 'optimizing', icon: Zap },
                { label: 'Patterns Unlocked', value: '24/100', trend: 'rising', icon: Star },
                { label: 'Neural Score', value: '740', trend: 'elite', icon: Trophy },
            ].map(stat => (
                <Card key={stat.label} className="p-8 bg-[#0A0C10] border-white/5 rounded-[2.5rem] text-center group hover:border-violet-500/20 transition-all">
                    <stat.icon size={24} className="mx-auto mb-6 text-slate-700 group-hover:text-violet-500 transition-colors" />
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">{stat.label}</p>
                    <p className="text-3xl font-black text-white italic tracking-tighter mb-2">{stat.value}</p>
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">{stat.trend}</span>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-4">
                <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5 gap-1">
                    {(['practice', 'roadmap', 'insights'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`h-11 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab 
                                ? 'bg-violet-600 text-white shadow-xl shadow-violet-600/20' 
                                : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
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
                    {activeTab === 'roadmap' && RoadmapTab}
                    {activeTab === 'insights' && InsightsTab}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default DSATrainer;
