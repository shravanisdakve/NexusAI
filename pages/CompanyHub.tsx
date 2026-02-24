import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, ClipboardList } from 'lucide-react';

import CompanyProfiles from './CompanyProfiles';
import PlacementTracker from './PlacementTracker';

type Tab = 'companies' | 'tracker';

const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string; activeColor: string }[] = [
    { id: 'companies', label: 'Company Profiles', icon: <Building2 className="w-4 h-4" />, color: 'text-slate-400 hover:text-amber-400', activeColor: 'text-amber-400 bg-amber-500/15 border-amber-500/40' },
    { id: 'tracker', label: 'My Applications', icon: <ClipboardList className="w-4 h-4" />, color: 'text-slate-400 hover:text-rose-400', activeColor: 'text-rose-400 bg-rose-500/15 border-rose-500/40' },
];

const CompanyHub: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as Tab) || 'companies';
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    return (
        <div className="space-y-4">
            {/* Tab Switcher */}
            <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50">
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
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[600px]">
                {activeTab === 'companies' && <CompanyProfiles />}
                {activeTab === 'tracker' && <PlacementTracker />}
            </div>
        </div>
    );
};

export default CompanyHub;
