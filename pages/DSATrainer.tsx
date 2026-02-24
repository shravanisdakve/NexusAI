import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card } from '../components/ui';
import {
    Code2, ArrowLeft, ChevronRight, CheckCircle2, XCircle, Clock,
    RefreshCw, Zap, Trophy, Lightbulb, BookOpen, Star, Eye, EyeOff
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
    emoji: string;
    subtopics: string[];
    companyTags: string[];
}

const DSA_TOPICS: TopicConfig[] = [
    {
        id: 'arrays', label: 'Arrays & Strings', emoji: '📊',
        subtopics: ['Two Pointer', 'Sliding Window', 'Kadane\'s Algorithm', 'Prefix Sum', 'Dutch National Flag', 'String Matching', 'Anagram Problems', 'Subarray Sum'],
        companyTags: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant'],
    },
    {
        id: 'linkedlist', label: 'Linked Lists', emoji: '🔗',
        subtopics: ['Reversal', 'Cycle Detection', 'Merge Two Lists', 'Middle Element', 'Intersection Point', 'Palindrome Check'],
        companyTags: ['TCS', 'Persistent', 'LTIMindtree'],
    },
    {
        id: 'stacks-queues', label: 'Stacks & Queues', emoji: '📚',
        subtopics: ['Next Greater Element', 'Valid Parentheses', 'Min Stack', 'Queue using Stacks', 'Stock Span', 'Sliding Window Maximum'],
        companyTags: ['TCS', 'Infosys', 'Capgemini'],
    },
    {
        id: 'trees', label: 'Trees & BST', emoji: '🌳',
        subtopics: ['Traversals (Inorder, Preorder, Postorder)', 'Height / Depth', 'Level Order', 'BST Search & Insert', 'Lowest Common Ancestor', 'Diameter', 'Mirror Tree'],
        companyTags: ['Persistent', 'LTIMindtree', 'TCS Digital'],
    },
    {
        id: 'graphs', label: 'Graphs', emoji: '🕸️',
        subtopics: ['BFS', 'DFS', 'Shortest Path (Dijkstra)', 'Cycle Detection', 'Topological Sort', 'Connected Components', 'Adjacency Representation'],
        companyTags: ['LTIMindtree', 'Persistent', 'TCS Digital'],
    },
    {
        id: 'dp', label: 'Dynamic Programming', emoji: '🧩',
        subtopics: ['Fibonacci Pattern', '0/1 Knapsack', 'Longest Common Subsequence', 'Coin Change', 'Longest Increasing Subsequence', 'Matrix Chain', 'Edit Distance'],
        companyTags: ['LTIMindtree', 'Persistent', 'TCS Digital'],
    },
    {
        id: 'sorting-searching', label: 'Sorting & Searching', emoji: '🔍',
        subtopics: ['Binary Search', 'Merge Sort', 'Quick Sort', 'Counting Sort', 'Search in Rotated Array', 'Kth Largest Element', 'Peak Element'],
        companyTags: ['TCS', 'Infosys', 'Wipro', 'Cognizant', 'Capgemini'],
    },
    {
        id: 'recursion', label: 'Recursion & Backtracking', emoji: '🔄',
        subtopics: ['Subset Generation', 'Permutations', 'N-Queens', 'Sudoku Solver', 'Rat in a Maze', 'Tower of Hanoi', 'Power Set'],
        companyTags: ['LTIMindtree', 'Persistent'],
    },
    {
        id: 'hashing', label: 'Hashing & Maps', emoji: '#️⃣',
        subtopics: ['Two Sum', 'Frequency Count', 'Group Anagrams', 'Longest Substring Without Repeating', 'Subarray with Given Sum', 'First Non-Repeating Character'],
        companyTags: ['TCS', 'Infosys', 'Wipro', 'Accenture'],
    },
    {
        id: 'greedy', label: 'Greedy Algorithms', emoji: '💰',
        subtopics: ['Activity Selection', 'Fractional Knapsack', 'Job Sequencing', 'Huffman Coding', 'Minimum Platforms', 'Minimum Coins'],
        companyTags: ['Cognizant', 'Capgemini', 'TCS'],
    },
];

