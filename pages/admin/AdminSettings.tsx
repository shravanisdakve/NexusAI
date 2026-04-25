import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../../services/adminService';
import { Lock, Globe, Bell, Server, Save, ShieldAlert, Zap, Cpu } from 'lucide-react';
import { Button, Input, Select, Toast } from '../../components/ui';

const AdminSettings: React.FC = () => {
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        announcement: '',
        activeAIProvider: 'gemini',
        maxTokens: 2048,
        registrationEnabled: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

    const fetchSettings = async () => {
        try {
            const data = await getSettings();
            if (data.success) {
                setSettings({ ...settings, ...data.settings });
            }
        } catch (error) {
            console.error('Failed to fetch settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = await updateSettings(settings);
            if (data.success) {
                setToast({ message: 'Global configuration synchronized successfully.', type: 'success' });
            }
        } catch (error) {
            setToast({ message: 'Failed to update system protocols.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl relative">
            {toast && (
                <div className="fixed bottom-8 right-8 z-[100]">
                    <Toast 
                        message={toast.message} 
                        type={toast.type} 
                        onClose={() => setToast(null)} 
                    />
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Terminal Settings</h1>
                    <p className="text-xs text-slate-500 font-medium">Configure global platform behavior, security protocols, and integration keys.</p>
                </div>
                <Button 
                    onClick={handleSave} 
                    isLoading={saving}
                    className="!h-10 px-6 gap-2"
                >
                    <Save size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Commit All</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Security Section */}
                <div className="bg-[#0A0C10] border border-white/5 p-6 rounded-2xl space-y-6">
                    <div className="flex items-center gap-3 mb-2 border-b border-white/5 pb-4">
                        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                            <Lock size={18} />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Security & Access</h3>
                    </div>
                    
                    <div className="flex items-center justify-between group">
                        <div>
                            <p className="text-xs font-bold text-slate-300">Maintenance Mode</p>
                            <p className="text-[10px] text-slate-500 font-medium italic">Block client-side entry</p>
                        </div>
                        <button
                            onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                            className={`w-10 h-5 rounded-full transition-all duration-300 relative ${settings.maintenanceMode ? 'bg-rose-600' : 'bg-slate-800'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-6' : 'left-1 opacity-50'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between group">
                        <div>
                            <p className="text-xs font-bold text-slate-300">New Registrations</p>
                            <p className="text-[10px] text-slate-500 font-medium italic">Allow new user signups</p>
                        </div>
                        <button
                            onClick={() => setSettings({ ...settings, registrationEnabled: !settings.registrationEnabled })}
                            className={`w-10 h-5 rounded-full transition-all duration-300 relative ${settings.registrationEnabled ? 'bg-emerald-600' : 'bg-slate-800'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.registrationEnabled ? 'left-6' : 'left-1 opacity-50'}`} />
                        </button>
                    </div>
                </div>

                {/* AI Configuration Section */}
                <div className="bg-[#0A0C10] border border-white/5 p-6 rounded-2xl space-y-6">
                    <div className="flex items-center gap-3 mb-2 border-b border-white/5 pb-4">
                        <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
                            <Cpu size={18} />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Neural Config</h3>
                    </div>

                    <div className="space-y-3">
                        <label htmlFor="ai-provider" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Inference Engine</label>
                        <Select 
                            id="ai-provider"
                            name="activeAIProvider"
                            value={settings.activeAIProvider}
                            onChange={(e) => setSettings({ ...settings, activeAIProvider: e.target.value })}
                            className="!py-2 !text-xs !bg-black/20"
                        >
                            <option value="gemini">Google Gemini Pro</option>
                            <option value="gpt4">OpenAI GPT-4o (Coming Soon)</option>
                            <option value="groq">Groq / Llama 3</option>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <label htmlFor="max-tokens-range" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Max Response Tokens ({settings.maxTokens})</label>
                        <input 
                            id="max-tokens-range"
                            name="maxTokens"
                            type="range"
                            min="512"
                            max="4096"
                            step="128"
                            value={settings.maxTokens}
                            onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                            className="w-full accent-violet-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                {/* Broadcast Section */}
                <div className="bg-[#0A0C10] border border-white/5 p-6 rounded-2xl md:col-span-2 space-y-6">
                    <div className="flex items-center gap-3 mb-2 border-b border-white/5 pb-4">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <Bell size={18} />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Global Broadcast System</h3>
                    </div>

                    <div className="space-y-3">
                        <label htmlFor="global-announcement" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Platform Announcement Message</label>
                        <textarea 
                            id="global-announcement"
                            name="announcement"
                            value={settings.announcement}
                            onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                            placeholder="Type a message to be displayed to all active users..."
                            className="w-full bg-black/20 border-2 border-white/5 rounded-xl p-4 text-xs font-medium text-white focus:outline-none focus:border-violet-500/30 min-h-[100px] transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-violet-600/5 border border-violet-500/10 rounded-2xl flex items-center gap-4">
                <ShieldAlert className="text-violet-400" size={24} />
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    Note: Changes to system protocols are applied in real-time across the neural mesh. Some changes (like Maintenance Mode) may force client-side re-authentication for security reasons.
                </p>
            </div>
        </div>
    );
};

export default AdminSettings;
