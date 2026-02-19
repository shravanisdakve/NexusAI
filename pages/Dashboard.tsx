import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader, Button, Input } from '@/components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { type Course, type Mood as MoodType, type MoodLabel, type StudyPlan } from '../types';
import { getStudyPlan } from '../services/studyPlanService';
import {
    getTimeOfDayGreeting,
    getMostUsedTool,
    getQuickAccessTools,
    addToQuickAccess,
    removeFromQuickAccess,
    hydratePersonalizationFromServer,
    getPersonalizationRecommendations
} from '../services/personalizationService';
import { getProductivityReport } from '../services/analyticsService';
import { getCourses, addCourse, deleteCourse } from '../services/courseService';
import GoalsWidget from '../components/GoalsWidget';
import MoodCheckin from '../components/MoodCheckin';
import { getSuggestionForMood } from '../services/geminiService';
import {
    MessageSquare, Share2, FileText, Code, ArrowRight,
    Target, Lightbulb, Timer, Zap, BookOpen,
    Play, Pause, RefreshCw, PlusCircle, Trash2, User, Users, Star,
    BarChart, Clock, Brain, TrendingUp, TrendingDown, Repeat, Sparkles, Calculator, Shield, Calendar, CheckCircle2, Circle,
    Pin, X, Plus, ChevronDown, GraduationCap, Binary, Briefcase
} from 'lucide-react';
import { XPBar, StreakCounter, BadgeSmall } from '@/components/gamification/XPComponents';
import { getUserStats, updateStreak, awardBadge, UserStats } from '@/services/gamificationService';
import LeaderboardWidget from '@/components/gamification/LeaderboardWidget';

