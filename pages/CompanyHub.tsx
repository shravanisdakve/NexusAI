import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, ClipboardList, Target } from 'lucide-react';

import CompanyProfiles from './CompanyProfiles';
import PlacementTracker from './PlacementTracker';
import PlacementPredictor from './PlacementPredictor';

type Tab = 'companies' | 'tracker' | 'predictor';

const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string; activeColor: string }[] = [
    { id: 'companies', label: 'Company Profiles', icon: <Building2 className="w-4 h-4" />, color: 'text-slate-400 hover:text-amber-400', activeColor: 'text-amber-400 bg-amber-500/15 border-amber-500/40' },
    { id: 'tracker', label: 'My Applications', icon: <ClipboardList className="w-4 h-4" />, color: 'text-slate-400 hover:text-rose-400', activeColor: 'text-rose-400 bg-rose-500/15 border-rose-500/40' },
    { id: 'predictor', label: 'Placement Predictor', icon: <Target className="w-4 h-4" />, color: 'text-slate-400 hover:text-emerald-400', activeColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40' },
];

const CompanyHub: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as Tab) || 'companies';
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    const [prefillData, setPrefillData] = useState<any>(null);

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
        setPrefillData(null);
    };

    const handleSwitchToTab = (tab: Tab, data?: any) => {
        setActiveTab(tab);
        setSearchParams({ tab });
        setPrefillData(data);
    };

    return (
        <div className="space-y-4">
            {/* Tab Switcher */}
            <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 overflow-x-auto no-scrollbar flex-nowrap touch-pan-x company-hub-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`company-hub-tab flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] md:text-sm font-black uppercase tracking-wider transition-all border whitespace-nowrap shrink-0 ${activeTab === tab.id
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
                {activeTab === 'companies' && (
                    <CompanyProfiles onSwitchToTab={handleSwitchToTab} />
                )}
                {activeTab === 'tracker' && (
                    <PlacementTracker 
                        prefillData={prefillData} 
                        onPrefillConsumed={() => setPrefillData(null)} 
                    />
                )}
                {activeTab === 'predictor' && (
                    <PlacementPredictor 
                        prefillData={prefillData} 
                        onPrefillConsumed={() => setPrefillData(null)} 
                    />
                )}
            </div>
        </div>
    );
};

export default CompanyHub;
