import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';

import {
    LayoutDashboard, Briefcase, MoreHorizontal,
    X, FileText, Bot, Users, GraduationCap, Calculator,
    Building2, Play, Shield, Sparkles, Timer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileBottomNav: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [moreOpen, setMoreOpen] = useState(false);

    const navItems = [
        { 
            icon: <LayoutDashboard size={20} />, 
            label: 'Hub', 
            to: '/',
            isActive: (path: string) => path === '/' || path === '/dashboard'
        },
        { 
            icon: <GraduationCap size={20} />, 
            label: 'Tutor', 
            to: '/tutor',
            isActive: (path: string) => path === '/tutor'
        },
        { 
            icon: <Timer size={20} />, 
            label: 'Timer', 
            to: '/timer',
            isActive: (path: string) => path === '/timer'
        },
        { 
            icon: <Briefcase size={20} />, 
            label: 'Placement', 
            to: '/placement',
            isActive: (path: string) => ['/placement', '/practice-hub', '/company-hub', '/resume-builder'].some(p => path.startsWith(p))
        }
    ];

    // Items shown in the "More" drawer
    const moreItems = [
        { label: 'Study',         group: 'STUDY'     , items: [
            { name: 'AI Tutor',       href: '/tutor',           icon: Bot           },
            { name: 'Study Room',     href: '/study-lobby',     icon: Users         },
            { name: 'MU Curriculum',  href: '/curriculum',      icon: GraduationCap },
            { name: 'Notes',          href: '/notes',           icon: FileText      },
        ]},
        { label: 'PLACEMENT',     group: 'PLACEMENT' , items: [
            { name: 'Practice Hub',   href: '/practice-hub',    icon: Calculator    },
            { name: 'Resume Builder', href: '/resume-builder',  icon: FileText      },
            { name: 'Companies',      href: '/company-hub',     icon: Building2     },
            { name: 'Resources',      href: '/learning-resources', icon: Play       },
        ]},
        { label: 'TOOLS',         group: 'TOOLS'     , items: [
            { name: 'GPA Calc',       href: '/gpa-calculator',  icon: Calculator    },
            { name: 'ATKT Nav',       href: '/kt-calculator',   icon: Shield        },
            { name: 'Paper Bank',     href: '/paper-bank',      icon: FileText      },
            { name: 'Project Gen',    href: '/project-generator', icon: Sparkles    },
        ]},
    ];

    return (
        <>
            {/* More Drawer */}
            <AnimatePresence>
                {moreOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm md:hidden"
                            onClick={() => setMoreOpen(false)}
                        />

                        {/* Drawer panel */}
                        <motion.div
                            key="drawer"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 380, damping: 35 }}
                            className="fixed bottom-16 left-0 right-0 z-[56] bg-slate-900 border-t border-white/10 rounded-t-3xl shadow-2xl md:hidden max-h-[70vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
                                <span className="text-sm font-black text-white uppercase tracking-widest">More</span>
                                <button
                                    onClick={() => setMoreOpen(false)}
                                    className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-4 space-y-6">
                                {moreItems.map((section) => (
                                    <div key={section.group}>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 ml-1">
                                            {section.label}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {section.items.map((item) => (
                                                <NavLink
                                                    key={item.href}
                                                    to={item.href}
                                                    onClick={() => setMoreOpen(false)}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                                                            isActive
                                                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                                        }`
                                                    }
                                                >
                                                    <item.icon size={16} />
                                                    <span className="truncate">{item.name}</span>
                                                </NavLink>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom Nav Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-[60] flex items-center justify-around bg-slate-900/95 backdrop-blur-md border-t border-white/10 h-16 pb-safe px-2 md:hidden">
                {navItems.map((item) => {
                    const active = item.isActive(location.pathname);
                    return (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${
                                active ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            <div className={`p-1 rounded-lg transition-colors ${active ? 'bg-violet-500/10' : ''}`}>
                                {item.icon}
                            </div>
                            <span className={`text-[10px] font-bold tracking-wider uppercase transition-all ${active ? 'opacity-100 scale-100' : 'opacity-60 scale-95'}`}>
                                {item.label}
                            </span>
                            {active && (
                                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                            )}
                        </NavLink>
                    );
                })}

                {/* More button */}
                <button
                    onClick={() => setMoreOpen(prev => !prev)}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${
                        moreOpen ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                    <div className={`p-1 rounded-lg transition-colors ${moreOpen ? 'bg-violet-500/10' : ''}`}>
                        <MoreHorizontal size={20} />
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider uppercase transition-all ${moreOpen ? 'opacity-100 scale-100' : 'opacity-60 scale-95'}`}>
                        More
                    </span>
                </button>
            </nav>
        </>
    );
};

export default MobileBottomNav;
