import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Globe, Bell, Moon, Shield, Lock, ChevronRight, X } from 'lucide-react';
import { Button } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import { motion } from 'framer-motion';

const ProfileSettingsPage: React.FC = () => {
    const { user } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const languages = [
        { key: 'en', label: 'English', native: 'English' },
        { key: 'hi', label: 'Hindi', native: 'हिन्दी' },
        { key: 'mr', label: 'Marathi', native: 'मराठी' },
    ];

    const handleLanguageChange = (langKey: string) => {
        if (language !== langKey) {
            setLanguage(langKey as any);
            showToast(`Language updated to ${languages.find(l => l.key === langKey)?.label} ✨`, 'success');
        }
    };

    if (!user) return null;

    return (
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#050608] custom-scrollbar h-full">
            <div className="max-w-3xl mx-auto space-y-8 pb-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">App Settings</h1>
                        <p className="text-slate-500 font-medium mt-1">Manage your preferences and interface experience.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Language Selection Section */}
                    <div className="p-8 rounded-[2rem] bg-slate-900/40 border border-white/5 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                <Globe size={20} className="text-violet-400" />
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Interface Language</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {languages.map((l) => (
                                <button
                                    key={l.key}
                                    onClick={() => handleLanguageChange(l.key)}
                                    className={`relative p-4 rounded-2xl border text-left transition-all ${
                                        language === l.key
                                            ? 'bg-violet-600/10 border-violet-500/50 ring-1 ring-violet-500/20'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className={`text-xs font-black uppercase tracking-widest ${language === l.key ? 'text-violet-400' : 'text-slate-500'}`}>
                                            {l.label}
                                        </span>
                                        <span className={`text-sm font-bold ${language === l.key ? 'text-white' : 'text-slate-400'}`}>
                                            {l.native}
                                        </span>
                                    </div>
                                    {language === l.key && (
                                        <motion.div
                                            layoutId="lang-active-indicator"
                                            className="absolute top-3 right-3 w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_10px_var(--brand-primary-glow)]"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Placeholder Sections */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-6 px-1">Other Preferences</p>
                        
                        <div className="p-4 rounded-[2rem] bg-slate-900/40 border border-white/5 space-y-2">
                            {[
                                { icon: Bell, label: 'Notifications', color: 'text-rose-400', desc: 'Alerts, reminders and sound' },
                                { icon: Moon, label: 'Appearance', color: 'text-amber-400', desc: 'Theme, layout and visuals' },
                                { icon: Shield, label: 'Privacy', color: 'text-emerald-400', desc: 'Visibility and data sharing' },
                                { icon: Lock, label: 'Security', color: 'text-sky-400', desc: 'OAuth, passwords and devices' },
                            ].map((item, idx) => (
                                <button
                                    key={idx}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all group opacity-60 cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl bg-slate-800 ${item.color}`}>
                                            <item.icon size={18} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-slate-300">{item.label}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettingsPage;