const formatSeconds = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m`;
    return result.trim() || '0m';
};

const ProductivityInsights: React.FC = () => {
    const { t } = useLanguage();
    const [report, setReport] = useState<Awaited<ReturnType<typeof getProductivityReport>> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            setIsLoading(true);
            try {
                const fetchedReport = await getProductivityReport();
                setReport(fetchedReport);
            } catch (error) {
                console.error("Error fetching productivity report:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReport();
    }, []);

    if (isLoading) {
        return (
            <div className="bg-slate-800/50 rounded-xl p-6 ring-1 ring-slate-700 text-center">
                <p className="text-slate-400">{t('dashboard.weeklyLoading')}</p>
            </div>
        );
    }

    if (!report) return (
        <div className="bg-slate-800/50 rounded-xl p-6 ring-1 ring-slate-700 text-center">
            <p className="text-slate-400">{t('dashboard.weeklyLoadError')}</p>
        </div>
    );

    const hasData = report.totalStudyTime > 0 || report.totalQuizzes > 0;

    return (
        <div className="bg-slate-800 rounded-xl p-8 border border-white/10 shadow-card hover:shadow-card-hover transition-all duration-300">
            <h3 className="text-xl font-bold text-slate-100 flex items-center mb-4">
                <BarChart className="w-6 h-6 mr-3 text-violet-400" /> {t('dashboard.weeklySnapshotTitle')}
            </h3>
            {!hasData ? (
                <p className="text-center text-slate-400 py-4">{t('dashboard.weeklyEmpty')}</p>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm bg-slate-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-slate-400" />
                            <span className="font-medium text-slate-300">{t('dashboard.totalStudyTime')}</span>
                        </div>
                        <span className="font-mono text-white">{formatSeconds(report.totalStudyTime)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm bg-slate-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Brain size={16} className="text-slate-400" />
                            <span className="font-medium text-slate-300">{t('dashboard.quizAccuracy')}</span>
                        </div>
                        <span className="font-mono text-white">{report.quizAccuracy}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm bg-slate-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Target size={16} className="text-slate-400" />
                            <span className="font-medium text-slate-300">{t('dashboard.goalProgress')}</span>
                        </div>
                        <span className="font-mono text-white">{(report as any).goalProgress || 0}%</span>
                    </div>
                </div>
            )}
            <Link to="/insights">
                <Button className="w-full mt-6 text-sm">{t('dashboard.viewInsights')}</Button>
            </Link>
        </div>
    );
};

const ActivePlanWidget: React.FC = () => {
    const { t } = useLanguage();
    const [plan, setPlan] = useState<StudyPlan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPlan = async () => {
            setIsLoading(true);
            try {
                const courses = await getCourses();
                for (const course of courses) {
                    const activePlan = await getStudyPlan(course.id);
                    if (activePlan) {
                        setPlan(activePlan);
                        break;
                    }
                }
            } catch (error) {
                console.error("Error fetching active plan:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlan();
    }, []);

    if (isLoading) return null;

    if (!plan) return (
        <div className="bg-slate-800 rounded-xl p-8 border border-white/10 shadow-card hover:shadow-card-hover transition-all duration-300 mb-10 flex flex-col items-center text-center">
            <div className="p-4 bg-slate-700/30 rounded-full mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">{t('dashboard.noActivePlanTitle')}</h3>
            <p className="text-slate-400 max-w-md mb-6">{t('dashboard.noActivePlanSubtitle')}</p>
            <Link to="/study-plan">
                <Button className="px-6 uppercase tracking-wide text-sm font-medium">
                    <PlusCircle size={18} className="mr-2" />
                    {t('dashboard.createStudyPlan')}
                </Button>
            </Link>
        </div>
    );

    // Logic to find current day task
    const daysSinceStart = Math.floor((Date.now() - plan.startDate) / (24 * 60 * 60 * 1000));
    const currentDayPlan = plan.days[Math.min(daysSinceStart, plan.days.length - 1)];

    return (
        <div className="bg-slate-800 rounded-xl p-8 border border-white/10 shadow-card hover:shadow-card-hover transition-all duration-300 mb-10">
            <h3 className="text-xl font-bold text-slate-100 flex items-center mb-4">
                <Calendar className="w-6 h-6 mr-3 text-violet-400" /> {t('dashboard.todayStudyStep')}
            </h3>
            <div className="space-y-4">
                <div>
                    <p className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-1 line-clamp-1">{t('dashboard.goalLabel', { goal: plan.goal })}</p>
                    <h4 className="text-lg font-bold text-white">{t('dashboard.dayProgress', { day: currentDayPlan?.day || 1, total: plan.durationDays })}</h4>
                </div>
                <div className="space-y-2">
                    {currentDayPlan?.tasks.map((task: any) => (
                        <div key={task._id || task.id} className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700">
                            {task.completed ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} className="text-slate-500" />}
                            <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'} line-clamp-1`}>{task.title}</span>
                        </div>
                    ))}
                </div>
                <Link to="/notes" state={{ activeTab: 'plan', courseId: plan.courseId }}>
                    <Button className="w-full mt-2 text-sm">
                        {t('dashboard.viewFullPlan')}
                    </Button>
                </Link>
            </div>
        </div>
    );
};

