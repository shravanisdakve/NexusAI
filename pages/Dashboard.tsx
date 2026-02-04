import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader, Button, Input } from '@/components/ui';
import { useAuth } from '../contexts/AuthContext';
import { type Course, type Mood as MoodType, type MoodLabel, type StudyPlan } from '../types';
import { getStudyPlan } from '../services/studyPlanService';
import { getTimeOfDayGreeting, getMostUsedTool, getQuickAccessTools, addToQuickAccess, removeFromQuickAccess } from '../services/personalizationService';
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
    Pin, X, Plus, ChevronDown
} from 'lucide-react';

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
                <p className="text-slate-400">Loading weekly snapshot...</p>
            </div>
        );
    }

    if (!report) return (
        <div className="bg-slate-800/50 rounded-xl p-6 ring-1 ring-slate-700 text-center">
            <p className="text-slate-400">Could not load productivity data.</p>
        </div>
    );

    const hasData = report.totalStudyTime > 0 || report.totalQuizzes > 0;

    return (
        <div className="bg-slate-800 rounded-xl p-8 border border-white/10 shadow-card hover:shadow-card-hover transition-all duration-300">
            <h3 className="text-xl font-bold text-slate-100 flex items-center mb-4">
                <BarChart className="w-6 h-6 mr-3 text-violet-400" /> Weekly Snapshot
            </h3>
            {!hasData ? (
                <p className="text-center text-slate-400 py-4">Start a study session or take a quiz to see your insights here.</p>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm bg-slate-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-slate-400" />
                            <span className="font-medium text-slate-300">Total Study Time</span>
                        </div>
                        <span className="font-mono text-white">{formatSeconds(report.totalStudyTime)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm bg-slate-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Brain size={16} className="text-slate-400" />
                            <span className="font-medium text-slate-300">Quiz Accuracy</span>
                        </div>
                        <span className="font-mono text-white">{report.quizAccuracy}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm bg-slate-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Target size={16} className="text-slate-400" />
                            <span className="font-medium text-slate-300">Goal Progress</span>
                        </div>
                        <span className="font-mono text-white">{(report as any).goalProgress || 0}%</span>
                    </div>
                </div>
            )}
            <Link to="/insights">
                <Button className="w-full mt-6 text-sm">View Detailed Insights</Button>
            </Link>
        </div>
    );
};

const ActivePlanWidget: React.FC = () => {
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
            <h3 className="text-xl font-bold text-slate-100 mb-2">No Active Study Plan</h3>
            <p className="text-slate-400 max-w-md mb-6">You don't have a study plan for today. Create one to stay organized and ace your exams!</p>
            <Link to="/study-plan">
                <Button className="px-6 uppercase tracking-wide text-sm font-medium">
                    <PlusCircle size={18} className="mr-2" />
                    CREATE STUDY PLAN
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
                <Calendar className="w-6 h-6 mr-3 text-violet-400" /> Today's Study Step
            </h3>
            <div className="space-y-4">
                <div>
                    <p className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-1 line-clamp-1">Goal: {plan.goal}</p>
                    <h4 className="text-lg font-bold text-white">Day {currentDayPlan?.day || 1} of {plan.durationDays}</h4>
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
                        View Full Plan
                    </Button>
                </Link>
            </div>
        </div>
    );
};

