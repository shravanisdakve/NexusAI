import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { User, Mail, GraduationCap, BookOpen, Target, Award, Edit3, Flame } from 'lucide-react';
import { Button } from '../../components/ui';

const ViewProfilePage: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLanguage();

    if (!user) return null;

    return (
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#050608] custom-scrollbar h-full">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Profile Header */}
                <div className="relative group">
                    <div className="absolute inset-x-0 -top-24 h-48 bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-transparent blur-3xl opacity-50"></div>
                    
                    <div className="relative flex flex-col md:flex-row items-center gap-8 p-8 rounded-[2rem] bg-slate-900/40 border border-white/5 backdrop-blur-xl">
                        <div className="relative">
                            <div className="absolute inset-0 bg-violet-500 blur-2xl opacity-20"></div>
                            <img
                                src={`https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random&size=128`}
                                alt="Profile Avatar"
                                className="w-32 h-32 rounded-[2rem] border-2 border-violet-500/20 relative z-10"
                            />
                        </div>
                        
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tight">{user.displayName || 'Nexus Scholar'}</h1>
                                <p className="text-slate-400 font-medium">{user.email}</p>
                            </div>
                            
                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <div className="px-4 py-1.5 bg-violet-500/10 rounded-full border border-violet-500/20">
                                    <span className="text-xs font-black text-violet-400 uppercase tracking-widest leading-none">
                                        {user.branch || 'Computer Engineering'}
                                    </span>
                                </div>
                                <div className="px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest leading-none">
                                        Semester {user.semester || '6'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Link to="/profile/edit">
                            <Button className="rounded-2xl gap-2 font-black uppercase tracking-widest text-xs px-6">
                                <Edit3 size={14} />
                                Edit Profile
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Academic Context */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 rounded-[2rem] bg-slate-900/40 border border-white/5 space-y-6">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <GraduationCap size={16} className="text-violet-400" />
                            Academic Status
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <BookOpen size={18} className="text-sky-400" />
                                    <span className="text-sm font-bold text-slate-300">Degree Course</span>
                                </div>
                                <span className="text-sm font-black text-white uppercase tracking-wider">{user.branchAbbr || 'B.E. COMPS'}</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Target size={18} className="text-rose-400" />
                                    <span className="text-sm font-bold text-slate-300">Current Phase</span>
                                </div>
                                <span className="text-sm font-black text-white uppercase tracking-wider">Active Sem {user.semester || 'VI'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-slate-900/40 border border-white/5 space-y-6">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Award size={16} className="text-amber-400" />
                            Performance Insights
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-sm font-bold text-slate-300">Study Streak</span>
                                <span className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                    12 Days <Flame size={14} className="text-orange-500 fill-orange-500/20" />
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-sm font-bold text-slate-300">Quizzes Completed</span>
                                <span className="text-sm font-black text-sky-400 uppercase tracking-wider">42</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* About Section */}
                <div className="p-8 rounded-[2rem] bg-slate-900/40 border border-white/5 space-y-4">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">About Me</h3>
                    <p className="text-slate-400 leading-relaxed italic">
                        {user.bio || 'Building the future of Mumbai University tech excellence. Focused on engineering mastery and strategic placement preparation.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ViewProfilePage;
