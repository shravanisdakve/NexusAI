
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader, Modal, Button, Input } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { type Course, type Mood as MoodType } from '../types';
import { getTimeOfDayGreeting, getMostUsedTool, getBreakActivitySuggestion, recordMood } from '../services/personalizationService';
import { getProductivityReport, recordPomodoroCycle } from '../services/analyticsService';
import { getCourses, addCourse, deleteCourse } from '../services/courseService';
import { 
    MessageSquare, Share2, FileText, Code, ArrowRight,
    Target, Lightbulb, Timer, Zap, BookOpen,
    Play, Pause, RefreshCw, PlusCircle, Trash2, User, Users, Star,
    BarChart, Clock, Brain, TrendingUp, TrendingDown, Edit3, Repeat
} from 'lucide-react';
import MyGoals from '../components/MyGoals';

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
            const fetchedReport = await getProductivityReport();
            setReport(fetchedReport);
            setIsLoading(false);
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

    if (!report) return null;
    
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
                    <Timer size={16} className="text-slate-400" />
                    <span className="font-medium text-slate-300">Focus Sessions</span>
                </div>
                <span className="font-mono text-white">{report.completedPomodoros}</span>
            </div>
        </div>
        )}
        <Link to="/insights">
            <Button className="w-full mt-6 text-sm">View Detailed Insights</Button>
        </Link>
      </div>
    );
};

