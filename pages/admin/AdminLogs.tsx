import React, { useEffect, useState } from 'react';
import { getAdminLogs } from '../../services/adminService';
import { Shield, User, Bot, Clock, ExternalLink, RefreshCw, Terminal } from 'lucide-react';

const AdminLogs: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await getAdminLogs();
            if (data.success) {
                setLogs(data.logs);
            }
        } catch (error) {
            console.error('Failed to fetch logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getLogIcon = (action: string) => {
        if (action.includes('USER')) return User;
        if (action.includes('ROOM')) return Shield;
        if (action.includes('SETTINGS')) return Terminal;
        return Shield;
    };

    const getLogColor = (action: string) => {
        if (action.includes('BAN') || action.includes('DELETE')) return 'text-rose-400';
        if (action.includes('CREATE')) return 'text-emerald-400';
        if (action.includes('UPDATE')) return 'text-violet-400';
        return 'text-blue-400';
    };

    const filteredLogs = logs.filter(log => {
        if (filter === 'ALL') return true;
        if (filter === 'SECURITY') return log.action.includes('BAN') || log.action.includes('DELETE');
        if (filter === 'USER') return log.action.includes('USER');
        return true;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Audit Registry</h1>
                    <p className="text-xs text-slate-500 font-medium">Traceable record of all platform events and administrative actions.</p>
                </div>

                <div className="flex items-center gap-3">
                    <select 
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-[#0A0C10] border border-white/5 rounded-xl py-2 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 focus:outline-none hover:border-violet-500/30 transition-all"
                    >
                        <option value="ALL">All Events</option>
                        <option value="SECURITY">Security Threats</option>
                        <option value="USER">User Protocols</option>
                    </select>
                    <button 
                        onClick={fetchLogs}
                        className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="bg-[#0A0C10] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-4 bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Secure Live Feed</span>
                    </div>
                </div>

                <div className="divide-y divide-white/[0.03] max-h-[600px] overflow-y-auto no-scrollbar">
                    {loading && logs.length === 0 ? (
                        <div className="p-12 text-center">
                            <RefreshCw className="animate-spin inline-block text-violet-500 mb-2" size={20} />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Synchronizing Registry...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic font-medium">No records found in this sequence.</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => {
                            const Icon = getLogIcon(log.action);
                            const colorClass = getLogColor(log.action);
                            return (
                                <div key={log._id} className="p-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg bg-white/5 ${colorClass} border border-white/5`}>
                                            <Icon size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold text-slate-300">
                                                <span className="text-violet-400 font-bold">{log.adminId?.displayName || 'System'}</span> 
                                                <span className="text-slate-500 mx-1">{log.action.replace('_', ' ').toLowerCase()}d</span>
                                                <span className="text-white">{log.targetType}</span>
                                                <span className="font-mono text-[9px] text-slate-600 ml-2">[{ (log.targetId || '').slice(-6) }]</span>
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[9px] font-bold uppercase tracking-tighter px-1.5 bg-black/40 rounded ${colorClass}`}>{log.action}</span>
                                                <div className="w-1 h-1 rounded-full bg-slate-700" />
                                                <span className="text-[9px] text-slate-600 font-bold tracking-tight">{new Date(log.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 rounded-lg text-slate-500 hover:text-white">
                                        <ExternalLink size={12} />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-600" />
                    <p className="text-[10px] text-slate-500 font-medium italic">
                        Real-time audit retention: 30 days of active platform operations.
                    </p>
                </div>
                <button className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors uppercase tracking-widest">
                    Export Archive
                </button>
            </div>
        </div>
    );
};

export default AdminLogs;
