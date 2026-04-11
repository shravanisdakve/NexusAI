import React, { useState } from 'react';
import { PageHeader, Card, Button } from '../components/ui';
import { 
    Target, 
    Terminal, 
    Calculator, 
    Building2, 
    Globe, 
    ChevronRight, 
    Clock3, 
    ArrowRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/ui/PageLayout';

interface Tool {
    id: string;
    name: string;
    description: string;
    category: 'simulators' | 'aptitude' | 'company' | 'startups';
    href: string;
    durationMin?: number;
    questionCount?: number;
    icon: React.ReactNode;
    tags?: string[];
}

const TOOLS: Tool[] = [
    // Simulators
    {
        id: 'tcs-nqt',
        name: 'TCS NQT Simulator',
        description: 'Complete mock environment for TCS National Qualifier Test including coding sections.',
        category: 'simulators',
        href: '/placement/tcs-nqt',
        durationMin: 165,
        questionCount: 80,
        icon: <Terminal className="w-5 h-5" />,
        tags: ['High Yield', 'NQT 2026']
    },
    {
        id: 'capgemini',
        name: 'Capgemini Exceller Drive',
        description: 'Game-based aptitude and pseudocode assessment environment.',
        category: 'simulators',
        href: '/placement/capgemini',
        durationMin: 120,
        questionCount: 65,
        icon: <Terminal className="w-5 h-5" />,
    },
    {
        id: 'infosys',
        name: 'Infosys SP/DSE Mock',
        description: 'Specialist Programmer and Digital Specialist Engineer assessment patterns.',
        category: 'simulators',
        href: '/placement/infosys',
        durationMin: 180,
        questionCount: 3,
        icon: <Terminal className="w-5 h-5" />,
    },
    // Aptitude
    {
        id: 'quant-master',
        name: 'Quantitative Master',
        description: 'Topic-wise practice for speed math, arithmetic and data interpretation.',
        category: 'aptitude',
        href: '/practice-hub?tab=aptitude',
        icon: <Calculator className="w-5 h-5" />,
    },
    {
        id: 'logical-pro',
        name: 'Logical Reasoning Pro',
        description: 'Master puzzles, syllogisms, and analytical reasoning patterns.',
        category: 'aptitude',
        href: '/practice-hub?tab=aptitude',
        icon: <Calculator className="w-5 h-5" />,
    },
    // Company-Specific
    {
        id: 'accenture-cognitive',
        name: 'Accenture Cognitive Prep',
        description: 'Practice for Accenture specific game-based cognitive assessments.',
        category: 'company',
        href: '/company-hub?tab=companies',
        icon: <Building2 className="w-5 h-5" />,
    },
    {
        id: 'jpmc-code-for-good',
        name: 'JPMC Code For Good',
        description: 'Hackathon-style preparation and previous year problem statements.',
        category: 'company',
        href: '/company-hub?tab=companies',
        icon: <Building2 className="w-5 h-5" />,
    },
    // Startups
    {
        id: 'mumbai-startup-hub',
        name: 'Mumbai Startup Hub',
        description: 'Direct portal to high-growth startups in Mumbai looking for freshers.',
        category: 'startups',
        href: '/company-hub',
        icon: <Globe className="w-5 h-5" />,
    }
];

const TabBar = ({ tabs, activeTab, onTabChange }: { tabs: { id: string, label: string }[], activeTab: string, onTabChange: (id: any) => void }) => (
    <div className="flex items-center gap-2 bg-slate-800/40 p-1 rounded-xl border border-white/5 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
            >
                {tab.label}
            </button>
        ))}
    </div>
);

const ToolCard = ({ tool }: { tool: Tool }) => (
    <Card className="p-4 border-slate-700/50 bg-slate-800/40 hover:border-brand-primary/30 transition-all group flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 group-hover:text-brand-primary transition-colors shadow-lg">
                {tool.icon}
            </div>
            {tool.tags && (
                <div className="flex gap-1">
                    {tool.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[8px] font-black uppercase border border-brand-primary/20">
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
        <h4 className="font-bold text-white text-[15px] mb-1">{tool.name}</h4>
        <p className="text-[13px] leading-relaxed text-slate-400 mb-4 line-clamp-2">
            {tool.description}
        </p>
        <div className="mt-auto space-y-4">
            {(tool.durationMin || tool.questionCount) && (
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {tool.durationMin && <span className="flex items-center gap-1"><Clock3 size={12} /> {tool.durationMin} MIN</span>}
                    {tool.questionCount && <span className="flex items-center gap-1"><Target size={12} /> {tool.questionCount} {tool.category === 'simulators' ? 'QUESTIONS' : 'SETS'}</span>}
                </div>
            )}
            <Link to={tool.href}>
                <Button size="md" className="w-full gap-2 text-[11px] font-black uppercase tracking-[0.15em] bg-slate-700 hover:bg-brand-primary group-hover:bg-brand-primary transition-colors h-10 shadow-none">
                    Launch Tool <ArrowRight size={14} className="-mr-1" />
                </Button>
            </Link>
        </div>
    </Card>
);

const PrepTools: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'simulators' | 'aptitude' | 'company' | 'startups'>('simulators');

    const filteredTools = TOOLS.filter(tool => tool.category === activeTab);

    return (
        <PageLayout
            main={
                <div className="space-y-8 animate-fade-in">
                    <PageHeader 
                        title="Placement Prep Tools" 
                        subtitle="Simulators, aptitude trainers and company-specific prep"
                        icon={<Target className="w-8 h-8 text-brand-primary" />}
                    />

                    <TabBar 
                        tabs={[
                            { id: 'simulators', label: 'Simulators' },
                            { id: 'aptitude', label: 'Aptitude' },
                            { id: 'company', label: 'Company-Specific' },
                            { id: 'startups', label: 'Startups & Others' },
                        ]} 
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                        {filteredTools.length > 0 ? (
                            filteredTools.map((tool, i) => (
                                <div key={tool.id} className={i === 0 ? "md:col-span-2 lg:col-span-2" : ""}>
                                    <ToolCard tool={tool} />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center">
                                <p className="text-slate-500 text-sm">No tools available in this category yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            }
            side={
                <div className="space-y-6">
                    <Card className="p-5 border-brand-primary/20 bg-brand-primary/5">
                        <div className="flex items-center gap-2 mb-4">
                            <Target size={18} className="text-brand-primary" />
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Prep Progress</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 italic">
                                    <span>Simulators</span>
                                    <span className="text-brand-primary">2/12</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-brand-primary w-[16%]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 italic">
                                    <span>Aptitude</span>
                                    <span className="text-amber-400">45%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-amber-500 w-[45%]" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 border-slate-700/50 bg-slate-900/40">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Upcoming Drives</h4>
                        <div className="space-y-3">
                            {[
                                { name: 'JPMC code for good', date: 'Apr 12', type: 'Hackathon' },
                                { name: 'Morgan Stanley', date: 'Apr 20', type: 'Technical' },
                                { name: 'Barclays', date: 'May 05', type: 'Aptitude' }
                            ].map(drive => (
                                <div key={drive.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-white/5">
                                    <div>
                                        <p className="text-[11px] font-bold text-white">{drive.name}</p>
                                        <p className="text-[9px] text-slate-500 uppercase">{drive.type}</p>
                                    </div>
                                    <span className="text-[10px] font-mono text-brand-primary">{drive.date}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            }
        />
    );
};

export default PrepTools;
