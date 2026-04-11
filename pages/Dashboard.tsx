import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input } from '@/components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { type Course, type MoodLabel, type StudyPlan } from '../types';
import { getStudyPlan, getLatestStudyPlan } from '../services/studyPlanService';
import {
    getTimeOfDayGreeting,
    hydratePersonalizationFromServer,
} from '../services/personalizationService';
import { getProductivityReport } from '../services/analyticsService';
import { getCourses, addCourse, deleteCourse } from '../services/courseService';
import GoalsWidget from '../components/GoalsWidget';
import MoodCheckin from '../components/MoodCheckin';
import { getSuggestionForMood } from '../services/geminiService';
import {
    MessageSquare, FileText,
    Target, Timer, Zap, BookOpen,
    PlusCircle, Trash2, Users, Star,
    BarChart, Clock, Brain, TrendingUp, TrendingDown, Sparkles, Calculator, Shield, Calendar, CheckCircle2, Circle,
    Plus, GraduationCap, Briefcase, ShieldAlert, Activity,
    ArrowRight, Flame, Percent, AlertTriangle, ChevronRight,
    Play, Layers, Cpu, LayoutGrid, Award, CheckCheck,
    Bot, ArrowUpRight, Globe, History, Lightbulb, BarChart3, Compass, Search, Filter, Layers as LayersIcon, MoreHorizontal, X, ExternalLink
} from 'lucide-react';
import { DateTime } from 'luxon';
import { XPBar, StreakCounter, BadgeSmall } from '@/components/gamification/XPComponents';
import { getUserStats, updateStreak, awardBadge, UserStats } from '@/services/gamificationService';
import { Card } from '@/components/ui';
import { saveStudyPlan } from '@/services/studyPlanService';
import { useToast } from '../contexts/ToastContext';
import KnowledgeMap from '../components/KnowledgeMap';
import { generateKnowledgeMap } from '../services/geminiService';
import PageLayout from '../components/ui/PageLayout';

