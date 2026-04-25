import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    Bot,
    FileText,
    BookOpen,
    HelpCircle,
    Flag,
    ClipboardList,
    Settings,
    ShieldAlert,
    ChevronLeft,
    ChevronRight,
    Search
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui';

const adminNavItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/rooms', icon: MessageSquare, label: 'Study Rooms' },
    { href: '/admin/ai', icon: Bot, label: 'AI Control' },
    { href: '/admin/content', icon: FileText, label: 'Content' },
    { href: '/admin/curriculum', icon: BookOpen, label: 'Curriculum' },
    { href: '/admin/quizzes', icon: HelpCircle, label: 'Quizzes' },
    { href: '/admin/features', icon: Flag, label: 'Feature Flags' },
    { href: '/admin/reports', icon: ShieldAlert, label: 'Reports' },
    { href: '/admin/logs', icon: ClipboardList, label: 'Logs' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

const AdminSidebar: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 80 : 260 }}
            className="flex flex-col bg-[#050608] border-r border-white/5 h-screen sticky top-0 flex-shrink-0 z-[100]"
        >
            <div className="p-6 flex items-center justify-between">
                {!isCollapsed && (
                    <Link to="/admin" className="flex items-center gap-2">
                        <img src="/nexusai-logo.png" className="w-8 h-8" alt="Logo" />
                        <span className="font-bold text-white tracking-widest text-sm italic">OPERATIONS</span>
                    </Link>
                )}
                {isCollapsed && (
                    <img src="/nexusai-logo.png" className="w-8 h-8 mx-auto" alt="Logo" />
                )}
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
                {adminNavItems.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        end={item.href === '/admin'}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                            ${isActive 
                                ? 'bg-brand-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' 
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                            ${isCollapsed ? 'justify-center' : ''}
                        `}
                    >
                        <item.icon size={20} className="flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm font-semibold">{item.label}</span>}
                        {isCollapsed && (
                            <div className="fixed left-20 bg-slate-900 border border-white/10 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                {item.label}
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-white/5">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center py-2 text-slate-500 hover:text-white transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <div className="flex items-center gap-2"><ChevronLeft size={18} /> <span className="text-xs font-bold uppercase tracking-widest">Collapse</span></div>}
                </button>
            </div>
        </motion.aside>
    );
};

export default AdminSidebar;
