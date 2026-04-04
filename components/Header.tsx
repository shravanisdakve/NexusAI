import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, BrainCircuit, BookOpen, Briefcase } from 'lucide-react';
import { useMode } from '../contexts/ModeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { studyNavigation, placementNavigation } from './Sidebar';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { mode, setMode } = useMode();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const navItems = mode === 'study' ? studyNavigation : placementNavigation;

  const handleStudyClick = () => {
    setMode('study');
    navigate('/');
    setMenuOpen(false);
  };

  const handlePlacementClick = () => {
    setMode('placement');
    navigate('/placement');
    setMenuOpen(false);
  };

  return (
    <header className="border-b border-white/5 bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 w-full">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="p-1.5 bg-violet-600 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">
              NexusAI
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-1 overflow-x-auto no-scrollbar">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) => `
                  px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                  ${isActive 
                    ? 'text-violet-400 bg-violet-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}
                `}
              >
                {(item as any).directTranslation ? item.key : t(item.key)}
              </NavLink>
            ))}
          </nav>

          {/* Mode Switching & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {/* Mode Toggle (Desktop & Tablet) */}
            <div className="hidden md:flex p-1 bg-slate-800 rounded-xl space-x-1 shadow-inner">
                <button
                    onClick={handleStudyClick}
                    className={`flex items-center py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${mode === 'study'
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        }`}
                >
                    <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                    {t('common.studyFocus', { fallback: 'Study' })}
                </button>
                <button
                    onClick={handlePlacementClick}
                    className={`flex items-center py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${mode === 'placement'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        }`}
                >
                    <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                    {t('common.placementPrep', { fallback: 'Placement' })}
                </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="xl:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Collapsed Panel */}
        {menuOpen && (
          <div className="xl:hidden border-t border-white/5 py-4 animate-in slide-in-from-top-2 duration-200">
            {/* Mode Toggle (Mobile) - Visible if not on medium+ screens */}
            <div className="md:hidden flex p-1 bg-slate-800 rounded-xl space-x-1 shadow-inner mb-4">
                <button
                    onClick={handleStudyClick}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs font-bold ${mode === 'study' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}
                >
                    Study Focus
                </button>
                <button
                    onClick={handlePlacementClick}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs font-bold ${mode === 'placement' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                >
                    Placement Prep
                </button>
            </div>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-violet-500/15 text-white border-l-2 border-violet-500' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                  `}
                  onClick={() => setMenuOpen(false)}
                >
                  <item.icon size={18} />
                  {(item as any).directTranslation ? item.key : t(item.key)}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
