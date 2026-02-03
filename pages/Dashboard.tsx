import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader, Button, Input } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { type Course, type Mood as MoodType, type StudyPlan } from '../types';
import { getStudyPlan } from '../services/studyPlanService';
import { getTimeOfDayGreeting, getMostUsedTool } from '../services/personalizationService';
import { getProductivityReport } from '../services/analyticsService';
import { getCourses, addCourse, deleteCourse } from '../services/courseService';
import GoalsWidget from '../components/GoalsWidget';
import MoodCheckin from '../components/MoodCheckin';
import { getSuggestionForMood } from '../services/geminiService';
import {
    MessageSquare, Share2, FileText, Code, ArrowRight,
    Target, Lightbulb, Timer, Zap, BookOpen,
    Play, Pause, RefreshCw, PlusCircle, Trash2, User, Users, Star,
    BarChart, Clock, Brain, TrendingUp, TrendingDown, Repeat, Sparkles, Calculator, Shield, Calendar, CheckCircle2, Circle
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
        <div className="bg-slate-800/50 rounded-xl p-6 ring-1 ring-slate-700">
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
        <div className="bg-slate-800/60 backdrop-blur-md rounded-xl p-6 ring-1 ring-slate-700 shadow-[0_0_20px_rgba(139,92,246,0.1)] mb-8 flex flex-col items-center text-center">
            <div className="p-4 bg-slate-700/50 rounded-full mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">No Active Study Plan</h3>
            <p className="text-slate-400 max-w-md mb-6">You don't have a study plan for today. Create one to stay organized and ace your exams!</p>
            <Link to="/study-plan">
                <Button className="px-6">
                    <PlusCircle size={18} className="mr-2" />
                    Create Study Plan
                </Button>
            </Link>
        </div>
    );

    // Logic to find current day task
    const daysSinceStart = Math.floor((Date.now() - plan.startDate) / (24 * 60 * 60 * 1000));
    const currentDayPlan = plan.days[Math.min(daysSinceStart, plan.days.length - 1)];

    return (
        <div className="bg-slate-800/60 backdrop-blur-md rounded-xl p-6 ring-1 ring-slate-700 shadow-[0_0_20px_rgba(139,92,246,0.1)] mb-8">
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
        <div className="bg-slate-800/50 rounded-xl p-6 ring-1 ring-slate-700">
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
    bgColor: string;
}
const ToolCard: React.FC<ToolCardProps> = ({ name, href, description, icon: Icon, color, bgColor }) => {
    return (
        <Link to={href} className="group block p-6 bg-slate-800 rounded-xl hover:bg-slate-700/80 transition-all duration-300 ring-1 ring-slate-700 hover:ring-violet-500">
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${bgColor}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-100">{name}</h3>
            </div>
            <p className="mt-3 text-sm text-slate-400">{description}</p>
            <div className="mt-4 flex items-center text-sm font-semibold text-violet-400 group-hover:text-violet-300">
                <span>Start Session</span>
                <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
        </Link>
    );
};

const ToolsGrid: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {tools.map(tool => {
            const { key, ...rest } = tool;
            return <ToolCard key={key} {...rest} />;
        })}
    </div>
);

const SESSION_MOOD_CHECKIN_KEY = 'nexusMoodCheckedInSession';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [mostUsedToolKey, setMostUsedToolKey] = useState<string>('tutor');
    const [showMoodCheckin, setShowMoodCheckin] = useState(true);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

    useEffect(() => {
        const getMostUsed = async () => {
            const key = await getMostUsedTool();
            setMostUsedToolKey(key);
        };
        getMostUsed();

        const sessionMood = sessionStorage.getItem(SESSION_MOOD_CHECKIN_KEY);
        if (sessionMood) {
            setShowMoodCheckin(false);
        }
    }, []);

    const handleMoodSelected = async (mood: MoodType) => {
        sessionStorage.setItem(SESSION_MOOD_CHECKIN_KEY, 'true');
        setShowMoodCheckin(false);
        setIsLoadingSuggestion(true);
        try {
            const suggestion = await getSuggestionForMood(mood.toString());
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
        <div className="space-y-8">
            <PageHeader title={pageTitle} subtitle={pageSubtitle} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-slate-800/50 rounded-xl p-6 ring-1 ring-slate-700 text-center">
                        <h2 className="text-2xl font-bold text-slate-100 mb-2 flex items-center justify-center">
                            <Zap className="w-6 h-6 mr-3 text-yellow-400" />
                            Enter a Study Room
                        </h2>
                        <p className="text-slate-400 mb-6 max-w-xl mx-auto">Create or join a room to collaborate with friends, chat with an AI study buddy, and hold each other accountable.</p>
                        <Button onClick={() => navigate('/study-lobby')} className="px-8 py-4 text-lg">
                            <Users className="w-5 h-5 mr-2" />
                            Go to Study Lobby
                        </Button>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-100 mb-4">Resource Library</h2>
                    <Link to="/resources" className="group block p-6 bg-slate-800 rounded-xl hover:bg-slate-700/80 transition-all duration-300 ring-1 ring-slate-700 hover:ring-violet-500">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 rounded-lg bg-green-900/50">
                                <BookOpen className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-100">Engineering Resources</h3>
                                <p className="mt-1 text-sm text-slate-400">Find notes, papers, and books for your branch.</p>
                            </div>
                            <ArrowRight className="ml-auto w-5 h-5 text-slate-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-violet-400" />
                        </div>
                    </Link>
                </div>

                <div>
                    {mostUsedTool && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center"><Star className="w-6 h-6 mr-3 text-yellow-400" /> Quick Access</h2>
                            <Link to={mostUsedTool.href} className="group block p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl hover:bg-slate-700/80 transition-all duration-300 ring-2 ring-violet-500 shadow-lg shadow-violet-500/10">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-lg ${mostUsedTool.bgColor}`}>
                                        <mostUsedTool.icon className={`w-6 h-6 ${mostUsedTool.color}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-100">{mostUsedTool.name}</h3>
                                        <p className="mt-1 text-sm text-slate-400">{mostUsedTool.description}</p>
                                    </div>
                                    <ArrowRight className="ml-auto w-5 h-5 text-slate-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-violet-400" />
                                </div>
                            </Link>
                        </div>
                    )}
                    <h2 className="text-2xl font-bold text-slate-100 mb-4">Your AI Toolkit</h2>
                    <ToolsGrid />
                </div>
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
    );
};

export default Dashboard;