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

        { 
            label: 'View Profile', 
            icon: User, 
            href: '/profile', 
            color: 'text-sky-400'
        },
        { 
            label: 'Edit Profile', 
            icon: UserPen, 
            href: '/profile/edit', 
            color: 'text-emerald-400'
        }
    ];

    const settingItems = [
        { 
            label: 'Settings', 
            icon: Settings, 
            href: '/profile/settings', 
            color: 'text-violet-400'
        }
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
                        className="absolute right-0 top-full mt-2 w-[280px] bg-[#0F1117] border border-white/10 rounded-2xl shadow-2xl z-[110] overflow-hidden p-3 origin-top-right mobile:fixed mobile:bottom-0 mobile:left-0 mobile:right-0 mobile:top-auto mobile:w-full mobile:rounded-t-[2.5rem] mobile:rounded-b-none"
                    >
                        {/* Header / Identity */}
                        <div className="flex items-center gap-3 p-2 mb-2">
                            <img
                                src={`https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random&size=40`}
                                alt="User"
                                className="w-10 h-10 rounded-full border border-white/10"
                            />
                            <div className="flex flex-col">
                                <span className="text-[13px] font-black text-white tracking-tight leading-none mb-1 line-clamp-1">{user.displayName || 'Scholar'}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user.branchAbbr || 'EN TCR'}</span>
                            </div>
                        </div>

                        {/* Navigation Actions */}
                        <div className="space-y-1 pb-2 border-b border-white/5 mb-2">
                            <p className="text-[10px] font-bold text-slate-500 tracking-wider px-2 py-1 uppercase">User Info</p>
                            {menuItems.map((item, idx) => (
                                <Link 
                                    key={idx}
                                    to={item.href}
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-all group/item"
                                >
                                    <item.icon size={16} className={`${item.color}`} />
                                    <span className="text-[13px] font-medium text-slate-300 group-hover/item:text-white">{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-500 tracking-wider px-2 py-1 uppercase">System</p>
                            {settingItems.map((item, idx) => (
                                <Link 
                                    key={idx}
                                    to={item.href}
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-all group/item"
                                >
                                    <item.icon size={16} className={`${item.color}`} />
                                    <span className="text-[13px] font-medium text-slate-300 group-hover/item:text-white">{item.label}</span>
                                </Link>
                            ))}
                            <button 
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-500/10 transition-all group/item text-left"
                            >
                                <LogOut size={16} className="text-red-400" />
                                <span className="text-[13px] font-medium text-red-400 group-hover/item:text-red-300">Logout</span>
                            </button>
                        </div>
                    </motion.div>


                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ProfileMenu;
