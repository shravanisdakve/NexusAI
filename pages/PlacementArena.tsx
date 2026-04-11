import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Button, Card, Spinner, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import {
    Briefcase, Target, Globe, ArrowRight, BarChart3, Terminal, Clock3, CheckCircle2,
    Calculator, MessageCircle, UserCheck, Building2, ClipboardList, Play, Code2,
    Info, CheckCircle, ChevronRight, History, FileText, TrendingUp
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getPlacementDashboard, getRecentPlacementAttempts, PlacementDashboardPayload } from '../services/placementService';
import { trackToolUsage } from '../services/personalizationService';

const PlacementArena: React.FC = () => {
    const { t } = useLanguage();
    const [dashboard, setDashboard] = useState<PlacementDashboardPayload | null>(null);
    const [attempts, setAttempts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        trackToolUsage('placement');
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [dashboardData, recentAttempts] = await Promise.all([
                    getPlacementDashboard(),
                    getRecentPlacementAttempts(),
                ]);

                setDashboard(dashboardData);
                setAttempts(recentAttempts || []);
                if (!dashboardData) {
                    setError(t('placement.loadError'));
                }
            } catch (loadError) {
                console.error('Failed loading placement arena:', loadError);
                setError(t('placement.loadError'));
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [t]);

    const averageTrend = useMemo(() => {
        if (!dashboard?.trends?.length) return 0;
        const sum = dashboard.trends.reduce((acc, item) => acc + Number(item.avgPackage || 0), 0);
        return Number((sum / dashboard.trends.length).toFixed(1));
    }, [dashboard]);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Spinner size="xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            <PageHeader
                title={t('placement.title')}
                subtitle={t('placement.subtitle')}
                icon={<Briefcase className="w-6 h-6 text-amber-400" />}
            />

            {error && (
                <Card className="p-3 border-rose-500/30 bg-rose-500/10 text-rose-300 text-[11px] font-medium">
                    {error}
                </Card>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-1">
                {(dashboard?.stats || []).map((stat, index) => (
                    <TooltipProvider key={`${stat.label}-${index}`}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Card className={`p-3 text-center group hover:-translate-y-1 transition-transform cursor-help border-white/[0.05] bg-slate-900/40 hover:bg-slate-800/60 ${index === 0 ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20' : ''}`}>
                                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1.5 flex items-center justify-center gap-1">
                                        {stat.label}
                                        <Info size={10} className="text-slate-600 group-hover:text-amber-500 hidden sm:inline" />
                                    </p>
                                    <h4 className={`text-[18px] font-bold ${stat.color || (index === 0 ? 'text-amber-400' : 'text-white')}`}>{stat.value}</h4>
                                    {stat.college && (
                                        <p className="text-[8px] text-amber-500/60 mt-1 font-mono tracking-tighter truncate">
                                            Verified
                                        </p>
                                    )}
                                </Card>
                            </TooltipTrigger>
                            <TooltipContent className="bg-slate-900 border-slate-700 text-[11px] max-w-[200px]">
                                <p className="font-bold text-amber-400 mb-1">Data Source</p>
                                <p className="text-slate-300">
                                    AGGREGATE: {stat.college || 'MU central'} Placement Portal (2025-26).
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>

            {/* Main Application Layout Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT COLUMN: Actions & History */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Primary Action Card (Next Step) */}
                    <Card className="p-4 bg-gradient-to-r from-indigo-600/10 to-indigo-900/10 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-slate-800/80 transition-all">
                        <div className="flex items-start md:items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                                <Target size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Next Action</p>
                                <h4 className="font-semibold text-white text-sm">
                                    {attempts.length === 0 ? 'Starter Pack: Aptitude Training' : 'Continue Technical Drills'}
                                </h4>
                            </div>
                        </div>
                        <Link to={attempts.length === 0 ? "/practice-hub?tab=aptitude" : "/practice-hub?tab=dsa"}>
                            <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold text-[11px] h-8 px-5 w-full md:w-auto shadow-lg shadow-indigo-900/20 border-none transition-all Group-hover:scale-105 active:scale-95">
                                Start Now <ArrowRight size={12} className="ml-1.5" />
                            </Button>
                        </Link>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Recent History block */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                <History size={12} /> Recent Activity
                            </h4>
                            
                            {attempts.length === 0 ? (
                                <div className="text-center py-6 bg-slate-900/40 rounded-xl border border-white/5 space-y-2">
                                    <p className="text-[11px] text-slate-500">No previous attempts.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {attempts.slice(0, 3).map((attempt) => (
                                        <div key={attempt._id} className="flex items-center justify-between bg-slate-900/40 hover:bg-slate-800/60 border border-white/[0.05] rounded-xl px-4 py-3 transition-colors group">
                                            <div>
                                                <p className="text-xs font-semibold text-white mb-0.5">{attempt.simulatorName}</p>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                                    {attempt.readinessBand} Band
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <p className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shadow-sm">{attempt.accuracy}%</p>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{attempt.pace}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* College Trends block moved to left side lower */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                <TrendingUp size={12} /> {t('placement.collegeTrends')}
                            </h4>
                            <Card className="p-4 bg-slate-900/40 border-[0.5px] border-white/[0.05] hover:border-amber-500/20 transition-all relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-5 scale-[2] translate-x-4 -translate-y-4 group-hover:scale-[2.5] transition-transform duration-700 pointer-events-none">
                                    <BarChart3 size={64} className="text-amber-500" />
                                </div>
                                <div className="space-y-3 relative z-10">
                                    {(dashboard?.trends || []).slice(0, 3).map((trend) => (
                                        <div key={trend.collegeName} className="flex justify-between items-center group/trend border-b border-white/[0.03] last:border-0 pb-3 last:pb-0">
                                            <span className="text-[11px] text-slate-400 group-hover/trend:text-slate-200 transition-colors truncate pr-2">{trend.collegeName}</span>
                                            <span className="text-[11px] font-bold text-white shrink-0">Rs {Number(trend.avgPackage || 0).toFixed(1)}L</span>
                                        </div>
                                    ))}
                                    <div className="pt-2 flex justify-between items-center bg-white/[0.02] p-2 rounded -mx-1">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Benchmark</span>
                                        <span className="text-[10px] font-black text-amber-400">Rs {averageTrend.toFixed(1)}L</span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: State & Context */}
                <div className="space-y-6">
                    
                    {/* Resume Actionable Card */}
                    <Card className="p-4 bg-slate-900/40 border-[0.5px] border-white/[0.05] relative overflow-hidden group hover:border-violet-500/30 hover:bg-slate-900/60 transition-all">
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <FileText size={48} className="text-violet-500" />
                        </div>
                        <h4 className="text-xs font-semibold text-white mb-4 flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><ClipboardList size={14} className="text-violet-400" /> Profiler</span>
                            <span className="text-violet-400 font-bold text-[10px] bg-violet-500/10 px-2 py-0.5 rounded tracking-widest uppercase">72% Ready</span>
                        </h4>
                        
                        <div className="h-1.5 w-full bg-slate-950 rounded-full mb-5 overflow-hidden border border-white/[0.02] shadow-inner">
                            <div className="h-full bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" style={{ width: '72%' }} />
                        </div>

                        <div className="mb-5">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-2.5">Missing Details</p>
                            <ul className="text-[11px] text-slate-300 space-y-2">
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.6)] animate-pulse" /> Certification Link</li>
                                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.6)] animate-pulse" /> Project URLs</li>
                            </ul>
                        </div>

                        <Link to="/resume-builder">
                            <Button variant="outline" className="w-full h-8 text-[11px] border-white/[0.08] text-slate-300 hover:bg-white/5 hover:text-white transition-all font-semibold">
                                Fix Now
                            </Button>
                        </Link>
                    </Card>

                    {/* Company Shortlist */}
                    <Card className="p-4 bg-slate-900/40 border-[0.5px] border-white/[0.05]">
                        <h4 className="text-xs font-semibold text-white mb-4 flex items-center gap-1.5">
                            <Building2 size={14} className="text-emerald-400" /> Tracker Shortlist
                        </h4>
                        <div className="space-y-1">
                            {[
                                { name: 'Google (STEP)', status: 'Applied', date: 'Apr 02', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                                { name: 'MS Engage', status: 'Test', date: 'Apr 09', color: 'text-violet-400', bg: 'bg-violet-500/10' },
                                { name: 'Barclays Rise', status: 'Review', date: 'Apr 22', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                            ].map((app, index) => (
                                <div key={index} className="flex items-center justify-between py-2 rounded relative group border border-transparent transition-colors">
                                    <div>
                                        <p className="text-[11px] font-semibold text-slate-200">{app.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[8px] font-bold uppercase ${app.bg} ${app.color} px-1.5 py-0.5 rounded tracking-widest`}>
                                            {app.status}
                                        </span>
                                        <span className="text-[9px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-white/5 font-mono">{app.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link to="/company-hub?tab=tracker" className="block mt-4">
                            <Button variant="ghost" className="w-full h-8 text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]">
                                Full Dashboard <ChevronRight size={10} className="ml-1" />
                            </Button>
                        </Link>
                    </Card>

                </div>
            </div>
        </div>
    );
};

export default PlacementArena;
