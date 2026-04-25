import React, { useEffect, useState } from 'react';
import { updateAIConfig } from '../../services/adminService';
import axios from 'axios';
import { 
    Bot, 
    Cpu, 
    Activity, 
    Settings2, 
    Save, 
    RefreshCw,
    TrendingDown,
    Zap,
    AlertCircle
} from 'lucide-react';
import { Button, Input, Select } from '../../components/ui';

const AIControl: React.FC = () => {
    const [config, setConfig] = useState<any>({
        primaryProvider: 'gemini',
        maxTokens: 2048,
        temperature: 0.7,
        rateLimit: 60
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_BASE_URL || '';
            const response = await axios.get(`${API_URL}/api/admin/ai/config`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setConfig({ ...config, ...response.data.config });
            }
        } catch (error) {
            console.error('Failed to fetch AI configuration');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handleDeploy = async () => {
        setSaving(true);
        try {
            const data = await updateAIConfig(config);
            if (data.success) {
                alert('Neural mesh updated. AI nodes are re-syncing.');
            }
        } catch (error) {
            alert('Deployment failed. Check connectivity.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex bg-[#050608] items-center justify-center min-h-[400px] text-violet-500 font-bold tracking-widest uppercase animate-pulse">
            Initializing Engine Interface...
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">AI Neural Control</h1>
                    <p className="text-xs text-slate-500 font-medium">Fine-tune model parameters and manage multi-provider fallback orchestration.</p>
                </div>
                <button 
                    onClick={fetchConfig}
                    className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-[#0A0C10] border border-white/5 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className="p-2 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/10">
                                <Settings2 size={18} />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white italic">Model Orchestration</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Primary Reasoning Engine</label>
                                <Select 
                                    value={config.primaryProvider}
                                    onChange={(e) => setConfig({...config, primaryProvider: e.target.value})}
                                    className="!bg-black/20"
                                >
                                    <option value="gemini">Google Gemini 1.5 Pro</option>
                                    <option value="llama3">NVIDIA Llama 3.1 405B</option>
                                    <option value="groq">Groq / Llama 3.3 70B</option>
                                </Select>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Context Sensitivity (Temperature)</label>
                                    <span className="text-xs font-mono text-violet-400">{config.temperature}</span>
                                </div>
                                <input 
                                    type="range" 
                                    className="w-full accent-violet-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                    min="0" 
                                    max="1" 
                                    step="0.05" 
                                    value={config.temperature}
                                    onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
                                />
                                <div className="flex justify-between mt-1 px-1">
                                    <span className="text-[8px] font-bold text-slate-600 uppercase">Precise</span>
                                    <span className="text-[8px] font-bold text-slate-600 uppercase">Creative</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Max Tokens</label>
                                    <Input 
                                        type="number" 
                                        value={config.maxTokens}
                                        onChange={(e) => setConfig({...config, maxTokens: parseInt(e.target.value)})}
                                        className="!bg-black/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rate Limit (req/min)</label>
                                    <Input 
                                        type="number" 
                                        value={config.rateLimit}
                                        onChange={(e) => setConfig({...config, rateLimit: parseInt(e.target.value)})}
                                        className="!bg-black/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0A0C10] border border-white/5 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/10">
                                <TrendingDown size={18} />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white italic">Provider Health Matrix</h3>
                        </div>

                        <div className="space-y-4">
                            {[
                                { name: 'Gemini Cluster (Google)', latency: '450ms', success: '99.8%', status: 'Nominal' },
                                { name: 'Edge Node (Groq)', latency: '120ms', success: '98.5%', status: 'Nominal' },
                                { name: 'Simulation Node (NVIDIA)', latency: '890ms', success: '100%', status: 'Stable' },
                            ].map((p) => (
                                <div key={p.name} className="flex items-center justify-between p-3 border border-white/[0.03] rounded-xl hover:bg-white/[0.01] transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-tighter">{p.name}</span>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">RRT</p>
                                            <p className="text-[11px] font-mono text-emerald-500 font-bold">{p.latency}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Liveness</p>
                                            <p className="text-[11px] font-mono text-white font-bold">{p.success}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 border border-violet-500/20 p-6 rounded-2xl relative overflow-hidden group shadow-2xl">
                        <Bot className="absolute -right-4 -bottom-4 text-violet-500 opacity-10 group-hover:scale-125 transition-transform duration-500" size={120} />
                        <h4 className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-6 border-b border-violet-500/20 pb-2">Neural Metrics</h4>
                        <div className="space-y-6 relative z-10">
                            <div>
                                <p className="text-[9px] font-bold text-violet-300/60 uppercase tracking-widest mb-1">Tokens Today</p>
                                <p className="text-3xl font-black text-white italic tracking-tighter">4.2M</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-violet-300/60 uppercase tracking-widest mb-1">Avg Latency</p>
                                <p className="text-3xl font-black text-white italic tracking-tighter">0.9s</p>
                            </div>
                            <div className="pt-2 flex items-center gap-2">
                                <Zap size={14} className="text-amber-400 animate-pulse" />
                                <span className="text-[9px] font-bold text-amber-200/80 uppercase tracking-widest">Mesh Stability: 100%</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="text-amber-500 mt-0.5" size={16} />
                        <p className="text-[10px] text-slate-400 leading-relaxed font-medium italic">
                            System Note: Switching to "Llama 3.1" will increase computational overhead for Mumbai University curriculum tasks.
                        </p>
                    </div>

                    <Button 
                        onClick={handleDeploy}
                        isLoading={saving}
                        variant="primary"
                        className="w-full !h-12 gap-2 shadow-lg shadow-violet-500/20"
                    >
                        <Save size={16} />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Deploy Changes</span>
                    </Button>
                    
                    <button 
                        onClick={fetchConfig}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-slate-500 hover:text-white flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={14} />
                        Test Providers
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIControl;