const MyCourses: React.FC = () => {
    const { t } = useLanguage();
    const [courses, setCourses] = useState<Course[]>([]);
    const [newCourseName, setNewCourseName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCourses = async () => {
        console.log("[MyCourses] Starting fetchCourses...");
        setIsLoading(true);
        try {
            const fetchedCourses = await getCourses();
            console.log("[MyCourses] Fetched courses data:", fetchedCourses);
            setCourses(fetchedCourses);
            console.log("[MyCourses] State updated with fetched courses.");
        } catch (error) {
            console.error("[MyCourses] Error in fetchCourses:", error);
        } finally {
            setIsLoading(false);
            console.log("[MyCourses] Finished fetchCourses.");
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
                }
                setNewCourseName('');
                setIsAdding(false);
            } catch (error) {
                console.error("[MyCourses] Error in handleAddCourse:", error);
                alert(t('dashboard.addCourseFailed'));
            }
        }
    }

    const handleDeleteCourse = async (id: string) => {
        try {
            await deleteCourse(id);
            setCourses(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Error deleting course:", error);
        }
    }
    return (
        <div className="bg-slate-800 rounded-xl p-8 border border-white/10 shadow-card hover:shadow-card-hover transition-all duration-300">
            <h3 className="text-xl font-bold text-slate-100 flex items-center mb-4">
                <BookOpen className="w-6 h-6 mr-3 text-violet-400" /> {t('dashboard.myCoursesTitle')}
            </h3>
            <div className="space-y-2">
                {isLoading && <p className="text-slate-400 text-center">{t('dashboard.loadingCourses')}</p>}
                {!isLoading && courses.length === 0 && !isAdding && (
                    <div className="text-center py-4">
                        <p className="text-slate-400 mb-4">{t('dashboard.noCourses')}</p>
                    </div>
                )}
                {courses.map(course => (
                    <Link to="/notes" state={{ courseId: course.id }} key={course.id} className="group flex items-center justify-between bg-slate-800 p-3 rounded-lg hover:bg-slate-700 transition-colors">
                        <div className="flex items-center overflow-hidden mr-2">
                            <span className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: course.color }}></span>
                            <span className="font-medium text-slate-300 truncate">{course.name}</span>
                        </div>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteCourse(course.id); }} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <Trash2 size={16} />
                        </button>
                    </Link>
                ))}
            </div>
            {isAdding ? (
                <form onSubmit={handleAddCourse} className="mt-4 flex gap-2">
                    <Input
                        id="new-course-name"
                        name="newCourseName"
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        placeholder={t('dashboard.coursePlaceholder')}
                        className="text-sm flex-1"
                        autoComplete="off"
                        autoFocus
                    />
                    <Button type="submit" className="px-3 py-2 text-sm">{t('dashboard.addCourseAction')}</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="px-3 py-2 text-sm text-slate-400">{t('sidebar.profile.cancel')}</Button>
                </form>
            ) : (
                <Button onClick={() => setIsAdding(true)} className="w-full mt-4 bg-slate-700/50 hover:bg-slate-700 text-sm shadow-none">
                    <PlusCircle size={16} className="mr-2" />
                    {t('dashboard.addCourse')}
                </Button>
            )}
        </div>
    );
}

const tools = [
    { key: 'tutor', name: 'AI Tutor', href: '/tutor', description: 'Practice concepts with your AI tutor.', icon: MessageSquare, color: 'text-sky-400', bgColor: 'bg-sky-900/50' },
    { key: 'summaries', name: 'Summaries Generator', href: '/notes', description: 'Generate summaries from your notes.', icon: FileText, color: 'text-emerald-400', bgColor: 'bg-emerald-900/50' },
    { key: 'quizzes', name: 'Quizzes & Practice', href: '/quizzes', description: 'Test your knowledge with practice quizzes.', icon: Brain, color: 'text-rose-400', bgColor: 'bg-rose-900/50' },
    { key: 'gpa', name: 'GPA Calculator', href: '/gpa-calculator', description: 'Calculate your SGPA/CGPA easily.', icon: Calculator, color: 'text-violet-400', bgColor: 'bg-violet-900/50' },
    { key: 'project', name: 'Project Ideas', href: '/project-generator', description: 'Get AI-powered project ideas.', icon: Lightbulb, color: 'text-amber-400', bgColor: 'bg-amber-900/50' },
    { key: 'curriculum', name: 'MU Curriculum', href: '/curriculum', description: 'Interactive syllabus twin.', icon: GraduationCap, color: 'text-blue-400', bgColor: 'bg-blue-900/50' },

    { key: 'placement', name: 'Placement Arena', href: '/placement', description: 'TCS/Capgemini simulators.', icon: Briefcase, color: 'text-amber-400', bgColor: 'bg-amber-900/50' },
    { key: 'kt', name: 'ATKT Navigator', href: '/kt-calculator', description: 'Ordinance & grace calculator.', icon: Shield, color: 'text-rose-400', bgColor: 'bg-rose-900/50' },
    { key: 'paper', name: 'Mock Papers', href: '/mock-paper', description: 'Real MU exam pattern mocks.', icon: FileText, color: 'text-sky-400', bgColor: 'bg-sky-900/50' },
    { key: 'viva', name: 'Viva Bot', href: '/viva-simulator', description: 'Practice with an external bot.', icon: Users, color: 'text-emerald-400', bgColor: 'bg-emerald-900/50' },
    { key: 'study-plan', name: 'Study Planner', href: '/study-plan', description: 'Get a personalized roadmap.', icon: Calendar, color: 'text-violet-400', bgColor: 'bg-violet-900/50' },
    { key: 'math', name: 'Speed Math', href: '/speed-math', description: 'Test your calculation speed.', icon: Calculator, color: 'text-pink-400', bgColor: 'bg-pink-900/50' },
];

