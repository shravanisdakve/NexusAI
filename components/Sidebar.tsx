import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Input, Button, Tooltip, TooltipTrigger, TooltipContent } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { useSidebar } from '../contexts/SidebarContext';
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
    Zap,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Sparkles,
    Calculator,
    Building2,
    Play,
    BookOpen,
    Bot,
    Target,
} from 'lucide-react';

// Unified nav groups — always shown together, no mode switching
export const navGroups = [
    {
        label: 'STUDY',
        items: [
            { key: 'sidebar.nav.studyHub',   href: '/',                icon: LayoutDashboard, label: 'Dashboard'      },
            { key: 'sidebar.nav.curriculum', href: '/curriculum',      icon: GraduationCap,   label: 'MU Curriculum'  },
            { key: 'sidebar.nav.university', href: '/university-status', icon: Bell,          label: 'University Hub' },
            { key: 'sidebar.nav.notes',      href: '/notes',           icon: FileText,        label: 'Notes'          },
            { key: 'sidebar.nav.tutor',      href: '/tutor',           icon: Bot,             label: 'AI Tutor'       },
            { key: 'sidebar.nav.studyRoom',  href: '/study-lobby',     icon: Users,           label: 'Study Room'     },
        ],
    },
    {
        label: 'PLACEMENT',
        items: [
            { key: 'sidebar.nav.placement',  href: '/placement',         icon: Briefcase,   label: 'Arena'          },
            { key: 'Prep Tools',             href: '/prep-tools',        icon: Target,      label: 'Prep Tools',     directTranslation: true },
            { key: 'Practice Hub',           href: '/practice-hub',      icon: Calculator,  label: 'Practice Hub',   directTranslation: true },
            { key: 'Resume Builder',         href: '/resume-builder',    icon: FileText,    label: 'Resume Builder', directTranslation: true },
            { key: 'Companies & Tracking',   href: '/company-hub',       icon: Building2,   label: 'Companies',      directTranslation: true },
            { key: 'Learning Resources',     href: '/learning-resources', icon: Play,       label: 'Resources',      directTranslation: true },
        ],
    },
];

// Legacy exports kept for backward-compat with Header.tsx searchItems logic
export const studyNavigation = navGroups[0].items;
export const placementNavigation = navGroups[1].items;

const Sidebar: React.FC = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const location = useLocation();

    const [expandedGroups, setExpandedGroups] = useState<string[]>(navGroups.map(g => g.label));

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev => prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]);
    };

    const isAcademicView = location.pathname === '/curriculum' || location.pathname === '/notes';

    return (
        <>
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 240 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="hidden lg:flex flex-shrink-0 bg-[#0F1117] border-r border-white/5 flex-col overflow-y-auto custom-scrollbar relative"
            >
                {/* Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    className={`absolute -right-3 top-20 z-50 p-1.5 border rounded-full text-white transition-all active:scale-95 ${
                        isAcademicView
                        ? 'bg-slate-700 border-slate-600/50 opacity-50 hover:opacity-100'
                        : 'bg-brand-primary border-brand-border-focus/30 shadow-[0_0_15px_var(--brand-primary-glow)] hover:opacity-90 hover:scale-110'
                    }`}
                    title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Logo */}
                <Link
                    to="/"
                    className={`flex items-center mb-6 p-5 group transition-all ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                    <div className="relative flex-shrink-0">
                        <div className={`absolute inset-0 bg-violet-600 blur-[24px] rounded-xl transition-opacity ${isAcademicView ? 'opacity-5' : 'opacity-15 group-hover:opacity-30'}`}></div>
                        <img
                            src="/nexusai-logo.png"
                            alt="NexusAI Logo"
                            className={`relative z-10 object-contain transition-all duration-500 ${isCollapsed ? 'w-9 h-9' : 'w-10 h-10'} ${isAcademicView ? 'opacity-80' : 'group-hover:scale-110'}`}
                        />
                    </div>
                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <div className="flex flex-col ml-3.5 overflow-hidden">
                                <motion.div
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 8 }}
                                    className="flex items-center"
                                >
                                    <span className="text-xl font-bold tracking-tight text-white group-hover:text-violet-400 transition-colors">NEXUS</span>
                                    <span className="text-xl font-bold tracking-tight text-violet-400 group-hover:text-white transition-colors">AI</span>
                                </motion.div>
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-[9px] font-bold uppercase tracking-widest text-slate-500 leading-none mt-1"
                                >
                                    Intelligence Core
                                </motion.span>
                            </div>
                        )}
                    </AnimatePresence>
                </Link>

                {/* Unified Nav */}
                <nav className={`flex-1 flex flex-col gap-1 ${isCollapsed ? 'px-3' : 'px-4'}`}>
                    {navGroups.map((group) => {
                        const isExpanded = expandedGroups.includes(group.label);
                        return (
                            <div key={group.label} className="mb-2">
                                {/* Section label — hidden when collapsed */}
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center justify-between px-3 mt-5 mb-2 cursor-pointer group"
                                            onClick={() => toggleGroup(group.label)}
                                        >
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">
                                                {group.label}
                                            </p>
                                            <ChevronDown size={12} className={`text-slate-600 group-hover:text-white transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {isCollapsed && (
                                    <div className="w-full h-px bg-white/5 my-3" />
                                )}

                                <AnimatePresence initial={false}>
                                    {(isExpanded || isCollapsed) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="space-y-0.5 overflow-hidden"
                                        >
                                            {group.items.map((item) => (
                                                <div key={item.key} className="w-full">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <NavLink
                                                                to={item.href}
                                                                end={item.href === '/'}
                                                                className={({ isActive }) => {
                                                                    const itemActive = isActive;
                                                                    return `flex items-center px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl w-full border border-transparent ${isCollapsed ? 'justify-center px-0' : ''} ${
                                                                        itemActive
                                                                            ? isAcademicView
                                                                                ? 'bg-slate-800 border-white/[0.05] text-white shadow-lg'
                                                                                : 'bg-violet-600/10 border-violet-500/10 text-violet-400'
                                                                            : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-200'
                                                                    }`;
                                                                }}
                                                            >
                                                                <item.icon className={`${isCollapsed ? 'mr-0' : 'mr-3'} h-[16px] w-[16px] flex-shrink-0 transition-colors`} aria-hidden="true" />
                                                                {!isCollapsed && (
                                                                    <span className="truncate text-xs font-semibold tracking-tight">
                                                                        {(item as any).directTranslation ? item.label : t(item.key)}
                                                                    </span>
                                                                )}
                                                            </NavLink>
                                                        </TooltipTrigger>
                                                        {isCollapsed && (
                                                            <TooltipContent side="right">
                                                                <p className="text-xs font-bold text-white">{item.label}</p>
                                                            </TooltipContent>
                                                        )}
                                                    </Tooltip>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}

                </nav>
            </motion.aside>
        </>
    );
};

export default Sidebar;