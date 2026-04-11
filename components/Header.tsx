import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    Sparkles, Bell, Search, CornerDownLeft, User, LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { searchItems, SearchItem } from '../data/searchItems';
import ProfileMenu from './ProfileMenu';
import NotificationPanel from './NotificationPanel';

export default function Header() {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    // Handle "/" shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            if (e.key === 'Escape') {
                setShowSearchResults(false);
                setActiveIndex(-1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle Search Logic
    useEffect(() => {
        if (searchQuery.trim().length > 1) {
            const filtered = searchItems
                .filter(item =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice(0, 6);
            setSearchResults(filtered);
            setShowSearchResults(true);
            setActiveIndex(-1);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    }, [searchQuery]);

    // Handle Outside Click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            navigate(searchResults[activeIndex].href);
            setSearchQuery('');
            setShowSearchResults(false);
        }
    };

    return (
        <header className="border-b border-white/5 bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 w-full">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-4">

                    {/* Left: Logo (Mobile only) */}
                    <div className="flex items-center gap-4 lg:hidden">
                        <Link to="/" className="flex items-center gap-2 shrink-0 group">
                            <img
                                src="/nexusai-logo.png"
                                alt="NexusAI Logo"
                                className="w-8 h-8 object-contain group-hover:drop-shadow-[0_0_10px_rgba(139,92,246,0.7)] transition-all duration-300"
                            />
                            <div className="text-xl font-black italic tracking-tighter text-white">
                                NEXUS<span className="text-violet-400">AI</span>
                            </div>
                        </Link>
                    </div>

                    {/* Middle: Search Bar (Desktop dominant, Mobile friendly) */}
                    <div ref={searchContainerRef} className="flex-1 max-w-md mx-auto relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                        </div>
                        <input
                            ref={searchInputRef}
                            id="global-search"
                            name="searchQuery"
                            type="text"
                            autoComplete="off"
                            aria-label="Search tools, resources, or peers"
                            placeholder="Find tools, resources, or peers... ( / )"
                            className="w-full bg-slate-950 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/30 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => searchQuery.trim().length > 1 && setShowSearchResults(true)}
                        />

                        {/* Search Results Dropdown */}
                        {showSearchResults && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-2 border-b border-white/5">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 py-1">Quick results</span>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {searchResults.map((item, index) => (
                                        <button
                                            key={item.key}
                                            onClick={() => {
                                                navigate(item.href);
                                                setSearchQuery('');
                                                setShowSearchResults(false);
                                            }}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors ${index === activeIndex ? 'bg-violet-600/20 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                                        >
                                            <div className={`p-2 rounded-lg ${index === activeIndex ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-slate-800 text-slate-400'}`}>
                                                <item.icon size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black uppercase tracking-wider">{item.name}</p>
                                                <p className="text-[10px] opacity-60 truncate">{item.description}</p>
                                            </div>
                                            {index === activeIndex && <CornerDownLeft size={12} className="text-violet-400 opacity-60" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Utility Icons */}
                    <div className="flex items-center gap-2 md:gap-4 shrink-0 relative">
                        {/* AI Tool Hub (Header Shortcut) */}
                        <Link
                            to="/tool-hub"
                            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all border ${
                                location.pathname === '/tool-hub'
                                ? 'bg-violet-500/20 border-violet-500/40 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                                : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/10'
                            } group/ai-hub`}
                        >
                            <Sparkles size={18} className={`transition-transform duration-500 group-hover/ai-hub:rotate-12 ${location.pathname === '/tool-hub' ? 'text-violet-400' : 'text-slate-400 group-hover/ai-hub:text-violet-400'}`} />
                            <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">
                                Tool Hub
                            </span>
                        </Link>

                        {/* Notifications */}
                        <div className="relative group/bell">
                            <button 
                                id="header-notification-bell"
                                onClick={() => {
                                    setIsNotificationOpen(!isNotificationOpen);
                                    setIsProfileOpen(false);
                                }}
                                className={`relative p-2.5 rounded-xl transition-all ${isNotificationOpen ? 'text-violet-400 bg-violet-500/20 ring-2 ring-violet-500/50' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                            >
                                <Bell size={22} className={isNotificationOpen ? 'animate-none' : 'group-hover/bell:animate-bounce'} />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-violet-500 rounded-full border-2 border-slate-900 z-10"></span>
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-violet-500 rounded-full animate-ping opacity-75"></span>
                            </button>
                            <NotificationPanel isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
                        </div>

                        {/* User Avatar & Logout */}
                        <div className="flex items-center gap-2 relative">
                            <button 
                                onClick={() => {
                                    setIsProfileOpen(!isProfileOpen);
                                    setIsNotificationOpen(false);
                                }}
                                className={`flex items-center gap-3 pl-3 pr-1 py-1 rounded-xl transition-all group border ${isProfileOpen ? 'bg-violet-500/10 border-violet-500/30' : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'}`}
                            >
                                {user?.displayName && (
                                    <span className={`hidden md:block text-[11px] font-black uppercase tracking-widest transition-colors ${isProfileOpen ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                        {user.displayName.split(' ')[0]}
                                    </span>
                                )}
                                <div className={`w-8 h-8 rounded-lg border overflow-hidden shrink-0 transition-all ${isProfileOpen ? 'border-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.3)]' : 'border-white/10 group-hover:border-violet-500/40'}`}>
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${user?.displayName || 'User'}&background=random`}
                                        alt="User"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </button>
                            <ProfileMenu isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
