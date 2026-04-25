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
    Sparkles,
    Brain,
    LayoutList,
    Rows,
    Info,
    CheckCircle2,
    AlertCircle,
    ClipboardList,
    ChevronDown,
    BookOpen,
    ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getUniversityDashboard, syncUniversityPortal, UniversityDashboardPayload, UniversityCircular } from '../services/universityService';
import { onMuNotification } from '../services/communityService';
import { ToastContainer } from '@/components/ui';
import { ESSENTIAL_MU_LINKS, normalizeMuUrl } from '../data/muLinks';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../components/ui/PageLayout';

const UpdateCard: React.FC<{ item: any }> = ({ item }) => (
    <div className="flex items-start justify-between gap-3 px-4 py-3 
                  bg-slate-800/30 border border-slate-700/40 rounded-xl 
                  hover:border-blue-500/30 transition-colors group">
      <div className="flex items-start gap-3">
        <span className={`
          text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest shrink-0 mt-0.5
          ${item.category === 'RESULTS'  ? 'bg-emerald-500/10 text-emerald-400' : ''}
          ${item.category === 'EXAMS'    ? 'bg-blue-500/10  text-blue-400'  : ''}
          ${item.category === 'ACADEMIC' ? 'bg-purple-500/10 text-purple-400': ''}
          ${item.category === 'EVENTS'   ? 'bg-orange-500/10 text-orange-400': ''}
        `}>
          {item.category}
        </span>
        <div>
          <p className="text-sm text-white font-medium leading-snug">{item.title}</p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.dateLabel || item.date}</p>
        </div>
      </div>
      <a
        href={normalizeMuUrl(item.link || item.url)}
        target="_blank"
        rel="noreferrer"
        className="p-2 rx-xl bg-white/5 border border-white/10 text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-all shrink-0 mt-0.5"
      >
        <ExternalLink size={14} />
      </a>
    </div>
);

const CircularCard: React.FC<{ item: UniversityCircular; isCompact: boolean; t: any }> = ({ item, isCompact, t }) => (
    <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
    >
        <Card className={`group relative transition-all border-slate-700/40 hover:border-slate-600 overflow-hidden ${isCompact ? 'p-3' : 'p-4'
            } ${item.urgent ? 'bg-rose-500/5' : 'bg-slate-800/30'}`}>
            {item.urgent && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" />
            )}

            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-tighter ${item.urgent ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                            {item.category}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-500">{item.dateLabel}</span>
                    </div>
                    <h4 className={`font-bold text-slate-100 leading-snug group-hover:text-white transition-colors ${isCompact ? 'text-sm truncate' : 'text-base'
                        }`}>
                        {item.title}
                    </h4>
                </div>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        window.open(normalizeMuUrl(item.link), '_blank');
                    }}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-all shadow-sm shrink-0"
                    title="Open Official Circular"
                >
                    <ExternalLink className="w-4 h-4" />
                </button>
            </div>
        </Card>
    </motion.div>
);