const MyCourses: React.FC = () => {
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
                alert(`Failed to add course. Please check the console for details.`);
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
                <BookOpen className="w-6 h-6 mr-3 text-violet-400" /> My Courses
            </h3>
            <div className="space-y-2">
                {isLoading && <p className="text-slate-400 text-center">Loading courses...</p>}
                {!isLoading && courses.length === 0 && !isAdding && (
                    <div className="text-center py-4">
                        <p className="text-slate-400 mb-4">You haven't added any courses yet. Add one to get started!</p>
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
                        placeholder="e.g., Organic Chemistry"
                        className="text-sm flex-1"
                        autoComplete="off"
                        autoFocus
                    />
                    <Button type="submit" className="px-3 py-2 text-sm">Add</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="px-3 py-2 text-sm text-slate-400">Cancel</Button>
                </form>
            ) : (
                <Button onClick={() => setIsAdding(true)} className="w-full mt-4 bg-slate-700/50 hover:bg-slate-700 text-sm shadow-none">
                    <PlusCircle size={16} className="mr-2" />
                    Add Course
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
    { key: 'kt', name: 'KT Avoidance', href: '/kt-calculator', description: 'Check required marks to pass.', icon: Shield, color: 'text-rose-400', bgColor: 'bg-rose-900/50' },
    { key: 'paper', name: 'Mock Papers', href: '/mock-paper', description: 'Real MU exam pattern mocks.', icon: FileText, color: 'text-sky-400', bgColor: 'bg-sky-900/50' },
    { key: 'viva', name: 'Viva Bot', href: '/viva-simulator', description: 'Practice with an external bot.', icon: Users, color: 'text-emerald-400', bgColor: 'bg-emerald-900/50' },
    { key: 'study-plan', name: 'Study Planner', href: '/study-plan', description: 'Get a personalized roadmap.', icon: Calendar, color: 'text-violet-400', bgColor: 'bg-violet-900/50' },
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
                <span className="uppercase tracking-wider text-xs">Start Session</span>
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
    const [showAddToolDropdown, setShowAddToolDropdown] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const getMostUsed = async () => {
            const key = await getMostUsedTool();
            setMostUsedToolKey(key);
        };
        getMostUsed();

        // Load saved Quick Access tools
        const savedTools = getQuickAccessTools();
        setQuickAccessTools(savedTools);

        const sessionMood = sessionStorage.getItem(SESSION_MOOD_CHECKIN_KEY);
        if (sessionMood) {
            setShowMoodCheckin(false);
        }
    }, []);

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
            const suggestion = await getSuggestionForMood(mood);
            setAiSuggestion(suggestion);
        } catch (error) {
            console.error("Error getting mood suggestion:", error);
        } finally {
            setIsLoadingSuggestion(false);
        }
    };

    const greeting = getTimeOfDayGreeting();
    const mostUsedTool = tools.find(t => t.key === mostUsedToolKey);

    const pageSubtitle = user?.branch && user?.year
        ? `${user.branch} - ${user.year}${user.year === 1 ? 'st' : user.year === 2 ? 'nd' : user.year === 3 ? 'rd' : 'th'} Year`
        : 'Your engineering student hub';
    const pageTitle = `${greeting}, ${user?.displayName?.split(' ')[0] || 'User'}!`;

    return (
        <div className="space-y-10 pb-12">
            <div className="mb-12 pt-6"> {/* Increased breathing room */}
                <h1 className="text-4xl font-semibold text-white tracking-tight mb-2">Good afternoon, <span className="text-white">{user?.displayName?.split(' ')[0] || 'User'}</span>!</h1>
                <p className="text-slate-400/60 text-lg">{pageSubtitle}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-violet-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
                                    Ready to focus?
                                </h2>
                                <p className="text-slate-400 mb-6 max-w-md text-lg leading-relaxed">Create a dedicated study room to collaborate, chat with AI, and track your progress.</p>
                                <Button onClick={() => navigate('/study-lobby')} className="px-8 py-4 text-sm font-medium uppercase tracking-wider shadow-lg shadow-violet-500/25">
                                    <Users className="w-5 h-5 mr-3" />
                                    ENTER STUDY LOBBY
                                </Button>
                            </div>
                            <div className="hidden md:block p-4 bg-slate-800/50 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <Zap className="w-16 h-16 text-violet-400" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-slate-100">Resource Library</h2>
                            <Link to="/resources" className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors">View All Resources</Link>
                        </div>
                        <Link to="/resources" className="group block p-8 bg-slate-800 rounded-xl border border-white/10 shadow-card hover:shadow-card-hover transition-all duration-300 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center space-x-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                                        <BookOpen className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">Engineering Resources</h3>
                                        <p className="text-slate-400 font-light">Access notes, past papers, and reference books.</p>
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
                                    <h4 className="font-semibold text-lg text-sky-300">Smart Suggestion</h4>
                                    {isLoadingSuggestion && <p className="text-slate-300">Thinking...</p>}
                                    {aiSuggestion && <p className="text-slate-100">{aiSuggestion}</p>}
                                </div>
                            </div>
                        )}
                        <ProductivityInsights />
                        <ActivePlanWidget />
                        <MyCourses />
                    </div>
                </div>

                <div className="space-y-10">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-slate-100 flex items-center">
                                <Star className="w-5 h-5 mr-3 text-violet-500" fill="currentColor" /> Quick Access
                            </h2>
                            <div className="relative" ref={dropdownRef}>
                                <Button
                                    onClick={() => setShowAddToolDropdown(!showAddToolDropdown)}
                                    className="px-3 py-2 text-xs bg-slate-700/50 hover:bg-slate-700 shadow-none"
                                    disabled={availableToolsToAdd.length === 0}
                                >
                                    <Plus size={14} className="mr-1" />
                                    Add Tool
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
                                <p className="text-slate-400 mb-2">No pinned tools yet</p>
                                <p className="text-sm text-slate-500">Click "Add Tool" to pin your favorite tools here for quick access</p>
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
                                                title="Remove from Quick Access"
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
                        <h2 className="text-xl font-semibold text-slate-100 mb-6">Your AI Toolkit</h2>
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