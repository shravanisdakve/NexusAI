import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Modal, Input, Button } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
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

const studyNavigation = [
    { key: 'sidebar.nav.studyHub', href: '/', icon: LayoutDashboard },
    { key: 'sidebar.nav.curriculum', href: '/curriculum', icon: GraduationCap },
    { key: 'sidebar.nav.university', href: '/university-status', icon: Bell },
    { key: 'sidebar.nav.notes', href: '/notes', icon: FileText },
    { key: 'sidebar.nav.tutor', href: '/tutor', icon: MessageSquare },
    { key: 'sidebar.nav.studyRoom', href: '/study-lobby', icon: Users },
];

const placementNavigation = [
    { key: 'sidebar.nav.placement', href: '/placement', icon: Briefcase },
    { key: 'Practice Hub', href: '/practice-hub', icon: Calculator, directTranslation: true },
    { key: 'Resume Builder', href: '/resume-builder', icon: FileText, directTranslation: true },
    { key: 'Companies & Tracking', href: '/company-hub', icon: Building2, directTranslation: true },
];

const Sidebar: React.FC = () => {
    const { user, logout, updateUserProfile } = useAuth();
    const { language, setLanguage, t } = useLanguage();
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
            <aside className="w-[280px] flex-shrink-0 bg-[#0F1117] border-r border-white/5 p-6 flex flex-col">
                <div className="flex items-center mb-10">
                    <div className="p-2 bg-violet-600 rounded-lg">
                        <BrainCircuit className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold ml-3 bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">
                        {t('sidebar.brand')}
                    </h1>
                </div>

                <nav className="flex-1 space-y-2">
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
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5">
                    <div className="px-3 py-3 rounded-xl bg-surface/50 border border-white/5">
                        {user && (
                            <div className="flex items-center space-x-3 mb-6">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`}
                                    alt="User avatar"
                                    className="w-10 h-10 rounded-full border border-violet-500/20"
                                />
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-bold text-sm text-white truncate">{user.displayName || 'User'}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                            {t('sidebar.profile.activeBranch', { branch: user.branch || 'CO' })}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 text-slate-400 hover:text-white"
                                    onClick={() => setIsProfileModalOpen(true)}
                                    title={t('sidebar.profile.editProfile')}
                                >
                                    <Edit3 size={16} />
                                </Button>
                            </div>
                        )}

                        <div className="flex items-center justify-between p-2 mb-4 bg-slate-900/50 rounded-lg border border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">{t('sidebar.profile.language')}</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${language === 'en' ? 'bg-violet-600 text-white' : 'hover:bg-white/5 text-slate-500'}`}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => setLanguage('mr')}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${language === 'mr' ? 'bg-violet-600 text-white' : 'hover:bg-white/5 text-slate-500'}`}
                                >
                                    MR
                                </button>
                                <button
                                    onClick={() => setLanguage('hi')}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${language === 'hi' ? 'bg-violet-600 text-white' : 'hover:bg-white/5 text-slate-500'}`}
                                >
                                    HI
                                </button>
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
