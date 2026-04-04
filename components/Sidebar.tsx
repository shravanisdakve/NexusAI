import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Input, Button, Tooltip, TooltipTrigger, TooltipContent } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { useMode } from '../contexts/ModeContext';
import {
    LayoutDashboard,
    MessageSquare,
    FileText,
    LogOut,
    Users,
    Edit3,
    GraduationCap,
    Briefcase,
    Bell,
    BrainCircuit,
    Calculator,
    MessageCircle,
    UserCheck,
    Building2,
    ClipboardList,
    Play,
    Zap,
} from 'lucide-react';

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    onSave: (newName: string) => Promise<void>;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose, currentName, onSave }) => {
    const { t } = useLanguage();
    const [newName, setNewName] = useState(currentName);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setNewName(currentName);
            setError(null);
        }
    }, [isOpen, currentName]);

    const handleSave = async () => {
        if (!newName.trim() || newName === currentName) {
            onClose();
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            await onSave(newName.trim());
            onClose();
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : t('sidebar.profile.saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('sidebar.profile.editTitle')}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="displayNameSidebar" className="block text-sm font-medium text-slate-300 mb-1">
                        {t('sidebar.profile.displayName')}
                    </label>
                    <Input
                        id="displayNameSidebar"
                        name="displayName"
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        placeholder={t('sidebar.profile.displayNamePlaceholder')}
                        disabled={isSaving}
                    />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>{t('sidebar.profile.cancel')}</Button>
                    <Button
                        onClick={handleSave}
                        isLoading={isSaving}
                        disabled={!newName.trim() || newName === currentName || isSaving}
                    >
                        {t('sidebar.profile.saveChanges')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export const studyNavigation = [
    { key: 'sidebar.nav.studyHub', href: '/', icon: LayoutDashboard },
    { key: 'sidebar.nav.curriculum', href: '/curriculum', icon: GraduationCap },
    { key: 'sidebar.nav.university', href: '/university-status', icon: Bell },
    { key: 'sidebar.nav.notes', href: '/notes', icon: FileText },
    { key: 'sidebar.nav.tutor', href: '/tutor', icon: MessageSquare },
    { key: 'AI Insights', href: '/insights', icon: Zap, directTranslation: true },
    { key: 'sidebar.nav.studyRoom', href: '/study-lobby', icon: Users },
];

export const placementNavigation = [
    { key: 'sidebar.nav.placement', href: '/placement', icon: Briefcase },
    { key: 'Practice Hub', href: '/practice-hub', icon: Calculator, directTranslation: true },
    { key: 'Resume Builder', href: '/resume-builder', icon: FileText, directTranslation: true },
    { key: 'Companies & Tracking', href: '/company-hub', icon: Building2, directTranslation: true },
    { key: 'Learning Resources', href: '/learning-resources', icon: Play, directTranslation: true },
];

const Sidebar: React.FC = () => {
    const { user, logout, updateUserProfile } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const { showToast } = useToast();
    const { mode } = useMode();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const handleProfileSave = async (newName: string) => {
        if (!updateUserProfile) {
            throw new Error('Profile update function not loaded.');
        }
        await updateUserProfile({ displayName: newName });
    };

    return (
        <>
            <aside className="hidden xl:flex w-[280px] flex-shrink-0 bg-[#0F1117] border-r border-white/5 p-6 flex-col overflow-y-auto custom-scrollbar">
                <div className="flex items-center mb-10">
                    <div className="p-2 bg-violet-600 rounded-lg">
                        <BrainCircuit className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold ml-3 bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">
                        {t('sidebar.brand')}
                    </h1>
                </div>

                <nav className="space-y-2">
                    {(mode === 'study' ? studyNavigation : placementNavigation).map((item) => (
                        <NavLink
                            key={item.key}
                            to={item.href}
                            end={item.href === '/'}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 border-l-[3px] ${isActive
                                    ? 'bg-violet-500/15 border-violet-500 text-white'
                                    : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            <item.icon className="mr-3 h-5 w-5" aria-hidden="true" />
                            {(item as any).directTranslation ? item.key : t(item.key)}
                        </NavLink>
                    ))}

                    {/* Neural Pulse Indicator */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="mx-2 mt-8 p-4 bg-slate-900/80 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-violet-500/30 transition-all cursor-help">
                                <div className="absolute top-0 right-0 p-8 bg-violet-500/5 blur-[30px] rounded-full"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Pulse</span>
                                        <div className="flex gap-0.5">
                                            <div className="w-1 h-3 bg-emerald-500/40 rounded-full"></div>
                                            <div className="w-1 h-2 bg-emerald-500/60 rounded-full mt-1"></div>
                                            <div className="w-1 h-4 bg-emerald-500 rounded-full mt-[-2px] animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                        <span className="text-[11px] font-bold text-slate-300">Groq-L3-70B</span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-[9px] text-slate-500 font-mono">Lat: 142ms</span>
                                        <span className="text-[9px] text-emerald-500/80 font-bold uppercase tracking-tighter">Live Sync</span>
                                    </div>
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="space-y-1">
                                <p className="font-bold text-violet-400">System Status</p>
                                <p className="text-xs text-slate-300">
                                    AI Model: Groq LLaMA 3 70B — Response latency is live.
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <p className="text-[10px] text-slate-400">Green = Healthy (&lt; 200ms)</p>
                                </div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </nav>

                <div className="mt-10 pt-6 border-t border-white/5">
                    <div className="px-3 py-3 rounded-xl bg-surface/50 border border-white/5">
                        {user && (
                            <div className="mb-6">
                                <div className="flex items-center space-x-3 mb-2">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`}
                                        alt="User avatar"
                                        className="w-10 h-10 rounded-full border border-violet-500/20"
                                    />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bold text-sm text-white truncate">{user.displayName || 'User'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 ml-1">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest leading-none">
                                            {t('sidebar.profile.activeBranch', { branch: user.branch || 'CO' })}
                                        </span>
                                    </div>
                                    <div className="w-[1.5px] h-3 bg-white/30 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.1)]"></div>
                                    <button
                                        onClick={() => setIsProfileModalOpen(true)}
                                        className="text-[10px] font-bold text-slate-400 hover:text-white transition-all uppercase tracking-widest flex items-center gap-1.5 group/edit"
                                    >
                                        <Edit3 size={11} className="group-hover/edit:text-violet-400 transition-colors" />
                                        {t('sidebar.profile.editProfile')}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between p-2 mb-4 bg-slate-900/50 rounded-lg border border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t('sidebar.profile.language')}</span>
                            <div className="flex gap-1.5">
                                {[
                                    { key: 'en', label: 'EN', name: 'English' },
                                    { key: 'mr', label: 'MR', name: 'Marathi' },
                                    { key: 'hi', label: 'HI', name: 'Hindi' }
                                ].map((l) => (
                                    <button
                                        key={l.key}
                                        aria-pressed={language === l.key}
                                        onClick={() => {
                                            if (language !== l.key) {
                                                setLanguage(l.key as any);
                                                showToast(`Language set to ${l.name} ✓`, 'success');
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all relative ${language === l.key
                                            ? 'bg-violet-600/20 text-violet-400 shadow-sm shadow-violet-500/10'
                                            : 'hover:bg-white/5 text-slate-500 hover:text-slate-300'
                                            }`}
                                    >
                                        {l.label}
                                        {language === l.key && (
                                            <motion.span 
                                                layoutId="active-lang-pill"
                                                className="absolute inset-0 ring-1 ring-violet-500/50 rounded-lg"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-slate-300 hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/20"
                        >
                            <LogOut className="mr-2 h-5 w-5" />
                            {t('sidebar.profile.logout')}
                        </button>
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-4">&copy; 2026 NexusAI. {t('sidebar.footer.rights')}</p>
                </div>
            </aside>

            {user && (
                <ProfileEditModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    currentName={user.displayName || ''}
                    onSave={handleProfileSave}
                />
            )}
        </>
    );
};

export default Sidebar;
