import React from 'react';
import { WifiOff, Home, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Offline: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#050608] flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full"></div>
                    <div className="relative bg-slate-900 ring-1 ring-white/10 p-6 rounded-3xl shadow-2xl">
                        <WifiOff className="w-16 h-16 text-purple-400 mx-auto" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-black text-white tracking-tight">You're Offline</h1>
                    <p className="text-slate-400 text-lg">
                        It looks like you've lost your connection. NexusAI requires an internet connection to sync with our neural engines.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    <button 
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-purple-500/20 w-full sm:w-auto"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Try Again
                    </button>
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl border border-white/10 transition-all active:scale-95 w-full sm:w-auto"
                    >
                        <Home className="w-5 h-5" />
                        Go Home
                    </button>
                </div>

                <div className="pt-8">
                    <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 inline-block">
                        <p className="text-sm text-purple-300 font-medium">
                            Pro-tip: You can still browse cached notes while offline.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Offline;
