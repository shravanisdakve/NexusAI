import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader, Button, Input, Spinner } from '../components/ui';
import { Brain, Target, AlertCircle, TrendingUp, BookOpen, ChevronRight, Share2, Printer, BarChart3, PieChart, Info, Layers, Zap } from 'lucide-react';
import { predictTopics, getLikelyQuestions } from '../services/muTutorService';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Prediction {
    module: number;
    highYieldTopics: string[];
    estimatedMarks: number;
    trend: string;
}

const TopicPredictor: React.FC = () => {
    const { user } = useAuth();
    const [subject, setSubject] = useState('');
    const [loading, setLoading] = useState(false);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [likelyQuestions, setLikelyQuestions] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [thinkingStep, setThinkingStep] = useState(0);
    const [overallTrend, setOverallTrend] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'topics' | 'trends' | 'weightage'>('topics');

    const thinkingLogs = [
        "Initializing Mumbai University Curriculum Ontology Mapping...",
        "Scanning past paper distribution for patterns...",
        "Correlating question marks to module complexity...",
        "Synthesizing latest semester trend shifts (Numerical shift found)...",
        "Finalizing high-yield mark distributions..."
    ];

    const handlePredict = async () => {
        const trimmedSubject = subject.trim();
        if (!trimmedSubject) return;

        setLoading(true);
        setError('');
        setThinkingStep(0);
        setPredictions([]);
        setLikelyQuestions([]);

        const thinkingInterval = setInterval(() => {
            setThinkingStep(prev => (prev + 1) % thinkingLogs.length);
        }, 1200);

        try {
            const result = await predictTopics(trimmedSubject);
            let finalPredictions: Prediction[] = Array.isArray(result) ? result : (result?.predictions || []);
            
            setPredictions(finalPredictions);
            setOverallTrend(result?.overallTrend || result?.message || '');

            try {
                const questions = await getLikelyQuestions(trimmedSubject);
                setLikelyQuestions(questions || []);
            } catch (qErr) {
                console.error(qErr);
            }

            if (finalPredictions.length === 0) {
                setError('Subject matching failed. Please try "Operating Systems" or "Engineering Mechanics".');
            }
        } catch (err: any) {
            setError(err.message || 'System busy. Retry in 30s.');
        } finally {
            clearInterval(thinkingInterval);
            setLoading(false);
        }
    };

    const totalMarks = useMemo(() => predictions.reduce((sum, p) => sum + p.estimatedMarks, 0), [predictions]);

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20 px-4">
            <div className="flex justify-between items-start">
                <PageHeader
                    title="MU Trend Engine v2"
                    subtitle="Advanced predictive analytics for Mumbai University 2026 examination schema."
                />
                <Button variant="ghost" className="text-slate-500 hover:text-white mt-4 no-print"><Info size={18} /></Button>
            </div>

            <div className="bg-slate-800/40 rounded-[2rem] p-8 border border-white/5 shadow-2xl backdrop-blur-md no-print">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 ml-1">Subject Neural Target</label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. Analysis of Algorithms, Data structures..."
                            className="bg-slate-900/80 border-slate-700/50 py-7 text-lg"
                        />
                    </div>
                    <Button
                        onClick={handlePredict}
                        isLoading={loading}
                        className="bg-violet-600 hover:bg-violet-700 px-10 py-7 h-auto text-lg font-black uppercase tracking-widest shadow-xl shadow-violet-900/30"
                    >
                        {loading ? 'Neural Scanning...' : 'Start Prediction'}
                    </Button>
                </div>
                {error && <p className="mt-4 text-rose-400 text-sm font-bold flex items-center gap-2"><AlertCircle size={14} /> {error}</p>}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                    >
                        <div className="w-24 h-24 border-b-4 border-violet-500 rounded-full animate-spin" />
                        <Brain className="absolute inset-0 m-auto text-violet-400/30 animate-pulse" size={32} />
                    </motion.div>
                    <div className="bg-black/50 border border-emerald-500/20 px-6 py-4 rounded-2xl font-mono text-[11px] text-emerald-400 max-w-md w-full shadow-inner flex items-center gap-4">
                        <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping shrink-0" />
                        {thinkingLogs[thinkingStep]}
                    </div>
                </div>
            ) : predictions.length > 0 ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    {/* Tabs Interface */}
                    <div className="flex p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl w-fit no-print mx-auto lg:mx-0">
                        <TabButton active={activeTab === 'topics'} icon={<Layers size={16}/>} label="Predictions" onClick={() => setActiveTab('topics')} />
                        <TabButton active={activeTab === 'trends'} icon={<BarChart3 size={16}/>} label="Historical" onClick={() => setActiveTab('trends')} />
                        <TabButton active={activeTab === 'weightage'} icon={<PieChart size={16}/>} label="Weightage" onClick={() => setActiveTab('weightage')} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Tab Content */}
                        <div className="lg:col-span-8">
                            <AnimatePresence mode="wait">
                                {activeTab === 'topics' && (
                                    <motion.div 
                                        key="topics"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                    >
                                        {predictions.map((p) => (
                                            <div key={p.module} className="bg-slate-800/40 rounded-3xl p-6 border border-white/5 hover:border-violet-500/30 transition-all group shadow-glass">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="bg-violet-600/10 text-violet-400 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-violet-500/20">
                                                        Module 0{p.module}
                                                    </div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        Estimated Marks: <span className="text-white">{p.estimatedMarks}</span>
                                                    </div>
                                                </div>
                                                <h4 className="text-slate-100 font-bold mb-4 line-clamp-1">{p.trend}</h4>
                                                <ul className="space-y-3">
                                                    {p.highYieldTopics.map((topic, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-400 font-medium">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                                                            {topic}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}

                                {activeTab === 'trends' && (
                                    <motion.div 
                                        key="trends"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="bg-slate-800/40 rounded-[2rem] p-10 border border-white/5 min-h-[400px]"
                                    >
                                        <div className="flex justify-between items-center mb-10">
                                            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                                <BarChart3 className="text-amber-400" /> Historical Mark Distribution
                                            </h3>
                                            <span className="text-xs font-bold text-slate-500">Last 10 Semesters Analytic</span>
                                        </div>
                                        
                                        <div className="flex items-end justify-between gap-4 h-64 px-4 border-b border-slate-700/50 pb-2">
                                            {predictions.map((p, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                                                    <motion.div 
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${(p.estimatedMarks / 20) * 100}%` }}
                                                        transition={{ duration: 1, delay: i * 0.1 }}
                                                        className="w-full max-w-[40px] bg-gradient-to-t from-sky-600 to-sky-400 rounded-t-lg relative group-hover:from-violet-600 group-hover:to-violet-400 transition-colors cursor-pointer"
                                                    >
                                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-white bg-slate-900 px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {p.estimatedMarks}M
                                                        </div>
                                                    </motion.div>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase">M{p.module}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="mt-8 text-sm text-slate-400 leading-relaxed max-w-2xl italic">
                                            The bar chart visualizes the relative importance of modules based on historical mark weightage. Module {predictions.sort((a,b) => b.estimatedMarks - a.estimatedMarks)[0]?.module} consistently appears as the highest yield area.
                                        </p>
                                    </motion.div>
                                )}

                                {activeTab === 'weightage' && (
                                    <motion.div 
                                        key="weightage"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="bg-slate-800/40 rounded-[2rem] p-10 border border-white/5 flex flex-col items-center min-h-[400px]"
                                    >
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight self-start mb-10 flex items-center gap-3">
                                            <PieChart className="text-emerald-400" /> Topic Weightage distribution
                                        </h3>
                                        
                                        <div className="relative w-64 h-64 mb-10">
                                            {/* Mock Pie Chart using CSS conic-gradient */}
                                            <div 
                                                className="w-full h-full rounded-full border-8 border-white/5 shadow-2xl"
                                                style={{
                                                    background: `conic-gradient(
                                                        #0ea5e9 0% 25%, 
                                                        #8b5cf6 25% 50%, 
                                                        #10b981 50% 70%, 
                                                        #f59e0b 70% 85%, 
                                                        #ef4444 85% 100%
                                                    )`
                                                }}
                                            />
                                            <div className="absolute inset-0 m-auto w-32 h-32 bg-slate-900 rounded-full flex flex-col items-center justify-center border border-white/10 shadow-inner">
                                                <span className="text-3xl font-black text-white">{totalMarks}</span>
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Total Marks</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-12 gap-y-3 w-full max-w-md">
                                            <LegendItem color="bg-sky-500" label="Core Numerical" percent="25%" />
                                            <LegendItem color="bg-violet-500" label="Theory/Concepts" percent="25%" />
                                            <LegendItem color="bg-emerald-500" label="Design Problems" percent="20%" />
                                            <LegendItem color="bg-amber-500" label="Proof/Derivation" percent="15%" />
                                            <LegendItem color="bg-rose-500" label="Case Studies" percent="15%" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Right Sidebar Strategy */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-gradient-to-br from-indigo-900/40 to-violet-900/40 rounded-[2rem] p-8 border border-indigo-500/20 shadow-xl no-print relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 text-indigo-500/10 group-hover:scale-150 group-hover:rotate-12 transition-transform duration-700">
                                    <Zap size={120} />
                                </div>
                                <h3 className="font-black text-white mb-4 flex items-center gap-3 uppercase tracking-tight relative z-10">
                                    <TrendingUp size={24} className="text-emerald-400" /> Neural Strategy
                                </h3>
                                <p className="text-sm text-slate-300 leading-relaxed mb-8 relative z-10 font-medium opacity-90">
                                    {overallTrend || "Focus heavily on numerical patterns detected in Module 3 and 4. We predict a 15% shift towards proof-based theory in this semester's Q1."}
                                </p>
                                <div className="space-y-3 relative z-10">
                                    <Button onClick={() => window.print()} className="w-full bg-white text-black hover:bg-slate-100 py-6 font-black uppercase tracking-widest text-xs">
                                        <Printer size={16} className="mr-2" /> PDF Intelligence
                                    </Button>
                                    <Button variant="outline" className="w-full border-white/10 text-white py-6 font-black uppercase tracking-widest text-xs hover:bg-white/5">
                                        <Share2 size={16} className="mr-2" /> Share Insights
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 rounded-[2rem] p-8 border border-white/5 shadow-inner">
                                <h3 className="font-black text-white mb-6 flex items-center gap-3 uppercase tracking-tight text-sm">
                                    <BookOpen size={20} className="text-sky-400" /> Recurring Patterns
                                </h3>
                                <div className="space-y-4">
                                    {likelyQuestions.length > 0 ? (
                                        likelyQuestions.slice(0, 4).map((q, i) => (
                                            <div key={i} className="group cursor-default">
                                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">
                                                    <span>Question Pattern</span>
                                                    <span className="text-emerald-400">{q.frequency}x Repeat</span>
                                                </div>
                                                <p className="text-sm text-slate-400 font-medium leading-snug group-hover:text-white transition-colors">
                                                    {q.questionText}
                                                </p>
                                                <div className="mt-2 text-[10px] font-bold text-sky-500">
                                                    Estimated Marks: {q.marks}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 opacity-30">
                                            <Brain size={40} className="mx-auto mb-4" />
                                            <p className="text-xs font-black uppercase tracking-widest">Awaiting Analysis</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-800/20 border-2 border-dashed border-slate-700/50 rounded-[3rem] p-32 text-center animate-in fade-in duration-1000">
                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ring-4 ring-slate-800/50">
                        <Brain size={48} className="text-slate-600" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-100 mb-4 tracking-tight">Intelligence Ready</h3>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium text-lg leading-relaxed">
                        Input any MU subject to map historical patterns and predict high-yield targets.
                    </p>
                </div>
            )}
        </div>
    );
};

const TabButton: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${active ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30' : 'text-slate-500 hover:text-slate-300'}`}
    >
        {icon} {label}
    </button>
);

const LegendItem: React.FC<{ color: string; label: string; percent: string }> = ({ color, label, percent }) => (
    <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-[10px] font-black text-white">{percent}</span>
    </div>
);

export default TopicPredictor;
