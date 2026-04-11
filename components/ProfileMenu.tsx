import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
    User, Settings, LogOut, Layout, UserPen, 
    ChevronRight, ExternalLink, ShieldCheck, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
            onClose();
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    if (!user) return null;

    const menuItems = [
        { 
            label: 'View Profile', 
            icon: User, 
            href: '/profile', 
            desc: 'See your academic public identity',
            color: 'text-sky-400'
        },
        { 
            label: 'Edit Profile', 
            icon: UserPen, 
            href: '/profile/edit', 
            desc: 'Update personal & career details',
            color: 'text-emerald-400'
        },
        { 
            label: 'Profile Settings', 
            icon: Settings, 
            href: '/profile/settings', 
            desc: 'App preferences & language',
            color: 'text-violet-400'
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
                    />

                    {/* Menu Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-4 w-[320px] bg-[#0F1117] border border-white/10 rounded-[2rem] shadow-2xl z-[110] overflow-hidden origin-top-right mobile:fixed mobile:bottom-0 mobile:left-0 mobile:right-0 mobile:top-auto mobile:w-full mobile:rounded-t-[2.5rem] mobile:rounded-b-none"
                    >
                        {/* Header / Identity */}
                        <div className="p-6 pb-4 border-b border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative group/avatar">
                                        <div className="absolute inset-0 bg-violet-500 blur-md opacity-20 group-hover/avatar:opacity-40 transition-opacity"></div>
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random&size=48`}
                                            alt="User"
                                            className="w-12 h-12 rounded-2xl border border-white/10 relative z-10"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-white tracking-tight leading-none mb-1">{user.displayName || 'Scholar'}</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user.branchAbbr || 'EN TCR'} Specialist</span>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={handleLogout}
                                    className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all group/logout"
                                    title="Logout"
                                >
                                    <LogOut size={16} className="group-hover/logout:translate-x-0.5 transition-transform" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 rounded-full border border-emerald-500/10 w-fit">
                                <ShieldCheck size={10} className="text-emerald-400" />
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active Academic Session</span>
                            </div>
                        </div>

                        {/* Navigation Actions */}
                        <div className="p-2 space-y-1">
                            {menuItems.map((item, idx) => (
                                <Link 
                                    key={idx}
                                    to={item.href}
                                    onClick={onClose}
                                    className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition-all group/item"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl bg-slate-800/50 border border-white/5 group-hover/item:border-white/10 transition-colors ${item.color}`}>
                                            <item.icon size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-300 uppercase tracking-widest group-hover/item:text-white transition-colors">{item.label}</span>
                                            <span className="text-[9px] text-slate-500 font-medium tracking-wide">{item.desc}</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-600 group-hover/item:text-slate-400 translate-x-0 group-hover/item:translate-x-1 transition-all" />
                                </Link>
                            ))}
                        </div>

                        {/* Footer / Meta */}
                        <div className="p-6 pt-2 border-t border-white/5 bg-slate-900/20">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={12} className="text-violet-400" />
                                    <span className="text-[10px] font-black text-slate-500 tracking-tighter uppercase">Nexus Premium v2.4</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Study Hub</span>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ProfileMenu;
