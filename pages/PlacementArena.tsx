import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Button, Card, Spinner } from '@/components/ui';
import {
    Briefcase,
    Target,
    Globe,
    ArrowRight,
    BarChart3,
    Terminal,
    Clock3,
    CheckCircle2,
    Calculator,
    MessageCircle,
    UserCheck,
    Building2,
    ClipboardList,
    Play,
    Code2,
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
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <PageHeader
                title={t('placement.title')}
                subtitle={t('placement.subtitle')}
                icon={<Briefcase className="w-8 h-8 text-amber-400" />}
            />

            {error && (
                <Card className="p-4 border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
                    {error}
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {(dashboard?.stats || []).map((stat, index) => (
                    <Card key={`${stat.label}-${index}`} className="p-6 text-center group hover:scale-[1.02] transition-transform">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">{stat.label}</p>
                        <h4 className={`text-2xl font-black ${stat.color || 'text-white'}`}>{stat.value}</h4>
                        {stat.college && <p className="text-[10px] text-slate-500 mt-1">{stat.college}</p>}
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 px-2">
                        <Target className="text-rose-500" />
                        {t('placement.activeSimulators')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(dashboard?.simulators || []).map((simulator) => (
                            <Card key={simulator.slug} className="p-6 border border-slate-700/50 bg-slate-800/40 flex flex-col h-full">
                                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6 shadow-xl">
                                    <Terminal className="w-6 h-6" />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2">{simulator.name}</h4>
                                <p className="text-sm text-slate-400 mb-4 flex-1">{simulator.description}</p>
                                <div className="text-xs text-slate-500 mb-4 flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                        <Clock3 size={12} />
                                        {t('placement.minutesShort', { minutes: simulator.durationMin })}
                                    </span>
                                    <span>{t('placement.questionsShort', { count: simulator.questionCount })}</span>
                                </div>
                                <Link to={simulator.href}>
                                    <Button className="w-full gap-2">
                                        {t('placement.launchSimulator')} <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </Card>
                        ))}
                    </div>

                    {/* NEW: Placement Prep Tools */}
                    <h3 className="text-xl font-bold flex items-center gap-2 px-2 mt-4">
                        <Target className="text-violet-500" />
                        Placement Prep Tools
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { name: 'Aptitude Trainer', desc: 'Practice Quant, Logical, Verbal & DI', href: '/practice-hub?tab=aptitude', icon: <Calculator className="w-5 h-5" />, color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
                            { name: 'GD Simulator', desc: 'Practice Group Discussions with AI', href: '/practice-hub?tab=gd', icon: <MessageCircle className="w-5 h-5" />, color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10' },
                            { name: 'HR Interview', desc: 'Crack the HR round with practice', href: '/practice-hub?tab=hr', icon: <UserCheck className="w-5 h-5" />, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
                            { name: 'Company Profiles', desc: 'Test patterns for TCS, Infosys & more', href: '/company-hub?tab=companies', icon: <Building2 className="w-5 h-5" />, color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
                            { name: 'Placement Tracker', desc: 'Track your application journey', href: '/company-hub?tab=tracker', icon: <ClipboardList className="w-5 h-5" />, color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10' },
                            { name: 'DSA & Coding', desc: 'Practice coding for placement rounds', href: '/practice-hub?tab=dsa', icon: <Code2 className="w-5 h-5" />, color: 'text-violet-400', border: 'border-violet-500/30', bg: 'bg-violet-500/10' },
                            { name: 'Learning Resources', desc: 'Curated YouTube tutorials & guides', href: '/learning-resources', icon: <Play className="w-5 h-5" />, color: 'text-pink-400', border: 'border-pink-500/30', bg: 'bg-pink-500/10' },
                        ].map(tool => (
                            <Link key={tool.href} to={tool.href}>
                                <Card className={`p-5 border ${tool.border} hover:scale-[1.02] transition-all cursor-pointer group`}>
                                    <div className={`w-10 h-10 rounded-xl ${tool.bg} border ${tool.border} flex items-center justify-center ${tool.color} mb-3 group-hover:scale-110 transition-transform`}>
                                        {tool.icon}
                                    </div>
                                    <h4 className="font-bold text-white text-sm mb-1">{tool.name}</h4>
                                    <p className="text-[11px] text-slate-400">{tool.desc}</p>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    <Card className="p-8 bg-gradient-to-br from-indigo-900/40 to-slate-900 border-indigo-500/30">
                        <h3 className="text-2xl font-bold text-white mb-4">{t('placement.resumeTitle')}</h3>
                        <p className="text-slate-400 mb-6 text-sm">
                            {t('placement.resumeDescription')}
                        </p>
                        <Link to="/resume-builder">
                            <Button type="button" variant="outline" className="gap-2 border-indigo-500 text-indigo-400 hover:bg-indigo-500/10">
                                {t('placement.resumeAction')} <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </Card>

                    <Card className="p-6 border-emerald-500/20 bg-emerald-500/5">
                        <h4 className="font-bold text-emerald-300 mb-4 flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            {t('placement.recentAttempts')}
                        </h4>
                        {attempts.length === 0 ? (
                            <p className="text-sm text-slate-400">{t('placement.noAttempts')}</p>
                        ) : (
                            <div className="space-y-3">
                                {attempts.map((attempt) => (
                                    <div key={attempt._id} className="flex items-center justify-between bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{attempt.simulatorName}</p>
                                            <p className="text-xs text-slate-500">
                                                {t('placement.readinessLabel', { band: attempt.readinessBand })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-emerald-400">{attempt.accuracy}%</p>
                                            <p className="text-[10px] text-slate-500">{attempt.pace}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 px-2">
                        <Globe className="text-blue-400" />
                        {t('placement.startupHub')}
                    </h3>
                    <Card className="p-6 space-y-4">
                        {(dashboard?.startups || []).map((startup, index) => (
                            <div key={`${startup.name}-${index}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
                                <div>
                                    <h5 className="font-bold text-white">{startup.name}</h5>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{startup.sector}</p>
                                </div>
                                <span className="text-[10px] font-mono text-blue-400 text-right">{startup.stack}</span>
                            </div>
                        ))}
                        <Button variant="ghost" className="w-full text-xs text-slate-500 hover:text-white">
                            {t('placement.viewMore')}
                        </Button>
                    </Card>

                    <Card className="p-6 bg-amber-500/5 border-amber-500/20">
                        <h4 className="font-bold text-amber-400 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            {t('placement.collegeTrends')}
                        </h4>
                        <div className="space-y-3">
                            {(dashboard?.trends || []).slice(0, 4).map((trend) => (
                                <div key={trend.collegeName} className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400">{trend.collegeName}</span>
                                    <span className="text-sm font-bold text-white">Rs {Number(trend.avgPackage || 0).toFixed(1)} LPA</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-700/40 flex justify-between items-center">
                            <span className="text-xs text-slate-500">{t('placement.averageShown')}</span>
                            <span className="text-sm text-amber-300 font-semibold">Rs {averageTrend.toFixed(1)} LPA</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PlacementArena;
