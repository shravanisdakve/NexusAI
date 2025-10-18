import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Button, Modal, Input, Spinner } from '../components/ui';
import { getProductivityReport, getLeaderboardData } from '../services/analyticsService';
import { getStudySuggestions } from '../services/geminiService';
import { getCourses } from '../services/courseService';
import { getRooms, addRoom } from '../services/communityService';
import { type Course, type StudyRoom } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { BarChart2, Users, Brain, Clock, HelpCircle, Trophy, Award, PlusCircle, ArrowRight, Building } from 'lucide-react';

// --- Reusable Components ---

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; }> = ({ icon, label, value }) => (
    <div className="bg-slate-800 p-4 rounded-lg flex items-center gap-4">
        <div className="bg-slate-700 p-3 rounded-md">{icon}</div>
        <div>
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-white font-bold text-xl">{value}</p>
        </div>
    </div>
);

const BarChart: React.FC<{ data: { label: string; value: number }[]; color: string }> = ({ data, color }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="flex justify-around items-end h-48 p-4 bg-slate-800 rounded-lg">
            {data.map(d => (
                <div key={d.label} className="flex flex-col items-center w-1/4">
                    <div className="w-8 rounded-t-md" style={{ height: `${(d.value / maxValue) * 100}%`, backgroundColor: color }}></div>
                    <p className="text-xs text-slate-400 mt-2 truncate">{d.label}</p>
                </div>
            ))}
        </div>
    );
};

// --- Main Tabs ---

const PerformanceTab: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [report, setReport] = useState<Awaited<ReturnType<typeof getProductivityReport>> | null>(null);
    const [suggestions, setSuggestions] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourses = async () => {
            const fetchedCourses = await getCourses();
            setCourses(fetchedCourses);
        };
        fetchCourses();
    }, []);

    useEffect(() => {
        const fetchReport = async () => {
            setIsLoading(true);
            const r = await getProductivityReport(selectedCourse);
            setReport(r);
            setIsLoading(false);

            setSuggestions('');
            setSuggestionsError(null);
            if (r.totalStudyTime > 60 || r.totalQuizzes > 2) {
                setIsLoadingSuggestions(true);
                const reportForAI = { totalStudyTime: r.totalStudyTime, quizAccuracy: r.quizAccuracy, strengths: r.strengths, weaknesses: r.weaknesses };
                getStudySuggestions(JSON.stringify(reportForAI))
                    .then(setSuggestions)
                    .catch(err => {
                        console.error("Failed to get AI suggestions:", err);
                        setSuggestionsError("Couldn't load AI suggestions. Please try again later.");
                    })
                    .finally(() => setIsLoadingSuggestions(false));
            }
        };
        fetchReport();
    }, [selectedCourse]);

    const formatSeconds = (s: number) => `${Math.floor(s / 60)}m`;

    if (isLoading) {
        return <div className="text-center py-8"><Spinner /></div>;
    }

    const studyTimeByDay = report?.sessions.reduce<Record<string, number>>((acc, session) => {
        const day = (session.startTime as any).toDate().toLocaleDateString('en-US', { weekday: 'short' });
        acc[day] = (acc[day] || 0) + (session.duration || 0);
        return acc;
    }, {});
    
    const chartData = studyTimeByDay ? Object.entries(studyTimeByDay).map(([label, value]) => ({label, value: value / 60})) : [];

    const topicData = [...(report?.strengths || []), ...(report?.weaknesses || [])].map(t => ({ label: t.topic, value: t.accuracy }));

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <select onChange={(e) => setSelectedCourse(e.target.value || null)} className="bg-slate-800 border-slate-700 rounded-md py-2 px-3 text-sm">
                    <option value="">All Courses</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={<Clock size={20} className="text-violet-400"/>} label="Total Study Time" value={formatSeconds(report?.totalStudyTime || 0)} />
                <StatCard icon={<Brain size={20} className="text-sky-400"/>} label="Quiz Accuracy" value={`${report?.quizAccuracy || 0}%`} />
                <StatCard icon={<HelpCircle size={20} className="text-amber-400"/>} label="Quizzes Taken" value={String(report?.totalQuizzes || 0)} />
             </div>
             
            {isLoadingSuggestions ? (
                <div className="text-center py-4"><Spinner /></div>
            ) : suggestionsError ? (
                <div className="bg-red-900/30 p-4 rounded-lg ring-1 ring-red-700 text-center text-red-300">
                    {suggestionsError}
                </div>
            ) : suggestions ? (
                <div className="bg-violet-900/30 p-4 rounded-lg ring-1 ring-violet-700">
                    <h3 className="font-bold text-violet-300 flex items-center gap-2 mb-2"><Trophy size={16}/> AI Study Suggestions</h3>
                    <div className="text-sm text-violet-200 prose prose-invert prose-sm" style={{ whiteSpace: 'pre-wrap'}}>{suggestions}</div>
                </div>
            ) : null}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-bold mb-2">Study Time This Week (minutes)</h3>
                    <BarChart data={chartData} color="#8b5cf6" />
                </div>
                <div>
                    <h3 className="font-bold mb-2">Topic Mastery</h3>
                    <BarChart data={topicData} color="#38bdf8" />
                </div>
             </div>
        </div>
    );
};

