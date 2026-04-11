import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, Button, Card } from '../components/ui';
import { 
    Calculator, 
    MessageCircle, 
    UserCheck, 
    Code2, 
    Sparkles, 
    TrendingUp, 
    Zap, 
    Target,
    Brain,
    Palette
} from 'lucide-react';
import PageLayout from '../components/ui/PageLayout';

// Lazy-load the actual content components
import AptitudeTrainer from './AptitudeTrainer';
import GDSimulator from './GDSimulator';
import HRInterviewSimulator from './HRInterviewSimulator';
import DSATrainer from './DSATrainer';

type Tab = 'overview' | 'aptitude' | 'gd' | 'hr' | 'dsa';

const TABS: { id: Tab; label: string; summary: string; icon: React.ElementType; color: string; activeColor: string; accent: string }[] = [
    { 
        id: 'overview', 
        label: 'Nexus Overview', 
        summary: 'Your unified placement readiness roadmap.', 
        icon: Target, 
        color: 'text-slate-400 hover:text-white', 
        activeColor: 'text-white bg-slate-800 border-white/20',
        accent: 'slate'
    },
    { 
        id: 'aptitude', 
        label: 'Aptitude & Logic', 
        summary: 'Quantitative and logical reasoning patterns.', 
        icon: Brain, 
        color: 'text-slate-400 hover:text-blue-400', 
        activeColor: 'text-blue-400 bg-blue-500/15 border-blue-500/40',
        accent: 'blue'
    },
    { 
        id: 'dsa', 
        label: 'Coding Mastery', 
        summary: 'Data structures and algorithm mastery.', 
        icon: Code2, 
        color: 'text-slate-400 hover:text-violet-400', 
        activeColor: 'text-violet-400 bg-violet-500/15 border-violet-500/40',
        accent: 'violet'
    },
    { 
        id: 'gd', 
        label: 'GD Simulator', 
        summary: 'Group discussions with AI-powered simulators.', 
        icon: MessageCircle, 
        color: 'text-slate-400 hover:text-cyan-400', 
        activeColor: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/40',
        accent: 'cyan'
    },
    { 
        id: 'hr', 
        label: 'HR Interview', 
        summary: 'Behavioral and situational HR practice.', 
        icon: UserCheck, 
        color: 'text-slate-400 hover:text-emerald-400', 
        activeColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40',
        accent: 'emerald'
    },
];

const PracticeHub: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as Tab) || 'aptitude';
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    const MainContent = (
        <div className="min-h-full space-y-8">
            <PageHeader
                title="Practice Hub"
                subtitle="High-fidelity training for placement assessments"
                icon={<Target className="w-8 h-8 text-amber-400" />}
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {TABS.filter(t => t.id !== 'overview').map(track => (
                                <div key={track.id} className="cursor-pointer group" onClick={() => handleTabChange(track.id)}>
                                    <Card className="p-5 bg-slate-900/40 border-white/[0.05] hover:border-violet-500/30 transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`p-2 rounded-lg bg-slate-950 border border-white/5 ${track.color}`}>
                                                <track.icon size={20} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 group-hover:text-violet-400 transition-colors uppercase tracking-widest">Select Track</span>
                                        </div>
                                        <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight mb-2">{track.label}</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                                <span>Readiness</span>
                                                <span className="text-white">65%</span>
                                            </div>
                                            <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                                                <div className="h-full bg-violet-500/50 w-[65%]" />
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                                ))}
                            </div>

                            <Card className="p-8 bg-[#0A0C10] border-violet-500/20 rounded-[2.5rem] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 blur-[100px] rounded-full -mr-48 -mt-48" />
                                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-xl">
                                                <Zap size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">AI Placement Readiness</h2>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Cross-Track Analysis Feed</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed max-w-xl font-medium">
                                            Based on your recent performance in <span className="text-blue-400 underline decoration-blue-500/30 underline-offset-4">Quantitative Logic</span> and <span className="text-emerald-400 underline decoration-emerald-500/30 underline-offset-4">HR Simulations</span>, your overall readiness for TCS Digital & Infosys SP roles is at <span className="text-white font-black italic">Advanced Tier</span>. Focus on Graph Algorithms to hit Elite status.
                                        </p>
                                        <div className="flex gap-3">
                                            <Button className="h-11 px-8 bg-violet-600 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-violet-600/20">Generate Full Report</Button>
                                            <Button variant="ghost" className="h-11 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Review Roadmap</Button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center p-8 bg-slate-950 rounded-[2rem] border border-white/5 shadow-2xl">
                                        <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                                            <svg className="w-full h-full -rotate-90">
                                                <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/[0.03]" />
                                                <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="364.4" strokeDashoffset="91.1" className="text-violet-500 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-3xl font-black text-white italic leading-none">75</span>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Score</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Tier: Advanced</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                    {activeTab === 'aptitude' && <AptitudeTrainer />}
                    {activeTab === 'gd' && <GDSimulator />}
                    {activeTab === 'hr' && <HRInterviewSimulator standalone={false} />}
                    {activeTab === 'dsa' && <DSATrainer />}
                </motion.div>
            </AnimatePresence>
        </div>
    );

    const SideContent = (
        <div className="space-y-6">
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/[0.06]">
                <p className="eyebrow-label mb-4">Training Tracks</p>
                <div className="flex flex-col gap-2">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all border ${activeTab === tab.id
                                ? tab.activeColor
                                : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'
                                }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? '' : 'opacity-60'}`} />
                            <span className="flex-1 text-left">{tab.label}</span>
                            {activeTab === tab.id && <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-indigo-400" />
                    <p className="text-[10px] uppercase font-black text-indigo-400 tracking-widest leading-none">AI Focus Advice</p>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-4 italic">
                    {activeTab === 'aptitude' ? 'Start with Quantitative Aptitude if you are new.' : 
                     activeTab === 'gd' ? 'Try the "AI Threat to Jobs" topic for a challenging start.' :
                     activeTab === 'hr' ? 'Master your personal introduction (STAR method).' :
                     'Review Array and LinkedList foundations.'}
                </p>
                <Button size="sm" variant="ghost" className="w-full h-8 text-[9px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider bg-indigo-500/5">
                    Why this focus?
                </Button>
            </div>

            <div className="p-5 bg-slate-900/40 rounded-2xl border border-white/[0.05]">
                <p className="eyebrow-label mb-3">Overall Readiness</p>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500 font-bold uppercase">Placement Score</span>
                            <span className="text-violet-400 font-black">740/800</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 w-[92%]" />
                        </div>
                    </div>
                    <div className="pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={12} className="text-emerald-400" />
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Rising Fast</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Top 12%</span>
                    </div>
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

export default PracticeHub;
