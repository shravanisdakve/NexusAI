import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { 
    Bell, CheckCheck, Settings, BookOpen, 
    MessageSquare, Award, Clock, ChevronRight, X, Flame
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const notifications = [
        { 
            id: 1, 
            type: 'academic', 
            title: 'Mock Paper Ready', 
            desc: 'System generated a new paper for DS-IV.', 
            time: '2h ago',
            icon: BookOpen,
            color: 'text-sky-400',
            link: '/mock-paper'
        },
        { 
            id: 2, 
            type: 'social', 
            title: 'Study Room Invite', 
            desc: 'Rohit invited you to "SEM-VI Prep".', 
            time: '5h ago',
            icon: MessageSquare,
            color: 'text-emerald-400',
            link: '/study-lobby'
        },
        { 
            id: 3, 
            type: 'platform', 
            title: 'Achievement Unlocked', 
            desc: 'You reached a 10-day study streak!',
            icon: Flame,
            color: 'text-amber-400',
            link: '/profile'
        },
        { 
            id: 4, 
            type: 'deadline', 
            title: 'Placement Deadline', 
            desc: 'TCS NQT registration closes in 24h.', 
            time: '2 days ago',
            icon: Clock,
            color: 'text-rose-400',
            link: '/placement'
        },
    ];

    const content = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Full Screen Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-[999]"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-[400px] bg-[#0A0C10] border-l border-white/5 shadow-2xl z-[110] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-white/5 bg-gradient-to-br from-violet-500/5 to-transparent relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 blur-[60px] rounded-full -mr-16 -mt-16" />
                            
                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30">
                                        <Bell size={20} className="text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">{t('header.notifications.title') || 'Notifications'}</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Activity Stream</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors hover:bg-white/5 rounded-xl">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-2 relative z-10">
                                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                                    <CheckCheck size={14} /> Mark all read
                                </button>
                                <button className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all">
                                    <Settings size={14} />
                                </button>
                            </div>
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto scroll-region p-4">
                            {notifications.length > 0 ? (
                                <div className="space-y-2">
                                    {notifications.map((n) => (
                                        <div 
                                            key={n.id}
                                            onClick={() => {
                                                if (n.link) {
                                                    navigate(n.link);
                                                    onClose();
                                                }
                                            }}
                                            className="group flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-violet-500/20 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]"
                                        >
                                            <div className={`p-3 rounded-xl bg-slate-900 border border-white/5 group-hover:border-violet-500/30 transition-colors ${n.color}`}>
                                                <n.icon size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <p className="text-xs font-black text-slate-200 uppercase tracking-widest">{n.title}</p>
                                                    <span className="text-[9px] font-bold text-slate-600 uppercase tabular-nums">{n.time}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic line-clamp-2">{n.desc}</p>
                                            </div>
                                            {/* Unread indicator */}
                                            {n.id === 1 && (
                                                <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center px-12 opacity-40">
                                    <Bell size={48} className="text-slate-600 mb-6" strokeWidth={1} />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Inbox Zero</p>
                                    <p className="text-[10px] text-slate-500 font-medium mt-2 leading-relaxed">System is quiet. We'll alert you when something important happens.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-white/5 bg-slate-950/50 backdrop-blur-sm">
                            <button 
                                onClick={() => {
                                    navigate('/profile');
                                    onClose();
                                }}
                                className="w-full flex items-center justify-between p-4 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600 hover:text-white transition-all group"
                            >
                                <span className="text-[11px] font-black uppercase tracking-[0.2em]">View Extended History</span>
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <p className="text-center text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em] mt-6 opacity-50">Nexus Intelligence Stream</p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(content, document.body);
};

export default NotificationPanel;
