import React, { useState, useEffect } from 'react';
import { PageHeader, Button, Input, Spinner } from '../components/ui';
import { Brain, Target, AlertCircle, TrendingUp, BookOpen, ChevronRight, Share2, Printer } from 'lucide-react';
import { predictTopics, getLikelyQuestions } from '../services/muTutorService';
import { useAuth } from '../contexts/AuthContext';

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

    const thinkingLogs = [
        "Initializing Mumbai University Curriculum Ontology Mapping...",
        "Scanning past paper distribution for patterns...",
        "Correlating question marks to module complexity...",
        "Synthesizing latest semester trend shifts (Shift towards Numericals found)...",
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
            console.log('Fetching prediction for subject:', trimmedSubject);
            const result = await predictTopics(trimmedSubject);
            console.log('Prediction result received:', result);

            // Bug fix: The service returns data.prediction, check if it's the predictions array
            const finalPredictions = Array.isArray(result) ? result : (result?.predictions || []);
            setPredictions(finalPredictions);
            setOverallTrend(result?.overallTrend || '');

            const questions = await getLikelyQuestions(trimmedSubject);
            setLikelyQuestions(questions || []);

            if (finalPredictions.length === 0) {
                setError('No high-yield topics found for this subject. Try a more specific name.');
            }
        } catch (err: any) {
            console.error("Prediction Error:", err);
            setError(err.message || 'Failed to predict topics. Try ingesting more papers first.');
        } finally {
            clearInterval(thinkingInterval);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            <PageHeader
                title="MU Topic Predictor"
                subtitle="Data-driven exam analysis based on past 5 years of Mumbai University papers."
            />

            <div className="bg-slate-800/50 rounded-3xl p-8 ring-1 ring-slate-700/50 shadow-xl backdrop-blur-sm">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label htmlFor="subject-input" className="block text-sm font-medium text-slate-400 mb-2">Subject Name</label>
                        <Input
                            id="subject-input"
                            name="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. Operating Systems, Applied Mathematics III"
                            className="bg-slate-900/50"
                        />
                    </div>
                    <Button
                        onClick={handlePredict}
                        isLoading={loading}
                        className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-6 h-auto text-lg font-bold"
                    >
                        {loading ? 'Analyzing Patterns...' : 'Predict High-Yield Topics'}
                    </Button>
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                        <AlertCircle size={20} />
                        <p>{error}</p>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-6">
                    <div className="relative">
                        <Spinner size="lg" className="text-violet-500 scale-150" />
                        <Brain className="absolute inset-0 m-auto text-violet-400/50 animate-pulse" size={20} />
                    </div>
                    <div className="text-center space-y-2 max-w-md">
                        <p className="font-bold text-slate-100 text-lg">AI Neural Analysis Active</p>
                        <div className="bg-slate-900 border border-slate-700/50 rounded-lg p-3 font-mono text-[11px] text-emerald-400/80 w-full min-h-[44px] flex items-center justify-center shadow-inner">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping mr-3 shrink-0" />
                            {thinkingLogs[thinkingStep]}
                        </div>
                    </div>
                </div>
            ) : predictions.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {predictions.map((p) => (
                                <div key={p.module} className="bg-slate-800/40 rounded-2xl p-6 ring-1 ring-slate-700 hover:ring-violet-500/50 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-bold text-violet-400 flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-sm">M{p.module}</span>
                                            Module {p.module}
                                        </h4>
                                        <span className="text-xs font-bold px-2 py-1 bg-sky-500/10 text-sky-400 rounded-full">
                                            ~{p.estimatedMarks} Marks
                                        </span>
                                    </div>
                                    <ul className="space-y-2 mb-4">
                                        {p.highYieldTopics.map((topic, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                                <Target size={14} className="mt-1 text-slate-500 shrink-0" />
                                                <span>{topic}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="pt-4 border-t border-slate-700/50">
                                        <p className="text-xs text-slate-400 italic">
                                            <TrendingUp size={12} className="inline mr-1 text-emerald-400" />
                                            {p.trend}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-800/80 rounded-2xl p-6 ring-1 ring-indigo-500/30">
                            <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
                                <TrendingUp size={20} className="text-indigo-400" /> Exam Strategy
                            </h3>
                            <p className="text-sm text-slate-300 leading-relaxed mb-6">
                                {overallTrend || "Based on the Rev-2019/2024 C-Scheme, focus on Module 4 and 5 for high-weightage numericals."}
                            </p>
                            <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                                <Share2 size={16} className="mr-2" /> Share Insights
                            </Button>
                        </div>

                        <div className="bg-slate-900/50 rounded-2xl p-6 ring-1 ring-slate-700">
                            <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
                                <BookOpen size={20} className="text-emerald-400" /> Likely Questions
                            </h3>
                            <div className="space-y-4">
                                {likelyQuestions.length > 0 ? likelyQuestions.map((q, i) => (
                                    <div key={i} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                        <p className="text-sm text-slate-200 line-clamp-2 mb-2">{q.questionText}</p>
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                            <span className="text-slate-500">Marks: {q.marks}</span>
                                            <span className={q.frequency > 1 ? "text-emerald-400" : "text-sky-400"}>
                                                Freq: {q.frequency}x
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-xs text-slate-500 text-center py-4">
                                        No specific questions in database for this subject yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-3xl p-20 text-center">
                    <Brain size={60} className="mx-auto text-slate-700 mb-6" />
                    <h3 className="text-xl font-bold text-slate-300 mb-2">Ready to Analyze</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        Enter any Mumbai University engineering subject to get a breakdown of exam trends and likely topics.
                    </p>
                </div>
            )}
        </div>
    );
};

export default TopicPredictor;
