import React, { useState, useEffect, useRef } from 'react';
import { PageHeader, Button, Card, Toast } from '@/components/ui';
import {
    Terminal,
    Timer,
    AlertTriangle,
    Shield,
    CheckCircle2,
    Info,
    ChevronRight,
    Monitor,
    Brain,
    Binary
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
    id: number;
    text: string;
    options: string[];
    correctIndex: number;
    section: 'Numerical' | 'Verbal' | 'Reasoning' | 'Advanced Quant' | 'Coding';
}

const TCSNQTSimulator: React.FC = () => {
    const [phase, setPhase] = useState<'intro' | 'active' | 'result'>('intro');
    const [round, setRound] = useState<'foundation' | 'advanced'>('foundation');
    const [timeLeft, setTimeLeft] = useState(4500); // 75 mins in seconds
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [proctorAlert, setProctorAlert] = useState<string | null>(null);

    // Mock questions
    const questions: Question[] = [
        {
            id: 1,
            section: 'Numerical',
            text: "The average weight of 8 persons increases by 2.5 kg when a new person comes in place of one of them weighing 65 kg. What is the weight of the new person?",
            options: ['70 kg', '75 kg', '85 kg', 'None of these'],
            correctIndex: 2
        },
        {
            id: 2,
            section: 'Reasoning',
            text: "Pointing to a photograph, a man said, 'I have no brother or sister but that man's father is my father's son.' Whose photograph was it?",
            options: ["His own", "His father's", "His son's", "His nephew's"],
            correctIndex: 2
        }
    ];

    useEffect(() => {
        let timer: any;
        if (phase === 'active' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            setPhase('result');
        }
        return () => clearInterval(timer);
    }, [phase, timeLeft]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    };

    const handleAnswer = (index: number) => {
        setAnswers({ ...answers, [questions[currentQuestionIndex].id]: index });
    };

    const startTest = () => {
        setPhase('active');
        // Initial proctor check simulation
        setTimeout(() => setProctorAlert("Camera calibrated. AI Proctor Active."), 2000);
        setTimeout(() => setProctorAlert(null), 5000);
    };

    return (
        <div className="min-h-[80vh] flex flex-col max-w-7xl mx-auto space-y-6">
            <PageHeader
                title="TCS NQT 2025 Simulator"
                subtitle="Strict AI-proctored environment mimicking the actual TCS recruitment patterns."
                icon={<Terminal className="w-8 h-8 text-rose-500" />}
            />

            <AnimatePresence mode="wait">
                {phase === 'intro' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                    >
                        <Card className="p-8 max-w-2xl mx-auto space-y-8 bg-slate-800/60 border-rose-500/20">
                            <div className="space-y-4 text-center">
                                <Shield className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Instructions & Constraints</h3>
                                <p className="text-slate-400">Please read carefully before initializing the simulator.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { icon: <Timer className="w-4 h-4" />, text: "75 Minutes Duration" },
                                    { icon: <Shield className="w-4 h-4" />, text: "No Negative Marking" },
                                    { icon: <Monitor className="w-4 h-4" />, text: "AI Proctoring Active" },
                                    { icon: <Binary className="w-4 h-4" />, text: "Desktop Calculator Only" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700 text-sm text-slate-300 font-medium">
                                        <div className="text-rose-500">{item.icon}</div>
                                        {item.text}
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                <p className="text-xs text-amber-200/80 leading-relaxed">
                                    Simulating "Eye Tracking" and "Microphone Monitoring". Navigating away from this tab or detecting another person in frame will result in automatic submission.
                                </p>
                            </div>

                            <Button onClick={startTest} className="w-full py-8 text-xl font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-500 shadow-xl shadow-rose-600/20">
                                Initialize Secure Session
                            </Button>
                        </Card>
                    </motion.div>
                )}

                {phase === 'active' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1"
                    >
                        {/* Test Interface */}
                        <div className="lg:col-span-3 space-y-6">
                            <Card className="p-8 min-h-[400px] flex flex-col">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="px-3 py-1 rounded bg-rose-500 text-white text-[10px] font-black uppercase">
                                        Section: {questions[currentQuestionIndex].section}
                                    </div>
                                    <span className="text-xs font-mono text-slate-500">
                                        Question {currentQuestionIndex + 1} of {questions.length}
                                    </span>
                                </div>

                                <div className="flex-1 space-y-8">
                                    <h4 className="text-xl font-bold text-white leading-relaxed">
                                        {questions[currentQuestionIndex].text}
                                    </h4>

                                    <div className="grid grid-cols-1 gap-3">
                                        {questions[currentQuestionIndex].options.map((option, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleAnswer(i)}
                                                className={`p-4 rounded-xl text-left text-sm transition-all border-2 ${answers[questions[currentQuestionIndex].id] === i
                                                        ? 'bg-rose-600/10 border-rose-500 text-rose-400'
                                                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-500'
                                                    }`}
                                            >
                                                <span className="font-bold mr-4 text-slate-500 uppercase">{String.fromCharCode(65 + i)}.</span>
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-700/50">
                                    <Button
                                        variant="ghost"
                                        disabled={currentQuestionIndex === 0}
                                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                    >
                                        Previous
                                    </Button>

                                    {currentQuestionIndex === questions.length - 1 ? (
                                        <Button onClick={() => setPhase('result')} className="bg-rose-600 hover:bg-rose-500">
                                            Finish Test
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                            className="gap-2"
                                        >
                                            Next Question <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Proctoring & Status */}
                        <div className="space-y-6">
                            <Card className="p-6 border-slate-700 bg-slate-900/50 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Time Remaining</h5>
                                    <Timer className={`w-4 h-4 ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                                </div>
                                <div className={`text-4xl font-black font-mono text-center ${timeLeft < 300 ? 'text-rose-500' : 'text-white'}`}>
                                    {formatTime(timeLeft)}
                                </div>
                            </Card>

                            <Card className="p-6 border-slate-700">
                                <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">AI Proctor Monitor</h5>
                                <div className="aspect-video bg-black rounded-xl relative overflow-hidden flex items-center justify-center">
                                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.5)_0%,transparent_70%)]"></div>
                                    <div className="text-[10px] font-mono text-emerald-500 uppercase flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        System Tracking...
                                    </div>
                                    <div className="absolute bottom-2 left-2 flex gap-1">
                                        <div className="w-4 h-1 bg-emerald-500/20 rounded-full overflow-hidden">
                                            <div className="w-3/4 h-full bg-emerald-500"></div>
                                        </div>
                                        <div className="w-4 h-1 bg-emerald-500/20 rounded-full overflow-hidden">
                                            <div className="w-1/2 h-full bg-emerald-500"></div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-3 italic text-center">
                                    Face detected. Gaze stable.
                                </p>
                            </Card>

                            <div className="space-y-2">
                                <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Questions Overview</h5>
                                <div className="grid grid-cols-5 gap-2">
                                    {questions.map((q, i) => (
                                        <button
                                            key={q.id}
                                            onClick={() => setCurrentQuestionIndex(i)}
                                            className={`h-10 rounded-lg text-xs font-bold transition-all ${currentQuestionIndex === i
                                                    ? 'bg-rose-500 text-white border-2 border-rose-400'
                                                    : answers[q.id] !== undefined
                                                        ? 'bg-slate-700 text-slate-300'
                                                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {proctorAlert && (
                            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-500">
                                <div className="bg-slate-900 border border-rose-500/50 text-rose-500 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-xs font-bold tracking-widest uppercase">{proctorAlert}</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {phase === 'result' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl mx-auto"
                    >
                        <Card className="p-10 text-center space-y-8 bg-slate-800/60">
                            <div className="space-y-4">
                                <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto" />
                                <h3 className="text-3xl font-black text-white uppercase italic">Assessment Complete</h3>
                                <p className="text-slate-400">Analysis of your performance in the Foundation Round:</p>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-700">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Correct</span>
                                    <p className="text-2xl font-bold text-emerald-400">
                                        {Object.entries(answers).filter(([id, idx]) => questions.find(q => q.id === parseInt(id))?.correctIndex === idx).length}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-700">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Incorrect</span>
                                    <p className="text-2xl font-bold text-rose-400">
                                        {Object.keys(answers).length - Object.entries(answers).filter(([id, idx]) => questions.find(q => q.id === parseInt(id))?.correctIndex === idx).length}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-700">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Accuracy</span>
                                    <p className="text-2xl font-bold text-blue-400">
                                        {Math.round((Object.entries(answers).filter(([id, idx]) => questions.find(q => q.id === parseInt(id))?.correctIndex === idx).length / questions.length) * 100)}%
                                    </p>
                                </div>
                            </div>

                            <Card className="p-6 border-indigo-500/30 bg-indigo-500/5 text-left">
                                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-indigo-400" /> AI Feedback for Prime Role
                                </h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Your speed in the Reasoning section is exceptional. However, accuracy in Numerical Ability suggests you should focus on "Time and Distance" and "Averages". Based on this performance, you are currently trending toward the <strong>TCS Digital</strong> profile (₹7.0 LPA).
                                </p>
                            </Card>

                            <div className="flex gap-4">
                                <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
                                    Try Advanced Round
                                </Button>
                                <Button onClick={() => window.location.href = '#/placement'} className="flex-1 bg-indigo-600 hover:bg-indigo-500">
                                    Back to Arena
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TCSNQTSimulator;
