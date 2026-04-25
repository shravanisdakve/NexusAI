import React, { useEffect, useState } from 'react';
import { getFeatureFlags, updateFeatureFlags } from '../../services/adminService';
import { Flag, Save, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui';

const FeatureManagement: React.FC = () => {
    const [features, setFeatures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchFeatures = async () => {
        setLoading(true);
        try {
            const data = await getFeatureFlags();
            if (data.success) {
                setFeatures(data.features);
            }
        } catch (error) {
            console.error('Failed to fetch features');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeatures();
    }, []);

    const toggleFeature = (key: string) => {
        setFeatures(features.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
    };

    const handleCommit = async () => {
        setSaving(true);
        try {
            // Transform array back to object for backend
            const flags = features.reduce((acc, f) => ({ ...acc, [f.key]: f.enabled }), {});
            const data = await updateFeatureFlags(flags);
            if (data.success) {
                alert('Feature infrastructure updated successfully.');
            }
        } catch (error) {
            alert('Failed to synchronize features.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Feature Rollout Control</h1>
                <p className="text-xs text-slate-500 font-medium">Globally enable or disable platform modules and experimental engines.</p>
            </div>

            <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl flex items-center gap-4">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                    <ShieldCheck size={20} />
                </div>
                <div>
                    <p className="text-xs font-bold text-rose-200 uppercase tracking-widest mb-1">Safety Override</p>
                    <p className="text-[11px] text-rose-300/60 font-medium leading-relaxed">
                        These flags are authoritative. Disabling a core feature will immediately block client access and terminate associated background jobs.
                    </p>
                </div>
            </div>

            <div className="grid gap-4">
                {features.map((feature) => (
                    <div key={feature.key} className="bg-[#0A0C10] border border-white/5 p-6 rounded-2xl flex items-center justify-between group hover:border-violet-500/20 transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${feature.enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'} group-hover:scale-110 transition-transform`}>
                                <Flag size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-tight">{feature.name}</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">KEY: {feature.key}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                                <p className={`text-[10px] font-extrabold uppercase tracking-tighter mb-1 ${feature.enabled ? 'text-emerald-500' : 'text-slate-500'}`}>
                                    {feature.enabled ? 'Live & Active' : 'Offline / Disabled'}
                                </p>
                            </div>

                            <button
                                onClick={() => toggleFeature(feature.key)}
                                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${feature.enabled ? 'bg-violet-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${feature.enabled ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <button 
                    onClick={fetchFeatures}
                    className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    Refresh Configuration
                </button>

                <Button 
                    onClick={handleCommit}
                    isLoading={saving}
                    className="!h-10 px-8 gap-2"
                >
                    <Save size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Commit Changes</span>
                </Button>
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-3">
                <AlertTriangle className="text-amber-500" size={18} />
                <p className="text-[11px] text-slate-400 font-medium">
                    Changes to "AI Tutor" and "Quiz Generator" may require a server-side cache purge to take full effect across all delivery clusters.
                </p>
            </div>
        </div>
    );
};

export default FeatureManagement;