interface ToolCardProps {
    name: string;
    href: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string; // Kept for compatibility but we will override
}
const ToolCard: React.FC<ToolCardProps> = ({ name, href, description, icon: Icon, color }) => {
    const { t } = useLanguage();
    // Extract color class (e.g., text-sky-400) to determine base color if possible, 
    // or just use a generic approach for the professional look.
    // Professional look: Monochromatic icon backgrounds with subtle opacity.

    return (
        <Link to={href} className="group block p-6 bg-slate-800 rounded-xl border border-white/10 shadow-card hover:translate-y-[-2px] hover:shadow-card-hover transition-all duration-300">
            <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                    <Icon className="w-6 h-6 text-slate-200 group-hover:text-violet-400 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 group-hover:text-violet-400 transition-colors">{name}</h3>
            </div>
            <p className="text-sm text-slate-400/80 leading-relaxed mb-6 h-10 overflow-hidden">{description}</p>
            <div className="flex items-center text-sm font-medium text-violet-400 group-hover:text-violet-300">
                <span className="uppercase tracking-wider text-xs">{t('dashboard.startSession')}</span>
                <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
        </Link>
    );
};

// Replaced ToolsGrid usage inline in the main render to customize layout properly
const ToolsGrid: React.FC = () => (
    <div className="hidden"></div>
);