const DIFFICULTY_CONFIG: { id: Difficulty; label: string; color: string; bgColor: string }[] = [
    { id: 'Easy', label: '🟢 Easy', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    { id: 'Medium', label: '🟡 Medium', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    { id: 'Hard', label: '🔴 Hard', color: 'text-rose-400', bgColor: 'bg-rose-500/20' },
];

const TOTAL_QUESTIONS = 5;

const DSATrainer: React.FC = () => {
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
    const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

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
            const prompt = `Generate a ${difficulty} difficulty DSA/coding question about "${selectedSubtopic}" (under "${selectedTopic.label}") for an Indian IT campus placement test.

The question should test conceptual understanding or code output prediction — NOT require writing full code.

Return JSON with:
- question (string): the problem statement, can include a short code snippet in the question itself
- code (string, optional): a short code snippet (max 10 lines) if the question involves code tracing/output prediction. Use Python or Java.
- options (array of exactly 4 strings): possible answers
- correctOptionIndex (number, 0-3): index of the correct option
- explanation (string): clear explanation of WHY the correct answer is right, with complexity analysis if applicable
- timeComplexity (string, optional): e.g. "O(n log n)"
- spaceComplexity (string, optional): e.g. "O(1)"
- hint (string): a subtle hint that doesn't give away the answer
- approach (string): the optimal approach/algorithm name to solve this type of problem`;

            const jsonStr = await generateQuizQuestion(prompt);
            const parsed = JSON.parse(jsonStr);
            const newQ: DSAQuestion = {
                question: parsed.question,
                code: parsed.code || undefined,
                options: parsed.options,
                correctIndex: parsed.correctOptionIndex,
                explanation: parsed.explanation || '',
                timeComplexity: parsed.timeComplexity,
                spaceComplexity: parsed.spaceComplexity,
                hint: parsed.hint,
                approach: parsed.approach,
            };
            setQuestions(prev => [...prev, newQ]);
        } catch (error) {
            console.error('Failed to generate DSA question:', error);
        } finally {
            setIsGenerating(false);
        }
    }, [selectedTopic, selectedSubtopic, difficulty]);

    const startPractice = async () => {
        setQuestions([]);
        setCurrentIndex(0);
        setSelected(null);
        setShowExplanation(false);
        setShowHint(false);
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
        setShowHint(false);
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

    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {phase !== 'select' && phase !== 'result' && (
                <Button variant="ghost" onClick={() => setPhase(phase === 'subtopic' ? 'select' : phase === 'practice' ? 'subtopic' : 'select')} className="p-2 text-slate-400">
                    <ArrowLeft size={20} /> Back
                </Button>
            )}

            {/* PHASE 1: Topic Selection */}
            {phase === 'select' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {DSA_TOPICS.map(topic => (
                            <button
                                key={topic.id}
                                onClick={() => { setSelectedTopic(topic); setPhase('subtopic'); }}
                                className="p-6 rounded-2xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-500 transition-all text-left group hover:scale-[1.02]"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-2xl">{topic.emoji}</span>
                                    <h3 className="text-lg font-bold text-white">{topic.label}</h3>
                                </div>
                                <p className="text-xs text-slate-500 mb-3">{topic.subtopics.length} subtopics</p>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {topic.subtopics.slice(0, 3).map(st => (
                                        <span key={st} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-700">{st}</span>
                                    ))}
                                    {topic.subtopics.length > 3 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-500">+{topic.subtopics.length - 3}</span>}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {topic.companyTags.slice(0, 3).map(tag => (
                                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">{tag}</span>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* PHASE 2: Subtopic & Difficulty */}
            {phase === 'subtopic' && selectedTopic && (
                <div className="max-w-3xl mx-auto">
                    <Card className="p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{selectedTopic.emoji}</span>
                            <div>
                                <h3 className="text-xl font-bold text-white">{selectedTopic.label}</h3>
                                <p className="text-xs text-slate-400">Select a subtopic and difficulty</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-bold text-slate-300 mb-3">Subtopic</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {selectedTopic.subtopics.map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setSelectedSubtopic(st)}
                                        className={`p-3 rounded-xl text-sm text-left transition-all border ${selectedSubtopic === st
                                            ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                                            }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-bold text-slate-300 mb-3">Difficulty</p>
                            <div className="flex gap-3">
                                {DIFFICULTY_CONFIG.map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => setDifficulty(d.id)}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${difficulty === d.id
                                            ? `${d.bgColor} border-slate-500 text-white`
                                            : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-600'
                                            }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Asked By</p>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedTopic.companyTags.map(tag => (
                                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">{tag}</span>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={startPractice}
                            disabled={!selectedSubtopic}
                            className="w-full py-4 text-lg font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-xl"
                        >
                            <Code2 className="w-5 h-5 mr-2" /> Start DSA Practice ({TOTAL_QUESTIONS} Questions)
                        </Button>
                    </Card>
                </div>
            )}

            {/* PHASE 3: Practice */}
            {phase === 'practice' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        <Card className="p-8 min-h-[400px] flex flex-col">
                            {/* Progress */}
                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / TOTAL_QUESTIONS) * 100}%` }} />
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Q {currentIndex + 1} / {TOTAL_QUESTIONS}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' : difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        {difficulty}
                                    </span>
                                </div>
                                <span className="text-xs font-mono text-slate-400 flex items-center gap-1"><Clock size={12} /> {formatTime(timer)}</span>
                            </div>

                            {questions[currentIndex] ? (
                                <>
                                    <h2 className="text-lg font-bold text-white mb-4 leading-relaxed">{questions[currentIndex].question}</h2>

                                    {questions[currentIndex].code && (
                                        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-700 text-sm text-emerald-300 font-mono mb-6 overflow-x-auto whitespace-pre-wrap">
                                            {questions[currentIndex].code}
                                        </pre>
                                    )}

                                    {/* Hint */}
                                    {!showExplanation && questions[currentIndex].hint && (
                                        <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-2 text-xs text-amber-400 mb-4 hover:text-amber-300 transition-colors">
                                            {showHint ? <EyeOff size={14} /> : <Eye size={14} />} {showHint ? 'Hide Hint' : 'Show Hint'}
                                        </button>
                                    )}
                                    {showHint && !showExplanation && (
                                        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-4">
                                            <p className="text-xs text-amber-300"><Lightbulb size={12} className="inline mr-1" /> {questions[currentIndex].hint}</p>
                                        </div>
                                    )}

                                    <div className="space-y-3 mb-6 flex-1">
                                        {questions[currentIndex].options.map((opt, idx) => {
                                            let stateClass = 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:border-slate-500';
                                            if (selected !== null) {
                                                if (idx === questions[currentIndex].correctIndex) stateClass = 'bg-emerald-500/15 border-emerald-500 text-emerald-300';
                                                else if (selected === idx) stateClass = 'bg-red-500/15 border-red-500 text-red-300';
                                                else stateClass = 'bg-slate-800/30 border-slate-700/50 opacity-50';
                                            }
                                            return (
                                                <button key={idx} onClick={() => handleOptionSelect(idx)} disabled={selected !== null}
                                                    className={`w-full p-4 rounded-xl border text-left transition-all ${stateClass} flex items-center justify-between`}>
                                                    <span className="flex items-center gap-3">
                                                        <span className="text-slate-500 font-bold">{String.fromCharCode(65 + idx)}.</span>
                                                        <span className="font-mono text-sm">{opt}</span>
                                                    </span>
                                                    {selected !== null && idx === questions[currentIndex].correctIndex && <CheckCircle2 size={18} className="text-emerald-500" />}
                                                    {selected !== null && selected === idx && idx !== questions[currentIndex].correctIndex && <XCircle size={18} className="text-red-500" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {showExplanation && (
                                        <div className="space-y-3 mb-6">
                                            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                                <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Explanation</p>
                                                <p className="text-sm text-slate-300 leading-relaxed">{questions[currentIndex].explanation}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {questions[currentIndex].approach && (
                                                    <div className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                                                        <span className="text-[10px] font-bold text-violet-300">🎯 {questions[currentIndex].approach}</span>
                                                    </div>
                                                )}
                                                {questions[currentIndex].timeComplexity && (
                                                    <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                                        <span className="text-[10px] font-bold text-cyan-300">⏱ Time: {questions[currentIndex].timeComplexity}</span>
                                                    </div>
                                                )}
                                                {questions[currentIndex].spaceComplexity && (
                                                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                        <span className="text-[10px] font-bold text-emerald-300">💾 Space: {questions[currentIndex].spaceComplexity}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-6 border-t border-slate-700/50">
                                        {selected === null ? (
                                            <Button variant="ghost" onClick={handleSkip} className="text-slate-400">Skip</Button>
                                        ) : <div />}
                                        <Button onClick={handleNext} disabled={selected === null || isGenerating} isLoading={isGenerating}
                                            className="gap-2 bg-white text-slate-900 hover:bg-slate-200">
                                            {currentIndex < TOTAL_QUESTIONS - 1 ? 'Next Question' : 'Finish'} <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <RefreshCw className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-4" />
                                        <p className="text-slate-400">Generating DSA question...</p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-4">
                        <Card className="p-5 border-slate-700 bg-slate-900/50">
                            <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3">Session</h5>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm"><span className="text-slate-400">Correct</span><span className="font-bold text-emerald-400">{stats.correct}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-slate-400">Wrong</span><span className="font-bold text-rose-400">{stats.wrong}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-slate-400">Skipped</span><span className="font-bold text-slate-400">{stats.skipped}</span></div>
                            </div>
                        </Card>
                        <Card className="p-5 border-slate-700">
                            <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Topic</h5>
                            <p className="text-sm font-bold text-white">{selectedSubtopic}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{selectedTopic?.label}</p>
                        </Card>
                        <Card className="p-5 border-violet-500/20 bg-violet-500/5">
                            <h5 className="text-[10px] font-black uppercase text-violet-400 tracking-widest mb-2">💡 Pro Tip</h5>
                            <p className="text-xs text-slate-400 leading-relaxed">Focus on understanding the approach and time complexity. Companies test pattern recognition more than syntax.</p>
                        </Card>
                    </div>
                </div>
            )}

            {/* PHASE 4: Results */}
            {phase === 'result' && (
                <div className="max-w-2xl mx-auto">
                    <Card className="p-10 text-center space-y-8 bg-gradient-to-br from-slate-800/80 to-slate-900">
                        <Trophy className="w-20 h-20 text-amber-400 mx-auto" />
                        <h3 className="text-3xl font-black text-white">DSA Practice Complete!</h3>
                        <p className="text-slate-400">{selectedSubtopic} • {difficulty} • {selectedTopic?.label}</p>

                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                            {accuracy}%
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { label: 'Total', value: stats.total, color: 'text-white' },
                                { label: 'Correct', value: stats.correct, color: 'text-emerald-400' },
                                { label: 'Wrong', value: stats.wrong, color: 'text-rose-400' },
                                { label: 'Time', value: formatTime(stats.timeSpent), color: 'text-blue-400' },
                            ].map(item => (
                                <div key={item.label} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                                    <p className="text-[10px] font-black text-slate-500 uppercase">{item.label}</p>
                                    <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 text-left">
                            <p className="text-xs font-bold text-violet-400 mb-2"><Star size={12} className="inline mr-1" /> Next Steps</p>
                            <ul className="space-y-1.5 text-sm text-slate-300">
                                {accuracy >= 80 ? (
                                    <>
                                        <li>• Great score! Try increasing the difficulty level</li>
                                        <li>• Move to related topics for broader coverage</li>
                                    </>
                                ) : accuracy >= 50 ? (
                                    <>
                                        <li>• Review the explanations for wrong answers</li>
                                        <li>• Practice similar problems on the same topic</li>
                                    </>
                                ) : (
                                    <>
                                        <li>• Revisit the theory for this topic first</li>
                                        <li>• Start with Easy difficulty and work your way up</li>
                                        <li>• Focus on understanding the patterns over memorization</li>
                                    </>
                                )}
                            </ul>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" onClick={() => setPhase('subtopic')} className="w-full">
                                Try Another Topic
                            </Button>
                            <Button onClick={startPractice} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600">
                                <RefreshCw className="w-4 h-4 mr-2" /> Retry Same
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default DSATrainer;
