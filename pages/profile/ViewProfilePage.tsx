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
                    
                    <div className="relative flex flex-col md:flex-row items-center gap-6 p-5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-xl">
                        <div className="relative">
                            <img
                                src={`https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random&size=64`}
                                alt="Profile Avatar"
                                className="w-16 h-16 rounded-full border border-violet-500/30 relative z-10"
                            />
                        </div>
                        
                        <div className="flex-1 text-center md:text-left space-y-2">
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-tight">{user.displayName || 'Nexus Scholar'}</h1>
                                <p className="text-[13px] text-slate-400">{user.email}</p>
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

                {/* Dense Dashboard Context */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Academic Status */}
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-4">
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <GraduationCap size={16} className="text-violet-400" />
                            Academic Status
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={14} className="text-sky-400" />
                                    <span className="text-[13px] text-slate-400">Degree Course</span>
                                </div>
                                <span className="text-[13px] font-semibold text-white uppercase tracking-wider">{user.branchAbbr || 'B.E. COMPS'}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Target size={14} className="text-rose-400" />
                                    <span className="text-[13px] text-slate-400">Current Phase</span>
                                </div>
                                <span className="text-[13px] font-semibold text-white uppercase tracking-wider">Sem {user.semester || 'VI'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Performance Insights */}
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-4">
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Award size={14} className="text-amber-400" />
                            Performance Insights
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] text-slate-400">Study Streak</span>
                                <span className="text-[13px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                    12 Days <Flame size={12} className="text-orange-500" />
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] text-slate-400">Quizzes Done</span>
                                <span className="text-[13px] font-bold text-sky-400 uppercase tracking-wider">42</span>
                            </div>
                        </div>
                    </div>

                    {/* Activity (New 3rd Column) */}
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-4">
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Target size={14} className="text-emerald-400" />
                            Activity Profile
                        </h3>
                        <div className="space-y-3">
                            <p className="text-[12px] text-slate-400 leading-relaxed italic line-clamp-3">
                                {user.bio || 'Building the future of tech. Focused on engineering mastery and strategic placement preparation.'}
                            </p>
                            <Link to="/profile/edit" className="text-[11px] font-bold text-violet-400 hover:text-violet-300 block">Edit Profile →</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewProfilePage;
