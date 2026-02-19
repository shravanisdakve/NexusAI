import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader, Card, Button, Input } from '@/components/ui';
import {
    Bell,
    Calendar,
    ExternalLink,
    Clock,
    Megaphone,
    GraduationCap,
    Search,
    Filter,
    RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getUniversityDashboard, syncUniversityPortal, UniversityDashboardPayload } from '../services/universityService';

const UniversityStatus: React.FC = () => {
    const { t } = useLanguage();
    const [data, setData] = useState<UniversityDashboardPayload | null>(null);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const loadDashboard = async (opts?: { query?: string; category?: string }) => {
        setIsLoading(true);
        const payload = await getUniversityDashboard(opts);
        setData(payload);
        setIsLoading(false);
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadDashboard({ query, category });
        }, 250);
        return () => clearTimeout(timeout);
    }, [query, category]);

    const handleSync = async () => {
        setIsSyncing(true);
        const payload = await syncUniversityPortal();
        if (payload) {
            setData(payload);
        }
        setIsSyncing(false);
    };

    const categoryOptions = useMemo(() => {
        const categories = new Set((data?.circulars || []).map((item) => item.category));
        return Array.from(categories);
    }, [data]);

    if (isLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            <PageHeader
                title={t('university.title')}
                subtitle={t('university.subtitle')}
                icon={<Bell className="w-8 h-8 text-blue-400" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                        className="pl-9"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t('common.search')}
                    />
                </div>
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <select
                            className="w-full bg-slate-800 border-2 border-slate-600 rounded-lg py-3 pl-9 pr-3 text-white"
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                        >
                            <option value="">{t('common.filter')}</option>
                            {categoryOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                    <Button onClick={handleSync} isLoading={isSyncing}>
                        {t('common.sync')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-rose-500" />
                            {t('university.circularFeed')}
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {(data?.circulars || []).length === 0 && (
                            <Card className="p-5 text-sm text-slate-400">{t('university.noCirculars')}</Card>
                        )}
                        {(data?.circulars || []).map((item) => (
                            <Card key={item.id} className={`p-5 border-l-4 ${item.urgent ? 'border-l-rose-500 bg-rose-500/5' : 'border-l-blue-500 bg-slate-800/40'}`}>
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${item.urgent ? 'bg-rose-500 text-white' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {item.category}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-500">{item.dateLabel}</span>
                                        </div>
                                        <h4 className="text-lg font-bold text-white leading-tight">{item.title}</h4>
                                    </div>
                                    <a href={item.link} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <Card className="p-8 bg-gradient-to-br from-indigo-900/40 to-slate-900 border-indigo-500/30">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center p-3 shadow-2xl">
                                <img src="https://samarth.edu.in/images/logo.png" alt="SAMARTH Logo" className="w-full grayscale brightness-0 opacity-80" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-xl font-bold text-white mb-2">{t('university.samarthBridge')}</h3>
                                <p className="text-sm text-slate-400 mb-4">
                                    {t('university.samarthStatusInfo')}
                                </p>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs">
                                    <span className={`font-bold ${data?.samarthStatus?.sessionActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {t('university.sessionActive')}: {data?.samarthStatus?.sessionActive ? t('common.yes') : t('common.no')}
                                    </span>
                                    <span className="text-slate-500">
                                        {t('university.lastSynced')}: {data?.samarthStatus?.lastSyncedAt ? new Date(data.samarthStatus.lastSyncedAt).toLocaleString() : t('common.never')}
                                    </span>
                                </div>
                            </div>
                            <Button className="bg-indigo-600 hover:bg-indigo-500 whitespace-nowrap" onClick={handleSync} isLoading={isSyncing}>
                                {t('university.syncAction')}
                            </Button>
                        </div>
                    </Card>
                </div>

                <div className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2 px-2">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            {t('university.timeline')}
                        </h3>
                        <Card className="p-0 overflow-hidden">
                            <div className="divide-y divide-white/5">
                                {(data?.schedule || []).length === 0 && (
                                    <div className="p-4 text-sm text-slate-400">{t('university.noSchedule')}</div>
                                )}
                                {(data?.schedule || []).map((exam, index) => (
                                    <div key={`${exam.subject}-${index}`} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div>
                                            <h5 className="text-sm font-bold text-white">{exam.subject}</h5>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.dateLabel} {exam.time}</span>
                                                <span className="px-1.5 py-0.5 rounded bg-slate-800">{exam.status}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-blue-500 uppercase">
                                                {exam.daysRemaining !== null
                                                    ? t('university.days', { count: exam.daysRemaining })
                                                    : '--'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <Card className="p-6 border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-white">{t('university.forecast')}</h4>
                        </div>
                        {data?.forecast ? (
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">{t('university.predictedWindow')}</span>
                                    <span className="text-white">{data.forecast.startDateLabel} - {data.forecast.endDateLabel}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">{t('university.confidence')}</span>
                                    <span className="text-emerald-300 font-semibold">{data.forecast.confidencePercent}%</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400">{t('university.forecastUnavailable')}</p>
                        )}
                    </Card>

                    <div className="space-y-3">
                        <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">{t('university.links')}</h5>
                        <div className="grid grid-cols-1 gap-2">
                            {(data?.links || []).map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-white/5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                                >
                                    <span>{link.name}</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UniversityStatus;