const formatSeconds = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m`;
    return result.trim() || '0m';
};

// ─────────────────────────────────────────────────────────────────────────────
// ProductivityInsights — Knowledge Map + Knowledge Gaps
// ─────────────────────────────────────────────────────────────────────────────
const ProductivityInsights: React.FC<{ report: any }> = ({ report }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    
    // Pro-level visual refinement data
    const analyticsStats = [
        { label: 'Study Volume', val: report ? Math.round(report.totalStudyTime / 3600 * 10) / 10 : '0', unit: 'hrs', change: '+12%', color: 'violet' },
        { label: 'Consistency', val: report ? report.consistency || '92' : '0', unit: '%', change: '+3%', color: 'emerald' },
        { label: 'Accuracy', val: report ? report.quizAccuracy : '0', unit: '%', change: '-2%', color: 'rose', primary: true }
    ];

    const topicsNodes = (report?.weaknesses || []).map((w: any, i: number) => ({
        name: w.topic || 'Unknown Topic',
        score: w.score ?? 0,
        status: (w.score ?? 0) < 40 ? 'Needs work' : 'Improving',
        x: 20 + (i * 30),
        y: 60 - (i * 20),
        size: 48 + (i * 8),
        color: (w.score ?? 0) < 40 ? 'rose' : 'violet'
    }));

    // Fallback if no weaknesses found
    if (topicsNodes.length === 0) {
        topicsNodes.push({ name: 'Foundations', score: 100, status: 'Mastered', x: 50, y: 50, size: 64, color: 'emerald' });
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* 1. Statistics Hierarchy */}
            <div className="grid grid-cols-3 gap-4 pb-2">
                {analyticsStats.map((s) => (
                    <div key={s.label} className={`bg-slate-900/40 border border-white/[0.06] rounded-2xl p-4 transition-all duration-300 ${s.primary ? 'ring-1 ring-violet-500/30 bg-slate-900/60 shadow-lg shadow-violet-900/10' : ''}`}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{s.label}</p>
                        <div className="flex items-baseline justify-between gap-1">
                            <span className={`font-bold transition-all ${s.primary ? 'text-2xl text-white' : 'text-xl text-slate-300'}`}>
                                {s.val}<span className="text-xs font-medium ml-0.5 text-slate-500">{s.unit}</span>
                            </span>
                            <span className={`text-[10px] font-bold ${s.change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {s.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. Interactive Performance Graph */}
            <div className="bg-slate-900/40 border border-white/[0.08] rounded-3xl p-5 relative overflow-hidden group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="text-sm font-bold text-white uppercase tracking-tight">Topic Performance</h3>
                            <span className="text-[9px] font-medium text-slate-500">Based on recent quizzes</span>
                        </div>
                        {/* THE INSIGHT LINE: HIGH IMPACT */}
                        <div className="flex items-center gap-2.5">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-500 font-bold uppercase tracking-widest">
                                <Sparkles size={10} /> 1 weak topic • 1 strong topic
                            </span>
                            <p className="text-[11px] text-slate-400 font-medium">
                                Growth stagnating in <span className="text-rose-400 font-semibold underline decoration-rose-500/30">Operating Systems</span>.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pr-1">
                        <div className="flex -space-x-1.5 shrink-0">
                            {[1, 2, 3].map(i => <div key={i} className="w-5 h-5 rounded-full border-2 border-slate-950 bg-slate-800" />)}
                        </div>
                        <span className="text-[10px] text-slate-600 font-medium">Synced 2m ago</span>
                    </div>
                </div>

                {/* THE GRAPH VIEWPORT */}
                <div className="relative h-[250px] w-full bg-slate-950/40 rounded-2xl border border-white/[0.03] overflow-hidden mb-6 group/viewport">
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none" 
                        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                    
                    <svg className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none">
                        <line x1="22%" y1="68%" x2="50%" y2="32%" stroke="white" strokeWidth="1" strokeDasharray="6 6" />
                        <line x1="50%" y1="32%" x2="78%" y2="58%" stroke="white" strokeWidth="1" strokeDasharray="6 6" />
                    </svg>

                    {topicsNodes.map((node) => (
                        <motion.div
                            key={node.name}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.15, zIndex: 10 }}
                            className="absolute cursor-pointer group/node"
                            style={{ 
                                left: `${node.x}%`, 
                                top: `${node.y}%`, 
                                width: node.size, 
                                height: node.size,
                                transform: 'translate(-50%, -50%)'
                            }}
                            onClick={() => navigate('/quizzes')}
                        >
                            <div className={`absolute inset-0 rounded-full blur-[18px] opacity-10 transition-opacity group-hover/node:opacity-50 ${
                                node.color === 'rose' ? 'bg-rose-500' : node.color === 'emerald' ? 'bg-emerald-500' : 'bg-violet-500'
                            }`} />
                            
                            <div className={`w-full h-full rounded-full border-2 flex flex-col items-center justify-center transition-all bg-slate-950/80 backdrop-blur-sm ${
                                node.color === 'rose' ? 'border-rose-500/50 text-rose-400' : node.color === 'emerald' ? 'border-emerald-500/50 text-emerald-400' : 'border-violet-500/50 text-violet-400'
                            }`}>
                                <span className="text-xs font-black tracking-tighter">{(node.score ?? 0)}%</span>
                            </div>
                            
                            <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 text-center pointer-events-none">
                                <p className={`text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-opacity group-hover/node:opacity-100 ${
                                    node.color === 'rose' ? 'text-rose-400 opacity-80' : node.color === 'emerald' ? 'text-emerald-400 opacity-80' : 'text-violet-400 opacity-80'
                                }`}>
                                    {node.status}
                                </p>
                            </div>

                            <div className="absolute bottom-[calc(100%+14px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/node:opacity-100 transition-all scale-90 group-hover/node:scale-100 pointer-events-none z-[100]">
                                <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-xl shadow-2xl min-w-[160px]">
                                    <p className="text-[11px] font-bold text-white mb-1.5">{node.name}</p>
                                    <div className="flex justify-between items-center text-[9px] font-medium font-mono mb-2">
                                        <span className="text-slate-500 uppercase">Proficiency</span>
                                        <span className={node.color === 'rose' ? 'text-rose-400' : 'text-emerald-400'}>{node.score}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${
                                            node.color === 'rose' ? 'bg-rose-500' : 'bg-emerald-500'
                                        }`} style={{ width: `${node.score}%` }} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="flex justify-end pr-1 pb-1">
                    <button
                        onClick={() => navigate('/quizzes')}
                        className="flex items-center gap-2 group/cta px-5 py-2.5 bg-rose-500 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-rose-400 transition-all active:scale-[0.98] shadow-lg shadow-rose-950/20"
                    >
                        Practice weak topics <ArrowUpRight size={14} className="group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hero Action Block — the single dominant next-step module
// ─────────────────────────────────────────────────────────────────────────────
interface HeroBlockProps {
    plan: StudyPlan | null;
    planProgress: number;
    weakTopic?: string;
}

const HeroBlock: React.FC<HeroBlockProps> = ({ plan, planProgress, weakTopic }) => {
    const navigate = useNavigate();

    const daysSince = plan?.startDate
        ? Math.max(0, Math.floor((Date.now() - plan.startDate) / 86400000))
        : 0;
    const currentDay = plan ? plan.days[Math.min(daysSince, plan.days.length - 1)] : null;
    const totalTasks = currentDay?.tasks?.length || 0;
    const doneTasks = currentDay?.tasks?.filter((t: any) => t.completed).length || 0;
    const nextTask = currentDay?.tasks?.find((t: any) => !t.completed);
    const estMinutes = (totalTasks - doneTasks) * 8;

    if (!plan) {
        return (
            <div className="bg-slate-900/40 border border-white/[0.06] rounded-2xl p-6">
                {/* Empty header */}
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Today's focus</p>
                <div className="flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen size={16} className="text-violet-400" />
                    </div>
                    <div>
                        <p className="text-base font-semibold text-white leading-snug">No study plan active</p>
                        <p className="text-sm text-slate-400 mt-1">Build a personalised day-by-day plan to unlock your daily goals and progress tracking.</p>
                    </div>
                </div>
                {/* Inactive progress bar — shows shape */}
                <div className="h-2 w-full bg-slate-800/70 rounded-full mb-6 overflow-hidden">
                    <div className="h-full w-0 rounded-full" />
                </div>
                {/* Primary CTA — h-12 = 48px */}
                <button
                    onClick={() => navigate('/study-plan')}
                    className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-500 hover:scale-[1.01] active:scale-[0.98] text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 group shadow-lg shadow-violet-900/20"
                >
                    Create your study plan <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        );
    }

    // Intelligent Empty State logic
    const hasTasksToday = totalTasks > 0;

    return (
        <div className="bg-slate-900/50 border border-white/[0.08] rounded-2xl p-6 relative overflow-hidden hover:border-violet-500/15 transition-all duration-300">
            {/* 2px top accent — always vivid */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-violet-400/50 to-transparent rounded-t-2xl" />

            {/* Row 1: section label */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400/80 mb-2">Resume your plan</p>

            {/* Row 2: plan name — 16px semibold (Card Title level) */}
            <h2 className="text-base font-semibold text-white leading-snug mb-2">{(plan.courseId as any)?.name || plan.goal}</h2>

            {/* Row 3: meta — 12px, neutral gray */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                <span className="text-xs text-slate-400 font-medium">Day {currentDay?.day || 1} of {plan.durationDays}</span>
                <span className="text-slate-800">·</span>
                {hasTasksToday ? (
                    <>
                        <span className="text-xs text-slate-400">{doneTasks} of {totalTasks} tasks done</span>
                        {estMinutes > 0 && (
                            <>
                                <span className="text-slate-800">·</span>
                                <span className="text-xs text-slate-400">~{estMinutes} min left</span>
                            </>
                        )}
                    </>
                ) : (
                    <span className="text-xs text-rose-400/90 font-medium">No tasks scheduled for today</span>
                )}
            </div>

            {/* Row 4: Intelligent guidance indicator */}
            <div className="min-h-[24px] mb-5">
                {nextTask ? (
                    <p className="text-[11px] text-slate-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 animate-pulse" />
                        Next up: <span className="font-semibold text-slate-100">{nextTask.title}</span>
                    </p>
                ) : hasTasksToday ? (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 size={12} /> Daily goals completed. Great work!
                    </p>
                ) : (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 leading-relaxed">
                        <Zap size={10} className="text-amber-500" />
                        Generate today's schedule to stay on track or resume exploration.
                    </p>
                )}
            </div>

            {/* Progress bar — h-3 (12px), high visibility */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2 px-0.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                        Momentum: {planProgress}%
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                        {planProgress < 100 ? `${100 - planProgress}% to milestone` : 'Milestone achieved'}
                    </span>
                </div>
                <div className="h-3 w-full bg-slate-950/60 rounded-full overflow-hidden border border-white/[0.04] p-[2px]">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: planProgress > 0 ? `${planProgress}%` : '4%' }}
                        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                        className={planProgress > 0
                            ? 'h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 relative overflow-hidden'
                            : 'h-full rounded-full bg-slate-800'
                        }
                    >
                        {planProgress > 0 && (
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Primary CTA — h-10 (40px) */}
            <button
                onClick={() => navigate('/study-plan')}
                className="w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-500 hover:-translate-y-[1px] active:scale-[0.98] text-white text-[13px] font-semibold transition-all mb-5 flex items-center justify-center gap-2 group shadow-lg shadow-violet-900/20"
            >
                {hasTasksToday ? 'Resume learning' : 'Generate today\'s plan'} 
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Tertiary ghost links — clean 11px meta links */}
            <div className="flex items-center gap-5">
                <button
                    onClick={() => navigate('/study-lobby')}
                    className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 leading-none"
                >
                    <Users size={11} /> Study room
                </button>
                <button
                    onClick={() => navigate('/study-plan')}
                    className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 leading-none"
                >
                    <Timer size={11} /> Adjust timeline
                </button>
                {!hasTasksToday && (
                    <button
                        onClick={() => navigate('/learning-resources')}
                        className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 leading-none"
                    >
                        <BookOpen size={11} /> Explore modules
                    </button>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Recommended Next Steps (formerly "Executive Actions") — calmer cards
// ─────────────────────────────────────────────────────────────────────────────
interface ActionCard {
    title: string;
    subtitle: string;
    href: string;
    icon: React.ElementType;
    accentColor: string;
    cta: string;
    urgent?: boolean;
}

const NextStepsSection: React.FC<{ weakTopic?: string; hasPlan: boolean }> = ({ weakTopic, hasPlan }) => {
    const navigate = useNavigate();

    const cards: ActionCard[] = [
        ...(weakTopic ? [{
            title: `Practice: ${weakTopic}`,
            subtitle: 'Needs review — quiz accuracy below threshold',
            href: '/quizzes',
            icon: AlertTriangle,
            accentColor: 'text-rose-400 border-l-rose-500',
            cta: 'Practice',
            urgent: true,
        }] : []),
        {
            title: 'Start a mock exam',
            subtitle: 'Simulate real MU exam conditions with timed paper',
            href: '/mock-paper',
            icon: FileText,
            accentColor: 'text-amber-400 border-l-amber-500',
            cta: 'Start mock',
        },
        {
            title: 'Ask AI Tutor',
            subtitle: 'Get instant concept clarity from your AI study buddy',
            href: '/tutor',
            icon: MessageSquare,
            accentColor: 'text-sky-400 border-l-sky-500',
            cta: 'Open tutor',
        },
        {
            title: 'Join study room',
            subtitle: 'Study live with peers in a collaborative session',
            href: '/study-lobby',
            icon: Users,
            accentColor: 'text-emerald-400 border-l-emerald-500',
            cta: 'Join room',
        },
    ];

    return (
        <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 px-0.5">Pick up where you left off</p>
            {/* Cards grid — maintaining strict scale */}
            <div className="space-y-2">
                {cards.map((card, i) => (
                    <motion.div
                        key={card.href}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.2 }}
                    >
                        <Link
                            to={card.href}
                            className={`flex items-center gap-3 p-4 bg-slate-900/40 border border-white/[0.05] border-l-2 ${card.accentColor} rounded-xl hover:bg-slate-800/70 hover:-translate-y-[2px] hover:shadow-lg hover:shadow-black/20 transition-all duration-200 group`}
                        >
                            {/* Icon — 16px per system, 32px container */}
                            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0 group-hover:bg-white/[0.06] transition-colors">
                                <card.icon size={16} className={card.accentColor.split(' ')[0]} />
                            </div>

                            {/* Text block — information before action */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    {/* Card title — 14px medium */}
                                    <p className="text-sm font-medium text-slate-200 truncate leading-snug">{card.title}</p>
                                    {card.urgent && (
                                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    )}
                                </div>
                                {/* Subtitle — 12px, neutral gray */}
                                <p className="text-xs text-slate-500 truncate mt-0.5">{card.subtitle}</p>
                            </div>

                            {/* Secondary CTA — outline style, right-aligned but not too far */}
                            <span
                                className={`text-[11px] font-semibold shrink-0 px-3 py-1.5 rounded-lg transition-all border ${
                                    i === 0 && card.urgent
                                        ? `${card.accentColor.split(' ')[0]} border-current/20 bg-current/10 group-hover:bg-current/20`
                                        : 'text-slate-500 border-white/[0.07] group-hover:text-slate-200 group-hover:border-white/[0.15] group-hover:bg-white/[0.04]'
                                } flex items-center gap-1`}
                            >
                                {card.cta} <ChevronRight size={10} />
                            </span>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MyCourses
// ─────────────────────────────────────────────────────────────────────────────
const MyCourses: React.FC = () => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [courses, setCourses] = useState<Course[]>([]);
    const [newCourseName, setNewCourseName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCourses = async () => {
        setIsLoading(true);
        try {
            const fetchedCourses = await getCourses();
            setCourses(fetchedCourses);
        } catch (error) {
            console.error('[MyCourses] Error in fetchCourses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleAddCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newCourseName.trim()) {
            try {
                const newCourse = await addCourse(newCourseName.trim());
                if (newCourse) {
                    setCourses(prev => [...prev, newCourse]);
                    showToast('Course added successfully!', 'success');
                }
                setNewCourseName('');
                setIsAdding(false);
            } catch (error) {
                console.error('[MyCourses] Error in handleAddCourse:', error);
                showToast(t('dashboard.addCourseFailed'), 'error');
            }
        }
    };

    const handleDeleteCourse = async (id: string) => {
        try {
            await deleteCourse(id);
            setCourses(prev => prev.filter(c => c.id !== id));
            showToast('Course deleted.', 'info');
        } catch (error) {
            console.error('Error deleting course:', error);
            showToast('Failed to delete course.', 'error');
        }
    };

    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">My courses</p>
            <div className="space-y-1.5">
                {isLoading && <p className="text-slate-500 text-xs py-3">Loading…</p>}
                {!isLoading && courses.length === 0 && !isAdding && (
                    <p className="text-slate-500 text-xs py-3">No courses tracked yet.</p>
                )}
                {courses.map(course => (
                    <Link to="/notes" state={{ courseId: course.id, course: course.id }} key={course.id} className="group flex items-center justify-between p-2.5 rounded-lg border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/8 transition-all">
                        <div className="flex items-center min-w-0 mr-2 flex-1">
                            <span className="w-2 h-2 rounded-full mr-2.5 shrink-0" style={{ backgroundColor: course.color }}></span>
                            <span className="text-xs font-medium text-slate-300 truncate" title={course.name}>{course.name}</span>
                        </div>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteCourse(course.id); }} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={12} />
                        </button>
                    </Link>
                ))}
            </div>
            {isAdding ? (
                <form onSubmit={handleAddCourse} className="mt-3 flex gap-2">
                    <Input
                        id="new-course-name"
                        name="newCourseName"
                        aria-label="Name of the course to add"
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        placeholder="Course name"
                        className="text-xs h-8 bg-slate-900/50"
                        autoComplete="off"
                        autoFocus
                    />
                    <Button type="submit" className="h-8 px-3 text-xs bg-violet-600">Add</Button>
                </form>
            ) : (
                <button onClick={() => setIsAdding(true)} className="w-full mt-3 h-8 text-xs text-slate-500 border border-white/[0.04] rounded-lg hover:bg-white/5 hover:text-slate-300 transition-all flex items-center justify-center gap-1.5">
                    <Plus size={12} /> Add course
                </button>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Section Explorer (Tools tab)
// ─────────────────────────────────────────────────────────────────────────────
const SectionExplorer: React.FC = () => {
    const navigate = useNavigate();

    const explorerCategories = [
        {
            title: 'Learning Context',
            items: [
                { name: 'Curriculum', href: '/curriculum', icon: BookOpen, desc: 'Syllabus & notes hub', primary: true },
                { name: 'Paper Bank', href: '/paper-bank', icon: History, desc: 'Exam patterns' }
            ]
        },
        {
            title: 'Practice Engine',
            items: [
                { name: 'Prep Tools', href: '/prep-tools', icon: Cpu, desc: 'Practice drills' },
                { name: 'Resources', href: '/resources', icon: Globe, desc: 'Central library' }
            ]
        },
        {
            title: 'Career Vector',
            items: [
                { name: 'Company Hub', href: '/company-hub', icon: Briefcase, desc: 'Career paths' },
                { name: 'Resume Builder', href: '/placement', icon: FileText, desc: 'Portfolio optimization' }
            ]
        },
        {
            title: 'Operations',
            items: [
                { name: 'Calculator', href: '/gpa-calculator', icon: Calculator, desc: 'GPA & marks' },
                { name: 'Deadlines', href: '/curriculum', icon: Calendar, desc: 'University dates' }
            ]
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {explorerCategories.map((cat) => (
                <div key={cat.title}>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-600 mb-3 ml-1">{cat.title}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                        {cat.items.map(item => (
                            <motion.button
                                key={item.name}
                                whileHover={{ y: -3, scale: 1.01 }}
                                onClick={() => navigate(item.href)}
                                className={`flex items-start gap-4 p-5 rounded-2xl border transition-all group relative overflow-hidden ${
                                    item.primary 
                                        ? 'bg-violet-600/5 border-violet-500/20 hover:border-violet-500/40 shadow-xl shadow-violet-900/5' 
                                        : 'bg-slate-900/40 border-white/[0.05] hover:border-white/10 hover:bg-slate-800/60'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                    item.primary 
                                        ? 'bg-violet-600/10 text-violet-400 group-hover:bg-violet-600/20' 
                                        : 'bg-white/[0.04] text-slate-500 group-hover:bg-white/8 group-hover:text-slate-200'
                                }`}>
                                    <item.icon size={20} strokeWidth={item.primary ? 2.5 : 2} />
                                </div>
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-white tracking-tight">{item.name}</p>
                                        {item.primary && (
                                            <span className="text-[7px] font-black uppercase bg-violet-600 text-white px-1 py-0.5 rounded tracking-tighter">Recommended</span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 group-hover:text-slate-400 mt-1 leading-tight">{item.desc}</p>
                                </div>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                    <ChevronRight size={14} className={item.primary ? 'text-violet-400' : 'text-slate-500'} />
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard — Main Component
// ─────────────────────────────────────────────────────────────────────────────
const SESSION_MOOD_CHECKIN_KEY = 'nexusMoodCheckedInSession';

const Dashboard: React.FC = () => {
    const { user, updateMood } = useAuth();
    const { language, t } = useLanguage();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [showMoodCheckin, setShowMoodCheckin] = useState(true);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
    const [activeTab, setActiveTab] = useState<'focus' | 'insights' | 'tools'>('focus');
    const [stats, setStats] = useState<UserStats | null>(null);
    const [report, setReport] = useState<any>(null);
    const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
    const [planProgress, setPlanProgress] = useState<number>(0);
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoadingCourses, setIsLoadingCourses] = useState(false);

    // 1. Fetch core stats
    useEffect(() => {
        const refreshStats = async () => {
            try {
                await updateStreak();
                const data: any = await getUserStats();
                if (data && data.success) {
                    setStats(data.stats);
                    const hour = new Date().getHours();
                    if (hour >= 5 && hour < 9 && !data.stats.badges.includes('Early Bird')) {
                        await awardBadge('Early Bird');
                        const updatedData: any = await getUserStats();
                        if (updatedData && updatedData.success) setStats(updatedData.stats);
                    }
                }
            } catch (error) {
                console.error('Error refreshing stats:', error);
            }
        };
        refreshStats();
    }, [updateMood]);

    // 2. Fetch performance report
    useEffect(() => {
        const fetchReport = async () => {
            try {
                const r = await getProductivityReport();
                setReport(r);
            } catch (e) {
                console.error('KPI report error:', e);
            }
        };
        fetchReport();
    }, []);

    // 3. Fetch active study plan
    useEffect(() => {
        const fetchPlan = async () => {
            try {
                setIsLoadingCourses(true);
                const plan = await getLatestStudyPlan();
                
                if (plan) {
                    setActivePlan(plan);
                    const daysSince = Math.max(0, Math.floor((Date.now() - new Date(plan.startDate).getTime()) / 86400000));
                    const dayPlan = plan.days[Math.min(daysSince, plan.days.length - 1)];
                    const total = dayPlan?.tasks?.length || 0;
                    const done = dayPlan?.tasks?.filter((t: any) => t.completed).length || 0;
                    setPlanProgress(total > 0 ? Math.round((done / total) * 100) : 0);
                }
            } catch (e) {
                console.error('Plan fetch error:', e);
            } finally {
                setIsLoadingCourses(false);
            }
        };
        fetchPlan();
    }, []);

    // 4. Session state
    useEffect(() => {
        hydratePersonalizationFromServer();
        const sessionMood = sessionStorage.getItem(SESSION_MOOD_CHECKIN_KEY);
        if (sessionMood) setShowMoodCheckin(false);
    }, []);

    const handleMoodSelected = async (mood: MoodLabel) => {
        sessionStorage.setItem(SESSION_MOOD_CHECKIN_KEY, 'true');
        setShowMoodCheckin(false);
        setIsLoadingSuggestion(true);
        setAiSuggestion(null);
        try {
            await updateMood(mood);
            const suggestion = await getSuggestionForMood(mood, language);
            setAiSuggestion(suggestion);
        } catch (error) {
            console.error('Mood processing failed:', error);
            setAiSuggestion("Take a deep breath and stay focused. You've got this!");
        } finally {
            setIsLoadingSuggestion(false);
        }
    };

    const handleResetMood = () => {
        sessionStorage.removeItem(SESSION_MOOD_CHECKIN_KEY);
        setAiSuggestion(null);
        setShowMoodCheckin(true);
    };

    const greeting = getTimeOfDayGreeting(language);
    const firstName = user?.displayName?.split(' ')[0] || 'Student';

    const pageSubtitle = useMemo(() => {
        const parts = [];
        if (user?.branch) parts.push(user.branch);
        if (user?.year) parts.push(t('dashboard.yearLabel', { year: user.year }));
        return parts.length > 0 ? parts.join(' · ') : 'Engineering Student';
    }, [user, t]);

    const kpiStreak = stats?.streak || 0;
    const kpiHours = report ? formatSeconds(report.totalStudyTime) : '—';
    const kpiAccuracy = report ? `${report.quizAccuracy}%` : '—';
    const weakTopic = report?.weaknesses?.[0]?.topic;

    const tabs = [
        { id: 'focus', label: 'Today', icon: Target },
        { id: 'insights', label: 'Analytics', icon: BarChart },
        { id: 'tools', label: 'Sections', icon: LayoutGrid },
    ];

    const MainContent = (
        <div className="flex flex-col space-y-5 min-h-0">
            <header className="flex flex-col gap-5 shrink-0 pt-2 lg:pt-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                            <Bot className="text-violet-400" size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">Nexus Command</h1>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{DateTime.fromMillis(Date.now()).toFormat('cccc, dd LLL')}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex items-center gap-1 bg-slate-900/40 p-1 rounded-xl border border-white/[0.05] self-start">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                activeTab === tab.id ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                            }`}
                        >
                            <tab.icon size={12} />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </header>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 min-h-0 min-w-0 px-1 pb-20 lg:pb-4"
                >
                    {activeTab === 'focus' && (
                        <div className="space-y-8 mt-1">
                            <HeroBlock plan={activePlan} planProgress={planProgress} weakTopic={weakTopic} />
                            <div className="space-y-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1">Live Guidance</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-900/40 border border-white/[0.06] rounded-2xl p-4 flex items-start gap-4 hover:border-violet-500/20 transition-all group">
                                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                                            <Target size={18} className="text-violet-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1.5">🎯 Live Focus</p>
                                            <p className="text-xs font-semibold text-white tracking-tight">Active Learning Session</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900/40 border border-white/[0.06] rounded-2xl p-4 flex items-start gap-4 hover:border-emerald-500/20 transition-all group">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <Clock size={16} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5">⏱ Momentum</p>
                                            <p className="text-xs font-semibold text-white tracking-tight">Focus maintained</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <NextStepsSection weakTopic={weakTopic} hasPlan={!!activePlan} />
                        </div>
                    )}

                    {activeTab === 'insights' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.05]">
                                <Activity size={16} className="text-emerald-400" />
                                <h2 className="text-base font-semibold text-white tracking-tight">Performance analytics</h2>
                            </div>
                            <ProductivityInsights report={report} />
                        </div>
                    )}

                    {activeTab === 'tools' && <SectionExplorer />}
                </motion.div>
            </AnimatePresence>
        </div>
    );

    const SideContent = (
        <div className="space-y-5 flex flex-col min-h-0">
            <div className="bg-slate-900/40 border border-white/[0.06] rounded-2xl p-5 shrink-0">
                <div className="flex items-center justify-between mb-5 px-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">My Study Tracks</p>
                    <button onClick={() => navigate('/learning-resources')} className="text-[10px] font-bold text-violet-400 hover:text-white transition-colors flex items-center gap-1 group">
                        <Plus size={10} className="group-hover:rotate-90 transition-transform duration-300" /> ADMIT
                    </button>
                </div>
                <div className="space-y-1.5">
                    {courses.slice(0, 3).map((course, i) => (
                        <button key={course.id} onClick={() => navigate('/notes')} className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 ${i === 0 ? 'bg-violet-600/10 border-violet-500/20 text-white' : 'bg-transparent border-transparent text-slate-400 hover:bg-white/[0.03]'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[13px] font-semibold truncate">{course.name}</span>
                                <span className={`text-[10px] font-mono font-bold ${i === 0 ? 'text-violet-400' : 'text-slate-600'}`}>{i === 0 ? '68%' : '32%'}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-950/50 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${i === 0 ? 'bg-violet-500' : 'bg-slate-700'}`} style={{ width: i === 0 ? '68%' : '32%' }} />
                            </div>
                        </button>
                    ))}
                    {courses.length === 0 && <p className="text-[10px] text-slate-600 text-center py-4">No active tracks detected.</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 shrink-0">
                <div className="bg-slate-900/40 border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5"><Zap size={10} className="text-emerald-400" /> XP</p>
                    <p className="text-lg font-bold text-white">{user?.xp?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-slate-900/40 border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5"><Flame size={10} className="text-amber-400" /> STREAK</p>
                    <p className="text-lg font-bold text-white">{user?.streak || 0}d</p>
                </div>
            </div>

            <div className="bg-violet-600/5 border border-violet-500/10 rounded-2xl p-5 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Bot size={48} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-4 px-0.5">Performance Radar</p>
                <div className="space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20">
                            <TrendingUp size={16} className="text-violet-400" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-white tracking-tight">Accuracy Index</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{report?.quizAccuracy || 0}% avg record</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/leaderboard')}
                        className="w-full py-2.5 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 text-[10px] font-bold uppercase tracking-[0.15em] rounded-xl transition-all border border-violet-500/10 flex items-center justify-center gap-2"
                    >
                        View Arena <ArrowRight size={12} />
                    </button>
                </div>
            </div>
        </div>
    );

    return <PageLayout main={MainContent} side={SideContent} />;
};

export default Dashboard;

