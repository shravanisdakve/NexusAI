import React from 'react';
import { useMode } from '../contexts/ModeContext';
import { BookOpen, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopBarTabs: React.FC = () => {
    const { mode, setMode } = useMode();
    const navigate = useNavigate();

    const handleStudyClick = () => {
        setMode('study');
        navigate('/');
    };

    const handlePlacementClick = () => {
        setMode('placement');
        navigate('/placement');
    };

    return (
        <div className="flex justify-center p-4 bg-slate-900 border-b border-white/5 sticky top-0 z-10 w-full mb-4">
            <div className="flex p-1 bg-slate-800 rounded-xl space-x-1 shadow-inner max-w-md w-full">
                <button
                    onClick={handleStudyClick}
                    className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg font-medium transition-all duration-200 ${mode === 'study'
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        }`}
                >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Study Focus
                </button>
                <button
                    onClick={handlePlacementClick}
                    className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg font-medium transition-all duration-200 ${mode === 'placement'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        }`}
                >
                    <Briefcase className="w-5 h-5 mr-2" />
                    Placement Prep
                </button>
            </div>
        </div>
    );
};

export default TopBarTabs;