const CommunityTab: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState<Awaited<ReturnType<typeof getLeaderboardData>>>([]);
    const [rooms, setRooms] = useState<StudyRoom[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomCourse, setNewRoomCourse] = useState('');
    const [newRoomLimit, setNewRoomLimit] = useState(5);
    const [roomFilter, setRoomFilter] = useState<'myUniversity' | 'all'>('myUniversity');
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [leaderboardData, roomsData, coursesData] = await Promise.all([
                getLeaderboardData(),
                getRooms(),
                getCourses()
            ]);
            setLeaderboard(leaderboardData);
            setRooms(roomsData);
            setCourses(coursesData);
            if (coursesData.length > 0) {
                setNewRoomCourse(coursesData[0].id);
            }
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newRoomName.trim() && newRoomCourse && currentUser?.email) {
            const newRoom = await addRoom(newRoomName, newRoomCourse, newRoomLimit, currentUser.email, currentUser.university);
            if (newRoom) {
                setRooms(prev => [...prev, newRoom]);
                setIsModalOpen(false);
                setNewRoomName('');
                navigate(`/study-room/${newRoom.id}`);
            }
        }
    }
    
    const filteredRooms = rooms.filter(room => {
        if (roomFilter === 'all') return true;
        if (roomFilter === 'myUniversity') return room.university === currentUser?.university;
        return true;
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Public Study Rooms</h2>
                    <Button onClick={() => setIsModalOpen(true)}><PlusCircle size={16} className="mr-2"/> Create Room</Button>
                </div>

                <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-lg">
                    <button onClick={() => setRoomFilter('myUniversity')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${roomFilter === 'myUniversity' ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                        My University
                    </button>
                    <button onClick={() => setRoomFilter('all')} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${roomFilter === 'all' ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                        All Rooms
                    </button>
                </div>
                
                <div className="space-y-4">
                    {filteredRooms.map(room => (
                        <div key={room.id} className="bg-slate-800 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-white">{room.name}</h3>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <span>{courses.find(c=>c.id === room.courseId)?.name}</span>
                                    {room.university && (
                                        <div className="flex items-center gap-1.5">
                                            <Building size={14} />
                                            <span>{room.university}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-sm">
                                    <Users size={16} />
                                    <span>{room.users.length} / {room.maxUsers}</span>
                                </div>
                                <Button onClick={() => navigate(`/study-room/${room.id}`)} disabled={room.users.length >= room.maxUsers} className="py-2 px-4 text-sm">
                                    Join <ArrowRight size={14} className="ml-1"/>
                                </Button>
                            </div>
                        </div>
                    ))}
                    {filteredRooms.length === 0 && (
                        <p className="text-slate-400 text-center py-8">
                            {roomFilter === 'myUniversity' ? "No rooms found for your university. Be the first to create one!" : "No public rooms available. Why not create one?"}
                        </p>
                    )}
                </div>
            </div>
            <div>
                 <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
                 <div className="space-y-3">
                    {leaderboard.map((user, index) => (
                        <div key={user.email} className="bg-slate-800 p-3 rounded-lg flex items-center gap-4">
                            <span className="font-bold text-slate-500 w-6 text-center">{index + 1}</span>
                            <img src={`https://ui-avatars.com/api/?name=${user.displayName}&background=random`} alt="avatar" className="w-9 h-9 rounded-full"/>
                            <div className="flex-1">
                                <p className="font-semibold text-white truncate">{user.displayName}</p>
                                <p className="text-xs text-slate-400">{Math.floor(user.studyTime / 60)} min studied</p>
                            </div>
                            <div className="text-right">
                                <p className="font-mono text-violet-400 text-lg font-bold">{user.quizScore}%</p>
                                <p className="text-xs text-slate-400">{user.quizCount} quizzes</p>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create a New Study Room">
                <form onSubmit={handleCreateRoom} className="space-y-4">
                    <Input type="text" placeholder="Room Name" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} required autoFocus />
                    <select value={newRoomCourse} onChange={e => setNewRoomCourse(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-md py-3 px-4" required>
                        <option disabled value="">Select a Course</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div>
                        <label className="text-sm text-slate-300">User Limit: {newRoomLimit}</label>
                        <input type="range" min="2" max="5" value={newRoomLimit} onChange={e => setNewRoomLimit(parseInt(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"/>
                    </div>
                    <Button type="submit" className="w-full">Create and Join</Button>
                </form>
            </Modal>
        </div>
    );
};


// --- Main Component ---
const Insights: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'performance' | 'community'>('performance');

  const tabs = [
    { id: 'performance', label: 'My Performance', icon: BarChart2 },
    { id: 'community', label: 'Community', icon: Users },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Insights" subtitle="Track your progress, get smart suggestions, and study with the community." />
      
      <div className="flex border-b border-slate-700">
        {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors ${activeTab === tab.id ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-400 hover:text-white'}`}>
                <tab.icon size={18} /> {tab.label}
            </button>
        ))}
      </div>

      <div className="bg-slate-800/50 rounded-xl p-6 ring-1 ring-slate-700">
        {activeTab === 'performance' && <PerformanceTab />}
        {activeTab === 'community' && <CommunityTab />}
      </div>
    </div>
  );
};

export default Insights;