const UniversityStatus: React.FC = () => {
    const { t } = useLanguage();
    const [data, setData] = useState<UniversityDashboardPayload | null>(null);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isCompact, setIsCompact] = useState(false);
    const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
    const [activeTab, setActiveTab] = useState<string>('results');

    const tabs = [
        {
            id: 'results',
            label: 'Updates',
            icon: <ClipboardList className="w-4 h-4" />,
            color: 'text-emerald-400',
        },
        {
            id: 'exams',
            label: 'Exams',
            icon: <Calendar className="w-4 h-4" />,
            color: 'text-blue-400',
        },
        {
            id: 'academic',
            label: 'Student Services',
            icon: <BookOpen className="w-4 h-4" />,
            color: 'text-purple-400',
        },
        {
            id: 'events',
            label: 'Official Portals',
            icon: <Megaphone className="w-4 h-4" />,
            color: 'text-orange-400',
        },
    ];

    const getSearchPlaceholder = () => {
        switch (activeTab) {
            case 'results': return 'Search recent notices...';
            case 'exams': return 'Search your exam cycle...';
            case 'academic': return 'Find student tools...';
            case 'events': return 'Search verified URLs...';
            default: return 'Search...';
        }
    };

    const ShimmerCard = () => (
        <div className="w-full h-20 bg-white/[0.02] border border-white/[0.03] rounded-2xl relative overflow-hidden">
            <motion.div 
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent w-full"
            />
        </div>
    );

    const EmptyState = ({ message, sub }: { message: string, sub: string }) => (
        <div className="relative group p-1 w-full">
            {/* Shimmer Background Grid to feel 'Alive' */}
            <div className="absolute inset-x-4 inset-y-10 grid grid-cols-1 gap-4 opacity-50 pointer-events-none">
                <ShimmerCard />
                <ShimmerCard />
                <ShimmerCard />
            </div>

            <div className="relative flex flex-col items-center justify-center p-24 text-center z-10">
                <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-white/5 flex items-center justify-center mb-8 shadow-2xl">
                    <Megaphone className="w-8 h-8 text-slate-700" />
                </div>
                <h3 className="text-xl font-black text-slate-100 uppercase tracking-tight italic">No updates right now</h3>
                <p className="text-slate-500 mt-2 text-[11px] font-bold uppercase tracking-[0.2em] max-w-[320px] leading-relaxed">
                    University notices for your selected semester will appear here once verified by our system.
                </p>
                <button 
                    onClick={() => { setQuery(''); }}
                    className="mt-10 px-8 py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase text-blue-400 tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-900/10"
                >
                    View all semesters
                </button>
            </div>
        </div>
    );

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).substring(2, 11);
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const loadDashboard = async (opts?: { query?: string; category?: string }) => {
        setIsLoading(true);
        const payload = await getUniversityDashboard(opts);
        setData(payload);
        setIsLoading(false);
    };

    const [openSems, setOpenSems] = useState<string[]>([]); // To track expanded semesters

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadDashboard({ query, category });
        }, 250);
        return () => clearTimeout(timeout);
    }, [query, category]);

    // Group results by semester extracted from title
    const groupBySemester = (results: any[]) => {
        const groups: Record<string, any[]> = {};
        results.forEach(r => {
            // Updated regex to handle more variations and trim spaces
            const match = r.title.match(/Semester\s*[-–]?\s*([IVX\d]+)/i);
            const key = match ? `Semester ${match[1].trim()}` : 'General Updates';
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
        });

        // Sort keys: Semester IV, Semester III, Semester II, Semester I, General
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            if (a === 'General Updates') return 1;
            if (b === 'General Updates') return -1;
            return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
        });

        const sortedGroups: Record<string, any[]> = {};
        sortedKeys.forEach(k => { sortedGroups[k] = groups[k]; });
        return sortedGroups;
    };

    const toggleSem = (sem: string) =>
        setOpenSems(prev =>
            prev.includes(sem) ? prev.filter(s => s !== sem) : [...prev, sem]
        );

    useEffect(() => {
        // Default open the first semester group (usually the latest)
        if (data?.circulars && openSems.length === 0) {
            const groups = groupBySemester(data.circulars);
            const firstSem = Object.keys(groups)[0];
            if (firstSem) setOpenSems([firstSem]);
        }
    }, [data]);

    useEffect(() => {
        const unsubscribe = onMuNotification((notification) => {
            if (notification?.message) {
                addToast(`MU Update: ${notification.message}`, 'info');
            }
            loadDashboard({ query, category });
        });
        return () => unsubscribe();
    }, [query, category]);

    const handleSync = async () => {
        setIsSyncing(true);
        addToast('Syncing live data from Mumbai University...', 'info');
        const payload = await syncUniversityPortal();
        if (payload) {
            setData(payload);
            addToast('Successfully synced with MU Servers', 'success');
        } else {
            addToast('Failed to sync. Please try again later.', 'error');
        }
        setIsSyncing(false);
    };

    const filteredCirculars = useMemo(() => {
        const circulars = data?.circulars || [];
        return circulars.filter(c => {
            const matchesSearch = c.title.toLowerCase().includes(query.toLowerCase());
            
            // Tab-specific category filtering
            let matchesTab = true;
            if (activeTab === 'results') matchesTab = c.category === 'RESULTS';
            if (activeTab === 'exams') matchesTab = c.category === 'EXAMS';
            if (activeTab === 'academic') matchesTab = c.category === 'ACADEMIC';
            if (activeTab === 'events') matchesTab = ['EVENTS', 'ADMISSION', 'SUPPORT'].includes(c.category);
            
            return matchesSearch && matchesTab;
        });
    }, [data, query, activeTab]);

    const groupedCirculars = useMemo(() => {
        const urgent = filteredCirculars.filter(c => c.urgent);
        const normal = filteredCirculars.filter(c => !c.urgent);
        
        if (category) {
            return { urgent, normal, groups: [] };
        }

        // Group by category when in "All" view
        const groupsMap: Record<string, UniversityCircular[]> = {};
        normal.forEach(item => {
            if (!groupsMap[item.category]) groupsMap[item.category] = [];
            groupsMap[item.category].push(item);
        });

        return {
            urgent,
            normal,
            groups: Object.entries(groupsMap).map(([name, items]) => ({ name, items }))
        };
    }, [filteredCirculars, category]);

    const categoryOptions = useMemo(() => {
        const categories = new Set((data?.circulars || []).map((item) => item.category));
        return Array.from(categories);
    }, [data]);

    const aiSummary = useMemo(() => {
        if (filteredCirculars.length === 0) return null;
        
        const urgentCount = groupedCirculars.urgent.length;
        const mainCategory = activeTab;
        
        let insight = `Analysis of ${filteredCirculars.length} ${mainCategory.toLowerCase()} items detected. `;
        if (urgentCount > 0) {
            insight += `Critical deadlines detected. `;
        } else {
            insight += `Status appears stable. `;
        }

        return {
            insight,
            alert: urgentCount > 0 ? 'ACTION REQUIRED: Review deadlines' : 'Status: Information only',
            readiness: urgentCount > 3 ? 'High Load' : 'Stable'
        };
    }, [filteredCirculars, groupedCirculars, activeTab]);

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-900 rounded-full border border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        Syncing Feed
                    </div>
                </div>
            </div>
        );
    }

    const MainContent = (
        <div className="h-full flex flex-col space-y-8 overflow-y-auto custom-scrollbar pr-2 pb-20">
            {/* ROW 1: Title & Hero Context */}
            <div className="px-1">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-blue-600/10 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-900/10">
                        <GraduationCap className="w-5 h-5 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">University Hub</h1>
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">
                    Verified real-time monitor for Mumbai University feed
                </p>
            </div>

            {/* ROW 2: Semester & Search Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-white/5 w-fit">
                    {['All', 'Sem VIII', 'Sem VII', 'Sem VI'].map(chip => (
                        <button 
                            key={chip} 
                            onClick={() => setQuery(chip === 'All' ? '' : chip)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                (chip === 'All' && !query) || (chip !== 'All' && query.includes(chip))
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {chip === 'Sem VIII' ? 'VIII' : chip === 'Sem VII' ? 'VII' : chip === 'Sem VI' ? 'VI' : 'ALL'}
                        </button>
                    ))}
                </div>

                <div className="relative group lg:max-w-xs ml-auto w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        id="university-search-input"
                        name="universitySearch"
                        type="text"
                        placeholder={getSearchPlaceholder()}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 text-xs font-bold bg-slate-950/80 border border-white/5 
                                 rounded-2xl text-slate-200 placeholder:text-slate-600 outline-none 
                                 focus:border-blue-500/30 transition-all shadow-inner"
                    />
                </div>
            </div>

            {/* ROW 3: Dense Tab Bar */}
            <div className="flex gap-1 p-1 bg-slate-900/60 rounded-2xl border border-white/5">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2.5 flex-1 justify-center px-3 py-2.5 rounded-xl 
                            text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden group
                            ${activeTab === tab.id
                                ? 'text-white'
                                : 'text-slate-400 hover:text-slate-200'}
                        `}
                    >
                        {activeTab === tab.id && (
                            <motion.div 
                                layoutId="activeTabBg"
                                className="absolute inset-0 bg-slate-800 border-x border-t border-white/5 shadow-inner"
                            />
                        )}
                        <span className={`relative z-10 ${activeTab === tab.id ? tab.color : 'text-slate-500'}`}>
                            {tab.icon}
                        </span>
                        <span className="relative z-10">{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div 
                                layoutId="activeTabIndicator"
                                className={`absolute bottom-0 inset-x-6 h-0.5 rounded-t-full ${tab.color.replace('text', 'bg')} shadow-[0_0_10px_rgba(59,130,246,0.5)]`}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="min-h-[400px]"
                >
                    {activeTab === 'results' && (
                        filteredCirculars.length === 0 ? (
                            <EmptyState 
                                message="No updates detected" 
                                sub="MU result updates for your selected track will appear here when verified."
                            />
                        ) : (
                            <div className="space-y-6">
                                {/* AI Perspective */}
                                {aiSummary && (
                                    <div className="bg-slate-800/20 border border-blue-500/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full -mr-40 -mt-40 transition-colors group-hover:bg-blue-500/10" />
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-slate-950/60 rounded-xl border border-white/5"><Brain size={14} className="text-blue-400" /></div>
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Intelligence Report</h4>
                                        </div>
                                        <p className="text-lg text-slate-300 font-medium leading-relaxed italic tracking-tight relative z-10">
                                            "{aiSummary.insight}"
                                        </p>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 gap-4">
                                    {Object.entries(groupBySemester(filteredCirculars)).map(([sem, items]) => (
                                        <div key={sem} className="border border-white/5 rounded-2xl overflow-hidden bg-slate-950/20">
                                            <button
                                                onClick={() => toggleSem(sem)}
                                                className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/[0.02] transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-base font-black text-white uppercase italic tracking-tighter">{sem}</span>
                                                    <span className="h-4 w-px bg-white/5" />
                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{items.length} Circulars</span>
                                                </div>
                                                <ChevronDown size={16} className={`text-slate-500 transition-transform duration-500 ${openSems.includes(sem) ? 'rotate-180' : ''}`} />
                                            </button>
                                            {openSems.includes(sem) && (
                                                <div className="divide-y divide-white/[0.03] border-t border-white/[0.03]">
                                                    {items.map(item => (
                                                        <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between px-6 py-5 hover:bg-white/[0.03] transition-colors group">
                                                            <div className="flex-1 pr-10">
                                                                <p className="text-[13px] font-bold text-slate-200 leading-snug group-hover:text-blue-400 transition-colors">
                                                                    {item.title}
                                                                </p>
                                                                <div className="flex items-center gap-3 mt-2">
                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.dateLabel}</span>
                                                                    <span className="text-[9px] font-black text-emerald-500/60 bg-emerald-500/5 px-2 py-0.5 rounded uppercase tracking-widest">Verified</span>
                                                                </div>
                                                            </div>
                                                            <a href={normalizeMuUrl(item.link)} target="_blank" className="mt-4 md:mt-0 p-3 bg-slate-900 border border-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><ExternalLink size={14} /></a>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    )}

                    {activeTab === 'exams' && (
                        <div className="space-y-6">
                            <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-8">Exam Timeline Feed</h3>
                                <div className="space-y-4">
                                    {(data?.schedule || []).map((exam, index) => (
                                        <motion.div 
                                            key={index} 
                                            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.03)' }}
                                            className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.015] border border-white/[0.04] group transition-all"
                                        >
                                            <div className="flex-1">
                                                <p className="text-base font-black text-white italic tracking-tighter uppercase leading-none mb-2">{exam.subject}</p>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" /> Verified Sequence
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end text-right">
                                                <p className="text-[11px] font-mono font-bold text-slate-300 leading-none mb-1.5">{exam.dateLabel}</p>
                                                <span className={`text-[9px] font-black px-3 py-1 rounded-lg border ${
                                                    exam.daysRemaining !== null && exam.daysRemaining < 10 
                                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                                    : 'bg-blue-600/10 text-blue-400 border-blue-600/20'
                                                }`}>
                                                    {exam.daysRemaining !== null ? `${exam.daysRemaining}D` : 'TBD'}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'academic' && (
                        <div className="space-y-8">
                            {/* Primary Portal - Tighter Hero */}
                            <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900/40 border border-indigo-500/20 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 right-0 p-40 bg-indigo-500/5 blur-[120px] rounded-full -mr-20 -mt-20 group-hover:bg-indigo-500/10 transition-all duration-1000" />
                                <div className="relative z-10 flex flex-col xl:flex-row items-center gap-8">
                                    <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center p-4 shadow-2xl shrink-0 border border-indigo-500/20 backdrop-blur-xl group relative overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                                            <GraduationCap size={60} className="text-indigo-400" />
                                        </div>
                                        <div className="relative z-10 flex flex-col items-center">
                                            <GraduationCap size={24} className="text-indigo-400 mb-1" />
                                            <span className="text-[8px] font-black text-indigo-300 uppercase tracking-tighter">SAMARTH</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 text-center xl:text-left">
                                        <div className="flex flex-col gap-1 mb-4 xl:items-start items-center">
                                            <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-3 py-0.5 rounded-full border border-indigo-500/10 uppercase tracking-[0.2em] w-fit">Ver 2.4.0</span>
                                            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">SAMARTH Portal Bridge</h3>
                                        </div>
                                        <p className="text-[12px] text-slate-400 font-medium leading-relaxed max-w-xl italic">
                                            Synchronize with Mumbai University student portal for examination records and subject registration.
                                        </p>
                                    </div>
                                    <Button 
                                        className="bg-white hover:bg-slate-200 text-slate-950 text-[10px] font-black uppercase tracking-[0.2em] h-12 px-10 rounded-xl shadow-2xl shrink-0 active:scale-95 transition-all" 
                                        onClick={handleSync} 
                                        isLoading={isSyncing}
                                    >
                                        Portal Sync <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </div>

                            {/* Utility Tiles Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {[
                                    { label: 'Hall Ticket', icon: ClipboardList, desc: 'Download upcoming exam passes' },
                                    { label: 'Registration', icon: CheckCircle2, desc: 'Subject selection & enrollment' },
                                    { label: 'Transcript', icon: GraduationCap, desc: 'Digital grade cards & records' },
                                    { label: 'Profile', icon: Info, desc: 'University personal record' },
                                    { label: 'Form Fill', icon: Filter, desc: 'Exam form & backlog submissions' },
                                    { label: 'Payments', icon: Sparkles, desc: 'Verify fee payment status' }
                                ].map((tool, i) => (
                                    <motion.div 
                                        key={i} 
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        className="p-6 bg-slate-900/40 border border-white/[0.04] rounded-3xl hover:border-indigo-500/40 hover:bg-indigo-900/5 transition-all group cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-16 bg-indigo-500/[0.02] blur-2xl rounded-full -mr-8 -mt-8" />
                                        <div className="relative z-10">
                                            <div className="p-2.5 bg-slate-950 border border-white/5 rounded-xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xl">
                                                <tool.icon size={16} className="text-slate-400 group-hover:text-white" />
                                            </div>
                                            <p className="text-[13px] font-black text-slate-100 uppercase italic mb-1 tracking-tight">{tool.label}</p>
                                            <p className="text-[10px] font-medium text-slate-500 leading-tight group-hover:text-slate-400">{tool.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'events' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ESSENTIAL_MU_LINKS.map(link => (
                                <motion.a
                                    key={link.href}
                                    href={link.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    whileHover={{ y: -3, backgroundColor: 'rgba(249,115,22,0.05)' }}
                                    className="flex items-start gap-5 p-5 bg-white/[0.015] rounded-3xl 
                                             border border-white/[0.04] hover:border-orange-500/30 
                                             transition-all group"
                                >
                                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-600 group-hover:text-orange-400 group-hover:bg-orange-500/10 group-hover:border-orange-500/20 transition-all shadow-sm"><ExternalLink size={16} /></div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[14px] font-black text-slate-100 uppercase italic tracking-tighter leading-none mb-1.5">{link.name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed group-hover:text-slate-200 transition-colors uppercase tracking-wide italic">{link.description}</p>
                                    </div>
                                </motion.a>
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );

    const SideContent = (
        <div className="space-y-6">
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            
            <div className="p-6 bg-slate-900/40 rounded-[2.5rem] border border-white/[0.06] shadow-2xl">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6">Feed Controls</p>
                <div className="flex gap-2">
                    <Button 
                        className={`flex-1 h-12 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${isCompact ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'bg-slate-950/60 border border-white/5 text-slate-500 hover:text-slate-300'}`}
                        onClick={() => setIsCompact(true)}
                    >
                        Compact
                    </Button>
                    <Button 
                        className={`flex-1 h-12 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${!isCompact ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'bg-slate-950/60 border border-white/5 text-slate-500 hover:text-slate-300'}`}
                        onClick={() => setIsCompact(false)}
                    >
                        Master
                    </Button>
                </div>
            </div>

            <div className="p-6 bg-slate-900/40 rounded-[2.5rem] border border-white/[0.06] shadow-2xl">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-8">Academic Pulse</p>
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">Global Sync</p>
                            <p className="text-[11px] font-bold text-slate-300 italic">2m ago</p>
                        </div>
                        <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded-lg border border-emerald-500/20 uppercase tracking-widest">LIVE</div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">Integrity Status</p>
                        <p className="text-[11px] font-bold text-blue-400 italic">Verified by Nexus Core</p>
                    </div>
                </div>
                <div className="mt-10 pt-6 border-t border-white/5 text-[9px] text-slate-700 font-black uppercase tracking-[0.2em] leading-relaxed italic text-center">
                    Data persists locally via MU Proxy
                </div>
            </div>
        </div>
    );

    return (
        <PageLayout 
            main={MainContent}
            side={SideContent}
        />
    );
};

export default UniversityStatus;
