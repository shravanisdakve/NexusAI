import React from 'react';
import { Target } from 'lucide-react';
import { Spinner } from '../ui';

interface RoomHeaderProps {
    room: any;
    isReconnecting: boolean;
    isSyncing: boolean;
    formattedSessionTime: string;
    effectiveTechniqueLabel: string;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ 
    room, isReconnecting, isSyncing, formattedSessionTime, effectiveTechniqueLabel 
}) => {
    return (
        <header className="h-16 border-b border-white/[0.03] bg-slate-950/40 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-30">
            <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Target className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                        {isReconnecting ? (
                            <div className="flex items-center gap-2">
                                <Spinner size="sm" className="text-amber-500" />
                                <span className="text-sm font-bold text-amber-500 animate-pulse">RECONNECTING...</span>
                            </div>
                        ) : isSyncing ? (
                            <div className="flex items-center gap-2">
                                <Spinner size="sm" className="text-sky-500" />
                                <span className="text-sm font-bold text-sky-500">SYNCING ROOM STATE...</span>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-lg font-bold text-white truncate">{room?.name || 'Study Room'}</h1>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className="px-1.5 py-0.5 bg-slate-700/50 rounded flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {effectiveTechniqueLabel}
                                    </span>
                                    <span className="truncate max-w-[150px]">{room?.topic || 'General Session'}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">LIVE SESSION</span>
                <span className="text-xs font-mono font-bold text-white tabular-nums border-l border-white/10 pl-3">{formattedSessionTime}</span>
            </div>
        </header>
    );
};

export default RoomHeader;
