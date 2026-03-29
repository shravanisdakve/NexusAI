import React, { useEffect, useState } from 'react';
import { getLeaderboardData } from '@/services/analyticsService';
import { GlobalLeaderboardEntry } from '@/types';
import { Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const LeaderboardWidget: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<GlobalLeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const { user: currentUser } = useAuth();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await getLeaderboardData();
                setLeaderboard(data);
            } catch (error) {
                console.error("Failed to load leaderboard");
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    if (loading) return null;

    return (
        <div className="bg-slate-800 rounded-xl p-8 border border-white/10 shadow-card hover:shadow-card-hover transition-all duration-300">
            <h3 className="text-xl font-bold text-slate-100 flex items-center mb-4">
                <Trophy className="w-6 h-6 mr-3 text-yellow-400" /> Top Students
            </h3>
            <div className="space-y-3">
                {leaderboard.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Be the first to join the leaderboard!</p>
                ) : (
                    leaderboard.slice(0, 5).map((entry, index) => {
                        const isCurrentUser = currentUser?.id === entry.id;
                        return (
                            <div key={entry.id} className={`flex items-center justify-between p-3 rounded-lg border gap-2 transition-all ${
                                isCurrentUser 
                                ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                                : 'bg-slate-800 border-slate-700'
                            }`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs border
                                        ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                            index === 1 ? 'bg-slate-400/20 text-slate-300 border-slate-400/30' :
                                                index === 2 ? 'bg-amber-700/20 text-amber-500 border-amber-600/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0 flex-1 overflow-hidden">
                                        <span className={`text-sm font-semibold truncate block pr-2 ${isCurrentUser ? 'text-indigo-300' : 'text-white'}`} style={{ minWidth: '80px' }}>
                                            {entry.name} {isCurrentUser && <span className="text-[10px] bg-indigo-500/30 px-1 rounded ml-1">YOU</span>}
                                        </span>
                                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">Lvl {entry.level}</p>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                    <p className={`text-xs font-black font-mono whitespace-nowrap ${isCurrentUser ? 'text-indigo-400' : 'text-violet-400'}`}>
                                        {entry.xp.toLocaleString()}
                                    </p>
                                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">XP</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            {leaderboard.length > 5 && (
                <div className="mt-4 text-center">
                    <p className="text-xs text-slate-500">And {leaderboard.length - 5} more runners up...</p>
                </div>
            )}
        </div>
    );
};

export default LeaderboardWidget;
