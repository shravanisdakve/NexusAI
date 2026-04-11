import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Star, Flame, Award, ArrowUpRight, Search, Activity, Users } from 'lucide-react';
import { getLeaderboard } from '../services/gamificationService';
import { useAuth } from '../contexts/AuthContext';
import PageLayout from '../components/ui/PageLayout';

interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    xp: number;
    level: number;
    avatar: string;
    badges: number;
}

const Leaderboard: React.FC = () => {
    const { user } = useAuth();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const data = await getLeaderboard();
            if (data.success) {
                setEntries(data.leaderboard);
            }
            setIsLoading(false);
        };
        fetchLeaderboard();
    }, []);

    const filteredEntries = entries.filter(e => 
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const topThree = entries.slice(0, 3);
    const others = filteredEntries.slice(3);

    const MainContent = (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header Section */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Trophy className="text-amber-500" size={20} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">Global Arena</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Nexus Performance Index</p>
                    </div>
                </div>
            </div>

            {/* Podium Section */}
            {!isLoading && entries.length >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-12">
                    {/* Rank 2 */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="order-2 md:order-1 h-[220px] bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-6 flex flex-col items-center justify-center relative overflow-hidden group"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-400/30" />
                        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center mb-4 relative">
                            <span className="text-2xl font-black text-slate-400">2</span>
                            <Medal className="absolute -top-3 -right-3 text-slate-400" size={24} />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase text-center truncate w-full">{topThree[1].name}</h3>
                        <p className="text-xs font-black text-slate-500 mt-1 uppercase tracking-widest">{topThree[1].xp} XP</p>
                    </motion.div>

                    {/* Rank 1 */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="order-1 md:order-2 h-[280px] bg-amber-500/5 border border-amber-500/20 rounded-[3rem] p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl shadow-amber-900/10 ring-1 ring-amber-500/20"
                    >
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500" />
                        <div className="w-24 h-24 rounded-[2rem] bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 relative shadow-2xl shadow-amber-500/20">
                            <Crown className="absolute -top-8 text-amber-500 animate-bounce" size={40} />
                            <span className="text-3xl font-black text-amber-500">1</span>
                        </div>
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tight text-center truncate w-full">{topThree[0].name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <Flame className="text-amber-500" size={14} />
                            <span className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em]">{topThree[0].xp} TOTAL XP</span>
                        </div>
                    </motion.div>

                    {/* Rank 3 */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="order-3 h-[180px] bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-6 flex flex-col items-center justify-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-800/30" />
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center mb-4 relative">
                            <span className="text-xl font-black text-amber-800">3</span>
                            <Medal className="absolute -top-3 -right-3 text-amber-800" size={20} />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase text-center truncate w-full">{topThree[2].name}</h3>
                        <p className="text-xs font-black text-slate-500 mt-1 uppercase tracking-widest">{topThree[2].xp} XP</p>
                    </motion.div>
                </div>
            )}

            {/* Others List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">Ranking Registry</p>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={12} />
                        <input 
                            type="text" 
                            placeholder="FIND COMPETITOR" 
                            className="bg-slate-950/50 border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-300 focus:outline-none focus:border-violet-500/50 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    {isLoading ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="h-16 bg-slate-900/20 border border-white/5 rounded-2xl animate-pulse" />
                        ))
                    ) : (
                        others.map((entry, i) => (
                            <motion.div
                                key={entry.userId}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${entry.userId === user?.id ? 'bg-violet-600/10 border-violet-500/30' : 'bg-slate-900/40 border-white/5 hover:border-white/10'}`}
                            >
                                <div className="w-8 text-[11px] font-black text-slate-600 italic">#{entry.rank}</div>
                                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-sm font-black text-slate-400">
                                    {entry.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-white uppercase truncate">{entry.name}</h4>
                                        {entry.userId === user?.id && <span className="text-[8px] font-black bg-violet-600 text-white px-1.5 py-0.5 rounded uppercase">YOU</span>}
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Level {entry.level} • {entry.badges} Badges</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-emerald-400 italic">{entry.xp.toLocaleString()}</p>
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">XP SCORE</p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    const SideContent = (
        <div className="space-y-6">
            {/* My Position Snapshot */}
            {!isLoading && (
                <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2.5rem] p-6 shadow-2xl shadow-violet-900/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Award size={64} />
                    </div>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-6">Personal Status</p>
                    <div className="space-y-4 relative z-10">
                        <div>
                            <p className="text-[9px] font-black text-white/50 uppercase mb-1">Current Ranking</p>
                            <h4 className="text-3xl font-black text-white italic tracking-tighter">
                                #{entries.find(e => e.userId === user?.id)?.rank || '--'}
                            </h4>
                        </div>
                        <div className="pt-4 border-t border-white/10">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[9px] font-black text-white/50 uppercase mb-1">To Next Level</p>
                                    <p className="text-sm font-black text-white italic">450 XP</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-white/50 uppercase mb-1">World Rank</p>
                                    <p className="text-sm font-black text-white italic">Top 8%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Performance Radar */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 px-1">Active Streaks</p>
                <div className="space-y-3">
                    {entries.slice(0, 5).map((e, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                                    <Flame size={12} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-300 uppercase truncate max-w-[100px]">{e.name}</span>
                            </div>
                            <span className="text-[10px] font-black text-amber-400 font-mono">12d</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return <PageLayout main={MainContent} side={SideContent} />;
};

export default Leaderboard;