const SESSION_MOOD_CHECKIN_KEY = 'nexusMoodCheckedInSession';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [mostUsedToolKey, setMostUsedToolKey] = useState<string>('tutor');
    const [showMoodCheckin, setShowMoodCheckin] = useState(true);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
    const [quickAccessTools, setQuickAccessTools] = useState<string[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [showAddToolDropdown, setShowAddToolDropdown] = useState(false);
    const [adaptiveSummary, setAdaptiveSummary] = useState<string | null>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const { language, t } = useLanguage();

    useEffect(() => {
        const refreshStats = async () => {
            try {
                await updateStreak();
                const data = await getUserStats();
                if (data.success) {
                    setStats(data.stats);

                    // Early Bird Logic: If user is active between 5 AM and 9 AM
                    const hour = new Date().getHours();
                    console.log(`[Dashboard] Checking Early Bird: Hour=${hour}`);
                    if (hour >= 5 && hour < 9 && !data.stats.badges.includes('Early Bird')) {
                        console.log("[Dashboard] Awarding Early Bird Badge");
                        await awardBadge('Early Bird');
                        const updatedData = await getUserStats();
                        if (updatedData.success) {
                            setStats(updatedData.stats);
                            console.log("[Dashboard] Stats updated with new badge");
                        }
                    }
                }
            } catch (error) {
                console.error("Error refreshing stats:", error);
            }
        };
        refreshStats();
    }, []);

    useEffect(() => {
        const initializePersonalization = async () => {
            await hydratePersonalizationFromServer();

            const key = await getMostUsedTool();
            setMostUsedToolKey(key);

            const savedTools = getQuickAccessTools();
            let effectiveTools = savedTools;

            const recommendations = await getPersonalizationRecommendations();
            if (recommendations) {
                if (recommendations.recommendedTools?.length > 0 && savedTools.length === 0) {
                    effectiveTools = recommendations.recommendedTools.slice(0, 4);
                    effectiveTools.forEach((tool) => addToQuickAccess(tool));
                }

                if (recommendations.latestPlacement) {
                    setAdaptiveSummary(
                        t('dashboard.adaptivePlacementSummary', {
                            band: recommendations.latestPlacement.readinessBand,
                            accuracy: recommendations.latestPlacement.accuracy,
                            focus: recommendations.latestPlacement.focusAreas.join(', ') || t('dashboard.timedDrills'),
                        })
                    );
                } else if (recommendations.weakTopics?.length > 0) {
                    const topWeak = recommendations.weakTopics[0];
                    setAdaptiveSummary(t('dashboard.adaptiveFocusSummary', { topic: topWeak.topic, accuracy: topWeak.accuracy }));
                }
            }

            setQuickAccessTools(savedTools);
            if (effectiveTools !== savedTools) {
                setQuickAccessTools(effectiveTools);
            }
        };
        initializePersonalization();

        const sessionMood = sessionStorage.getItem(SESSION_MOOD_CHECKIN_KEY);
        if (sessionMood) {
            setShowMoodCheckin(false);
        }
    }, [t]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowAddToolDropdown(false);
            }
        };

        if (showAddToolDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAddToolDropdown]);

    const handleAddToQuickAccess = (toolKey: string) => {
        const updated = addToQuickAccess(toolKey);
        setQuickAccessTools(updated);
        setShowAddToolDropdown(false);
    };

    const handleRemoveFromQuickAccess = (toolKey: string) => {
        const updated = removeFromQuickAccess(toolKey);
        setQuickAccessTools(updated);
    };

    const availableToolsToAdd = tools.filter(tool => !quickAccessTools.includes(tool.key));

    const handleMoodSelected = async (mood: MoodLabel) => {
        sessionStorage.setItem(SESSION_MOOD_CHECKIN_KEY, 'true');
        setShowMoodCheckin(false);
        setIsLoadingSuggestion(true);
        try {
            const suggestion = await getSuggestionForMood(mood, language);
            setAiSuggestion(suggestion);
        } catch (error) {
            console.error("Error getting mood suggestion:", error);
        } finally {
            setIsLoadingSuggestion(false);
        }
    };

    const greeting = getTimeOfDayGreeting(language);
    const mostUsedTool = tools.find(t => t.key === mostUsedToolKey);

    const pageSubtitle = useMemo(() => {
        const parts = [];
        if (user?.branch) parts.push(user.branch);
        if (user?.year) parts.push(t('dashboard.yearLabel', { year: user.year }));
        if (user?.targetExam) parts.push(t('dashboard.targeting', { exam: user.targetExam }));
        return parts.length > 0 ? parts.join(' | ') : t('dashboard.studentHubSubtitle');
    }, [user, t]);

    const pageTitle = `${greeting}, ${user?.displayName?.split(' ')[0] || 'User'}!`;

    return (
        <div className="space-y-10 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pt-6">
                <div>
                    <h1 className="text-4xl font-semibold text-white tracking-tight mb-2">
                        {greeting}, <span className="text-indigo-400">{user?.displayName?.split(' ')[0] || 'User'}</span>!
                    </h1>
                    <p className="text-slate-400/60 text-lg">{pageSubtitle}</p>
                </div>
                {stats && (
                    <div className="flex items-center gap-6 bg-slate-800/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <StreakCounter streak={stats.streak} />
                        <div className="flex gap-2">
                            {stats.badges.includes('Early Bird') && <BadgeSmall name="Early Bird" />}
                            {stats.badges.includes('Math Wizard') && <BadgeSmall name="Math Wizard" icon={<Binary className="w-5 h-5" />} />}
                            {stats.badges.filter(b => b !== 'Early Bird' && b !== 'Math Wizard').map(badge => (
                                <BadgeSmall key={badge} name={badge} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {stats && (
                <div className="max-w-md mb-12">
                    <XPBar
                        xp={stats.xp}
                        level={stats.level}
                        nextLevelXP={500 * stats.level * (stats.level + 1)}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-violet-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
                                    {t('dashboard.readyToFocus')}
                                </h2>
                                <p className="text-slate-400 mb-6 max-w-md text-lg leading-relaxed">{t('dashboard.readyToFocusSubtitle')}</p>
                                <Button onClick={() => navigate('/study-lobby')} className="px-8 py-4 text-sm font-medium uppercase tracking-wider shadow-lg shadow-violet-500/25">
                                    <Users className="w-5 h-5 mr-3" />
                                    {t('dashboard.enterStudyLobby')}
                                </Button>
                            </div>
                            <div className="hidden md:block p-4 bg-slate-800/50 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <Zap className="w-16 h-16 text-violet-400" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-slate-100">{t('dashboard.resourceLibraryTitle')}</h2>
                            <Link to="/resources" className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors">{t('dashboard.viewAllResources')}</Link>
                        </div>
                        <Link to="/resources" className="group block p-8 bg-slate-800 rounded-xl border border-white/10 shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center space-x-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                                        <BookOpen className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">{t('dashboard.engineeringResourcesTitle')}</h3>
                                        <p className="text-slate-400 font-light">{t('dashboard.engineeringResourcesSubtitle')}</p>
                                    </div>
                                </div>
                                <div className="hidden sm:flex w-12 h-12 rounded-full border border-white/10 items-center justify-center group-hover:bg-violet-500 group-hover:border-transparent transition-all duration-300">
                                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </Link>
                    </div>

                    <div className="space-y-8">
                        <GoalsWidget />
                        {showMoodCheckin && <MoodCheckin onMoodSelect={handleMoodSelected} />}
                        {(isLoadingSuggestion || aiSuggestion) && (
                            <div className="bg-slate-800/50 p-4 rounded-xl ring-1 ring-slate-700 flex items-center gap-4">
                                <Sparkles className="text-sky-400 w-8 h-8 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-lg text-sky-300">{t('dashboard.smartSuggestionTitle')}</h4>
                                    {isLoadingSuggestion && <p className="text-slate-300">{t('dashboard.thinking')}</p>}
                                    {aiSuggestion && <p className="text-slate-100">{aiSuggestion}</p>}
                                </div>
                            </div>
                        )}
                        {adaptiveSummary && (
                            <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl">
                                <p className="text-sm text-indigo-200">{adaptiveSummary}</p>
                            </div>
                        )}
                        <ProductivityInsights />
                        <ActivePlanWidget />
                        <MyCourses />
                    </div>
                </div>

                <div className="space-y-10">
                    <LeaderboardWidget />
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-slate-100 flex items-center">
                                <Star className="w-5 h-5 mr-3 text-violet-500" fill="currentColor" /> {t('dashboard.quickAccess')}
                            </h2>
                            <div className="relative" ref={dropdownRef}>
                                <Button
                                    onClick={() => setShowAddToolDropdown(!showAddToolDropdown)}
                                    className="px-3 py-2 text-xs bg-slate-700/50 hover:bg-slate-700 shadow-none"
                                    disabled={availableToolsToAdd.length === 0}
                                >
                                    <Plus size={14} className="mr-1" />
                                    {t('dashboard.addTool')}
                                    <ChevronDown size={14} className="ml-1" />
                                </Button>
                                {showAddToolDropdown && availableToolsToAdd.length > 0 && (
                                    <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl border border-white/10 shadow-2xl z-50 py-2 max-h-64 overflow-y-auto">
                                        {availableToolsToAdd.map(tool => (
                                            <button
                                                key={tool.key}
                                                onClick={() => handleAddToQuickAccess(tool.key)}
                                                className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-700/50 transition-colors"
                                            >
                                                <tool.icon className={`w-4 h-4 ${tool.color}`} />
                                                <span className="text-sm text-slate-200">{tool.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {quickAccessTools.length === 0 ? (
                            <div className="bg-slate-800/50 rounded-xl p-8 border border-dashed border-slate-600 text-center">
                                <Pin className="w-10 h-10 text-slate-500 mx-auto mb-4" />
                                <p className="text-slate-400 mb-2">{t('dashboard.noPinnedTools')}</p>
                                <p className="text-sm text-slate-500">{t('dashboard.noPinnedToolsHint')}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {quickAccessTools.map(toolKey => {
                                    const tool = tools.find(t => t.key === toolKey);
                                    if (!tool) return null;
                                    return (
                                        <div key={tool.key} className="group relative">
                                            <Link
                                                to={tool.href}
                                                className="block p-5 bg-slate-800 rounded-xl border border-violet-500/30 shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-lg bg-violet-500/10">
                                                        <tool.icon className={`w-5 h-5 ${tool.color}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-base font-bold text-white truncate">{tool.name}</h3>
                                                        <p className="text-xs text-slate-400 truncate">{tool.description}</p>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                                </div>
                                            </Link>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleRemoveFromQuickAccess(tool.key);
                                                }}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-slate-700 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 border border-slate-600 hover:border-red-500"
                                                title={t('dashboard.removeQuickAccessTitle')}
                                            >
                                                <X size={12} className="text-slate-300" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-slate-100 mb-6">{t('dashboard.aiToolkitTitle')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5"> {/* Reduced gap for toolkit grid */}
                            {tools.map(tool => {
                                const { key, ...rest } = tool;
                                return <ToolCard key={key} {...rest} />;
                            })}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
