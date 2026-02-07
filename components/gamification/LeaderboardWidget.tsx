import React, { useEffect, useState } from 'react';
import { getLeaderboardData } from '@/services/analyticsService';
import { GlobalLeaderboardEntry } from '@/types';
import { Trophy } from 'lucide-react';

const LeaderboardWidget: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<GlobalLeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

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
                    leaderboard.slice(0, 5).map((entry, index) => (
                        <div key={entry.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border
                                    ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                        index === 1 ? 'bg-slate-400/20 text-slate-300 border-slate-400/30' :
                                            index === 2 ? 'bg-amber-700/20 text-amber-500 border-amber-600/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                                    {index + 1}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-white truncate">{entry.name}</p>
                                    <p className="text-xs text-slate-400">Lvl {entry.level}</p>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-violet-400">{entry.xp} XP</p>
                            </div>
                        </div>
                    ))
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
