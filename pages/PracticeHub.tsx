import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader, Button } from '../components/ui';
import { ArrowLeft, Calculator, MessageCircle, UserCheck, Code2, Zap } from 'lucide-react';

// Lazy-load the actual content components
import AptitudeTrainer from './AptitudeTrainer';
import GDSimulator from './GDSimulator';
import HRInterviewSimulator from './HRInterviewSimulator';
import DSATrainer from './DSATrainer';

type Tab = 'aptitude' | 'gd' | 'hr' | 'dsa';

const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string; activeColor: string }[] = [
    { id: 'aptitude', label: 'Aptitude', icon: <Calculator className="w-4 h-4" />, color: 'text-slate-400 hover:text-blue-400', activeColor: 'text-blue-400 bg-blue-500/15 border-blue-500/40' },
    { id: 'gd', label: 'GD Practice', icon: <MessageCircle className="w-4 h-4" />, color: 'text-slate-400 hover:text-cyan-400', activeColor: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/40' },
    { id: 'hr', label: 'HR Interview', icon: <UserCheck className="w-4 h-4" />, color: 'text-slate-400 hover:text-emerald-400', activeColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40' },
    { id: 'dsa', label: 'DSA & Coding', icon: <Code2 className="w-4 h-4" />, color: 'text-slate-400 hover:text-violet-400', activeColor: 'text-violet-400 bg-violet-500/15 border-violet-500/40' },
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

    return (
        <div className="space-y-4">
            {/* Tab Switcher */}
            <div className="flex items-center gap-2 flex-wrap bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${activeTab === tab.id
                            ? tab.activeColor
                            : `${tab.color} border-transparent`
                            }`}
                    >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[600px]">
                {activeTab === 'aptitude' && <AptitudeTrainer />}
                {activeTab === 'gd' && <GDSimulator />}
                {activeTab === 'hr' && <HRInterviewSimulator />}
                {activeTab === 'dsa' && <DSATrainer />}
            </div>
        </div>
    );
};

export default PracticeHub;