const MyCourses: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [newCourseName, setNewCourseName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            setIsLoading(true);
            const fetchedCourses = await getCourses();
            setCourses(fetchedCourses);
            setIsLoading(false);
        };
        fetchCourses();
    }, []);

    const handleAddCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if(newCourseName.trim()) {
            const newCourse = await addCourse(newCourseName.trim());
            if (newCourse) {
                setCourses(prev => [...prev, newCourse]);
            }
            setNewCourseName('');
            setIsAdding(false);
        }
    }
    
    const handleDeleteCourse = async (id: string) => {
        await deleteCourse(id);
        setCourses(prev => prev.filter(c => c.id !== id));
    }

    return (
        <div className="bg-slate-800/50 rounded-xl p-6 ring-1 ring-slate-700">
            <h3 className="text-xl font-bold text-slate-100 flex items-center mb-4">
                <BookOpen className="w-6 h-6 mr-3 text-violet-400" /> My Courses
            </h3>
            <div className="space-y-2">
                {courses.map(course => (
                    <div key={course.id} className="group flex items-center justify-between bg-slate-800 p-3 rounded-lg">
                        <div className="flex items-center">
                            <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: course.color }}></span>
                            <span className="font-medium text-slate-300">{course.name}</span>
                        </div>
                        <button onClick={() => handleDeleteCourse(course.id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
            {isAdding ? (
                <form onSubmit={handleAddCourse} className="mt-4 flex gap-2">
                    <Input 
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        placeholder="e.g., Organic Chemistry"
                        className="text-sm"
                        autoFocus
                    />
                    <Button type="submit" className="px-3 py-2 text-sm">Add</Button>
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

const MoodCheckin: React.FC<{ onMoodSelect: () => void }> = ({ onMoodSelect }) => {
    const moods = [
        { emoji: '😊', label: 'Happy' },
        { emoji: '🤯', label: 'Overwhelmed' },
        { emoji: '🔥', label: 'Focused' },
        { emoji: '😴', label: 'Tired' },
        { emoji: '🤔', label: 'Curious' },
    ];
    const [selected, setSelected] = useState<string | null>(null);

    const handleMoodSelect = async (mood: Omit<MoodType, 'timestamp'>) => {
        await recordMood(mood);
        setSelected(mood.label);
        sessionStorage.setItem('moodCheckedIn', 'true');
        setTimeout(() => {
            setSelected(null);
            onMoodSelect();
        }, 2000); // Reset after 2s
    };
    
    if (selected) {
        return (
             <div className="bg-slate-800/50 rounded-xl p-6 ring-1 ring-slate-700 text-center">
                 <p>Thanks for sharing! Keep up the great work.</p>
             </div>
        )
    }

    return (
        <div className="bg-slate-800/50 rounded-xl p-6 ring-1 ring-slate-700">
            <h3 className="text-xl font-bold text-slate-100 mb-4 text-center">How are you feeling?</h3>
            <div className="flex justify-around">
                {moods.map(mood => (
                    <button 
                        key={mood.label} 
                        onClick={() => handleMoodSelect(mood)}
                        className="flex flex-col items-center gap-2 text-slate-400 hover:text-white transition-transform transform hover:scale-110"
                        title={mood.label}
                    >
                        <span className="text-3xl">{mood.emoji}</span>
                        <span className="text-xs font-medium">{mood.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};


const tools = [
  { key: 'tutor', name: 'AI Tutor', href: '/tutor', description: 'Practice concepts with your AI tutor.', icon: MessageSquare, color: 'text-sky-400', bgColor: 'bg-sky-900/50' },
];

const ToolCard: React.FC<typeof tools[0]> = ({ name, href, description, icon: Icon, color, bgColor }) => (
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

const ToolsGrid: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {tools.map(tool => <ToolCard key={tool.name} {...tool} />)}
    </div>
);

const PomodoroTimer: React.FC = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timer, setTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [breakSuggestion, setBreakSuggestion] = useState('');

  useEffect(() => {
    if (isActive) {
      const newTimer = setInterval(() => {
        if (seconds > 0) {
          setSeconds(s => s - 1);
        } else if (minutes > 0) {
          setMinutes(m => m - 1);
          setSeconds(59);
        } else {
          // Timer finished
          if (timer) clearInterval(timer);
          setIsActive(false);
           if (!isBreak) {
             recordPomodoroCycle();
           }
          const nextIsBreak = !isBreak;
          setIsBreak(nextIsBreak);
          setMinutes(nextIsBreak ? 5 : 25);
          setSeconds(0);
          if (Notification.permission === "granted") {
            new Notification(nextIsBreak ? "Time for a break!" : "Time to focus!");
          }
          if (nextIsBreak) {
            setBreakSuggestion(getBreakActivitySuggestion());
          }
        }
      }, 1000);
      setTimer(newTimer);
    } else {
      if (timer) clearInterval(timer);
    }

    return () => { if (timer) clearInterval(timer) };
  }, [isActive, seconds, minutes, isBreak, timer]);

  const toggleTimer = () => {
    if (Notification.permission === 'default') {
       Notification.requestPermission();
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    if (timer) clearInterval(timer);
    setIsActive(false);
    setIsBreak(false);
    setMinutes(25);
    setSeconds(0);
  };

  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <>
        <div className={`bg-slate-800/50 rounded-xl p-6 ring-1 ring-slate-700 ${isBreak ? 'ring-sky-500' : 'ring-violet-500'}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-100 flex items-center"><Timer className="w-6 h-6 mr-3 text-violet-400" /> Pomodoro Timer</h3>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${isBreak ? 'bg-sky-900/70 text-sky-300' : 'bg-violet-900/70 text-violet-300'}`}>
                    {isBreak ? 'Break Time' : 'Focus Session'}
                </span>
            </div>
            <div className="text-center my-6">
                <p className="text-7xl font-bold font-mono tracking-tighter text-slate-100">{timeDisplay}</p>
            </div>
            <div className="flex items-center justify-center space-x-4">
                <button onClick={resetTimer} className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-full text-slate-300 transition-colors">
                    <RefreshCw className="w-6 h-6" />
                </button>
                <button onClick={toggleTimer} className={`p-4 rounded-full text-white transition-all duration-300 ${isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-violet-600 hover:bg-violet-700'}`}>
                    {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </button>
                <div className="w-12 h-12"></div>
            </div>
        </div>
        <Modal isOpen={!!breakSuggestion} onClose={() => setBreakSuggestion('')} title="Break Time Suggestion">
            <div className="text-center">
                <Lightbulb className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
                <p className="text-slate-300 text-lg my-4">{breakSuggestion}</p>
                <Button onClick={() => setBreakSuggestion('')} className="w-full mt-2">
                    Got it!
                </Button>
            </div>
      </Modal>
    </>
  );
};




const StudyHub: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [mostUsedToolKey, setMostUsedToolKey] = useState<string | null>(null);
  const [showMoodCheckin, setShowMoodCheckin] = useState(true);
  
  useEffect(() => {
    const fetchMostUsedTool = async () => {
        const toolKey = await getMostUsedTool();
        setMostUsedToolKey(toolKey);
    };
    fetchMostUsedTool();

    if (sessionStorage.getItem('moodCheckedIn')) {
        setShowMoodCheckin(false);
    }
  }, []);

  const handleMoodSelected = () => {
      setShowMoodCheckin(false);
  }

  const greeting = getTimeOfDayGreeting();
  const mostUsedTool = tools.find(t => t.key === mostUsedToolKey);

  return (
    <div className="space-y-8">
      <PageHeader title={`${greeting}, ${currentUser?.displayName || 'Student'}!`} subtitle="Your central hub for accelerated learning. Let's get started." />
      
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
          {showMoodCheckin && <MoodCheckin onMoodSelect={handleMoodSelected} />}
          <MyGoals />
          <ProductivityInsights />
          <MyCourses />
          <PomodoroTimer />
        </div>
      </div>
    </div>
  );
};

export default StudyHub;