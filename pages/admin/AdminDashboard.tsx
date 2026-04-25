import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../../services/adminService';
import { 
    Users, 
    MessageSquare, 
    Bot, 
    AlertTriangle, 
    TrendingUp, 
    Activity,
    Server,
    ShieldCheck
} from 'lucide-react';

const KPIStat = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-[#0A0C10] border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-brand-primary/30 transition-all duration-300">
        <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${color}`}>
            <Icon size={80} />
        </div>
        <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
                <Icon size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</span>
        </div>
        <div className="flex items-end justify-between">
            <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
            {trend && (
                <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <TrendingUp size={10} />
                    {trend}
                </div>
            )}
        </div>
    </div>
);

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getDashboardStats();
                if (data.success) {
                    setStats(data.stats);
                }
            } catch (error) {
                console.error('Failed to fetch stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Operations Overview</h1>
                <p className="text-xs text-slate-500 font-medium">Real-time system health and user activity metrics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPIStat 
                    title="Total Users" 
                    value={stats?.totalUsers || 0} 
                    icon={Users} 
                    color="text-violet-500"
                    trend="+12%"
                />
                <KPIStat 
                    title="Active Today" 
                    value={stats?.activeUsersToday || 0} 
                    icon={Activity} 
                    color="text-emerald-500"
                    trend="+5%"
                />
                <KPIStat 
                    title="Active Rooms" 
                    value={stats?.activeRooms || 0} 
                    icon={MessageSquare} 
                    color="text-blue-500"
                />
                <KPIStat 
                    title="Flagged Content" 
                    value={stats?.flaggedUsers || 0} 
                    icon={AlertTriangle} 
                    color="text-amber-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Live Activity Feed</h3>
                        <button className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-widest">View All</button>
                    </div>
                    <div className="bg-[#0A0C10] border border-white/5 rounded-2xl overflow-hidden">
                        {[1, 2, 3, 4, 5].map((item) => (
                            <div key={item} className="p-4 border-b border-white/[0.03] last:border-0 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                        U{item}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-white">User_{item * 123} joined Study Room "Final Exam Prep"</p>
                                        <p className="text-[10px] text-slate-500 font-medium">2 minutes ago • Room ID: MU882</p>
                                    </div>
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded">JOIN_EVENT</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">System Integrity</h3>
                    <div className="grid gap-3">
                        {[
                            { label: 'Core API', status: 'Healthy', color: 'text-emerald-500', icon: Server },
                            { label: 'Socket Mesh', status: 'Stable', color: 'text-emerald-500', icon: Activity },
                            { label: 'Auth Gateway', status: 'Operational', color: 'text-emerald-500', icon: ShieldCheck },
                            { label: 'AI Inference', status: 'Latency Spike', color: 'text-amber-500', icon: Bot },
                        ].map((node) => (
                            <div key={node.label} className="bg-[#0A0C10] border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <node.icon size={16} className="text-slate-500" />
                                    <span className="text-xs font-semibold text-slate-300">{node.label}</span>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-tighter ${node.color}`}>{node.status}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-violet-600/5 border border-violet-500/10 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Bot size={14} className="text-violet-400" />
                            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">AI Status Report</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                            Token usage is within limits. Recent latency increase (1.2s avg) detected in Gemini Pro cluster. No downtime reported.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
