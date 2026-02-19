import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Button, Card } from '@/components/ui';
import {
    Terminal,
    Timer,
    AlertTriangle,
    Shield,
    CheckCircle2,
    ChevronRight,
    Monitor,
    Brain,
    Binary,
    RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSimulatorQuestions, submitSimulator, PlacementQuestion, PlacementResult } from '../services/placementService';
import { trackToolUsage } from '../services/personalizationService';
import { useLanguage } from '../contexts/LanguageContext';

type Phase = 'intro' | 'active' | 'result';

const TCSNQTSimulator: React.FC = () => {
    const params = useParams<{ simulatorSlug: string }>();
    const navigate = useNavigate();
    const simulatorSlug = params.simulatorSlug || 'tcs-nqt';
    const { t } = useLanguage();

    const [phase, setPhase] = useState<Phase>('intro');
    const [timeLeft, setTimeLeft] = useState(0);
    const [initialTime, setInitialTime] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [proctorAlert, setProctorAlert] = useState<string | null>(null);

    const [simulatorTitle, setSimulatorTitle] = useState(t('simulator.defaultTitle'));
    const [simulatorSubtitle, setSimulatorSubtitle] = useState(t('simulator.defaultSubtitle'));
    const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [result, setResult] = useState<PlacementResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        trackToolUsage('placement');
    }, []);

    useEffect(() => {
        const loadSimulator = async () => {
            setIsFetching(true);
            setFetchError(null);
            setPhase('intro');
            setCurrentQuestionIndex(0);
            setAnswers({});
            setResult(null);

            const payload = await getSimulatorQuestions(simulatorSlug);
            if (!payload) {
                setFetchError(t('simulator.unavailableMessage'));
                setIsFetching(false);
                return;
            }

            setSimulatorTitle(payload.simulator.name);
            setSimulatorSubtitle(payload.simulator.description);
            setQuestions(payload.questions || []);

            const durationSec = (payload.simulator.durationMin || 60) * 60;
            setInitialTime(durationSec);
            setTimeLeft(durationSec);
            setIsFetching(false);
        };

        loadSimulator();
    }, [simulatorSlug, t]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | null = null;
        if (phase === 'active' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
        } else if (phase === 'active' && timeLeft <= 0) {
            setPhase('result');
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [phase, timeLeft]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? `${h}:` : ''}${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
    };

    const handleAnswer = (index: number) => {
        const question = questions[currentQuestionIndex];
        if (!question) return;
        setAnswers((prev) => ({ ...prev, [question.id]: index }));
    };

    const startTest = () => {
        setPhase('active');
        setProctorAlert(t('simulator.proctorCalibrated'));
        setTimeout(() => setProctorAlert(null), 4000);
    };

    const finishAndSubmit = async () => {
        if (questions.length === 0) return;

        setIsSubmitting(true);
        const spent = Math.max(0, initialTime - timeLeft);
        const submission = await submitSimulator(simulatorSlug, answers, spent);

        if (submission) {
            setResult(submission);
        } else {
            setResult({
                totalQuestions: questions.length,
                attemptedQuestions: Object.keys(answers).length,
                correctAnswers: 0,
                incorrectAnswers: 0,
                scorePercent: 0,
                pace: 'Balanced',
                timeTakenSec: spent,
                sectionBreakdown: [],
                focusAreas: [],
                readinessBand: t('simulator.defaultBand'),
                recommendation: t('simulator.unavailableMessage'),
                simulatorSlug,
                simulatorName: simulatorTitle,
            });
        }

        setIsSubmitting(false);
        setPhase('result');
    };

    const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

    if (isFetching) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="max-w-3xl mx-auto">
                <Card className="p-8 text-center border-rose-500/30 bg-rose-500/10">
                    <h3 className="text-2xl font-bold text-white mb-3">{t('simulator.unavailableTitle')}</h3>
                    <p className="text-rose-200 mb-6">{fetchError}</p>
                    <Button onClick={() => navigate('/placement')}>{t('common.backToArena')}</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex flex-col max-w-7xl mx-auto space-y-6">
            <PageHeader
                title={simulatorTitle}
                subtitle={simulatorSubtitle}
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
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{t('simulator.instructionsTitle')}</h3>
                                <p className="text-slate-400">{t('simulator.instructionsSubtitle')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { icon: <Timer className="w-4 h-4" />, text: t('simulator.duration', { minutes: Math.round(initialTime / 60) }) },
                                    { icon: <Shield className="w-4 h-4" />, text: t('simulator.noNegative') },
                                    { icon: <Monitor className="w-4 h-4" />, text: t('simulator.proctoring') },
                                    { icon: <Binary className="w-4 h-4" />, text: t('simulator.questionCount', { count: questions.length }) },
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
                                    {t('simulator.riskNotice')}
                                </p>
                            </div>

                            <Button onClick={startTest} className="w-full py-6 text-lg font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-500 shadow-xl shadow-rose-600/20">
                                {t('simulator.startSession')}
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
                        <div className="lg:col-span-3 space-y-6">
                            <Card className="p-8 min-h-[400px] flex flex-col">
                                <div className="flex justify-between items-start mb-10">
                                        <div className="px-3 py-1 rounded bg-rose-500 text-white text-[10px] font-black uppercase">
                                        {t('simulator.section')}: {questions[currentQuestionIndex]?.section || t('simulator.sectionGeneral')}
                                    </div>
                                    <span className="text-xs font-mono text-slate-500">
                                        {t('simulator.questionOf', { current: currentQuestionIndex + 1, total: questions.length })}
                                    </span>
                                </div>

                                <div className="flex-1 space-y-8">
                                    <h4 className="text-xl font-bold text-white leading-relaxed">
                                        {questions[currentQuestionIndex]?.text}
                                    </h4>

                                    <div className="grid grid-cols-1 gap-3">
                                        {(questions[currentQuestionIndex]?.options || []).map((option, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleAnswer(i)}
                                                className={`p-4 rounded-xl text-left text-sm transition-all border-2 ${answers[questions[currentQuestionIndex]?.id] === i
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
                                        onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                                    >
                                        {t('common.previous')}
                                    </Button>

                                    {currentQuestionIndex === questions.length - 1 ? (
                                        <Button onClick={finishAndSubmit} isLoading={isSubmitting} className="bg-rose-600 hover:bg-rose-500">
                                            {t('simulator.finishTest')}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                                            className="gap-2"
                                        >
                                            {t('simulator.nextQuestion')} <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="p-6 border-slate-700 bg-slate-900/50 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('simulator.timeRemaining')}</h5>
                                    <Timer className={`w-4 h-4 ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                                </div>
                                <div className={`text-4xl font-black font-mono text-center ${timeLeft < 300 ? 'text-rose-500' : 'text-white'}`}>
                                    {formatTime(timeLeft)}
                                </div>
                            </Card>

                            <Card className="p-6 border-slate-700">
                                <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4">{t('simulator.progress')}</h5>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>{t('simulator.answered')}</span>
                                        <span>{answeredCount} / {questions.length}</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500" style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            </Card>

                            <div className="space-y-2">
                                <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">{t('simulator.questionsOverview')}</h5>
                                <div className="grid grid-cols-5 gap-2">
                                    {questions.map((question, i) => (
                                        <button
                                            key={question.id}
                                            onClick={() => setCurrentQuestionIndex(i)}
                                            className={`h-10 rounded-lg text-xs font-bold transition-all ${currentQuestionIndex === i
                                                ? 'bg-rose-500 text-white border-2 border-rose-400'
                                                : answers[question.id] !== undefined
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
                                <h3 className="text-3xl font-black text-white uppercase italic">{t('simulator.assessmentComplete')}</h3>
                                <p className="text-slate-400">{t('simulator.assessmentSubtitle')}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-700">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">{t('simulator.correct')}</span>
                                    <p className="text-2xl font-bold text-emerald-400">{result?.correctAnswers || 0}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-700">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">{t('simulator.incorrect')}</span>
                                    <p className="text-2xl font-bold text-rose-400">{result?.incorrectAnswers || 0}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-700">
                                    <span className="text-[10px] font-black text-slate-500 uppercase">{t('simulator.accuracy')}</span>
                                    <p className="text-2xl font-bold text-blue-400">{result?.scorePercent || 0}%</p>
                                </div>
                            </div>

                            <Card className="p-6 border-indigo-500/30 bg-indigo-500/5 text-left">
                                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-indigo-400" /> {t('simulator.aiFeedback')}
                                </h4>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    <strong>{t('simulator.readiness', { band: result?.readinessBand || t('simulator.defaultBand') })}</strong> {result?.recommendation || t('simulator.defaultRecommendation')}
                                </p>
                                {(result?.focusAreas || []).length > 0 && (
                                    <p className="text-xs text-slate-400 mt-2">
                                        {t('simulator.focusAreas')}: {(result?.focusAreas || []).join(', ')}
                                    </p>
                                )}
                            </Card>

                            <div className="flex gap-4">
                                <Button onClick={() => navigate(`/placement/${simulatorSlug}`)} variant="outline" className="flex-1">
                                    {t('simulator.retrySimulator')}
                                </Button>
                                <Button onClick={() => navigate('/placement')} className="flex-1 bg-indigo-600 hover:bg-indigo-500">
                                    {t('common.backToArena')}
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
