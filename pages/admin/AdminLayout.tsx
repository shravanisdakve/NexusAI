import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';

const AdminLayout: React.FC = () => {
    return (
        <div className="flex min-h-screen bg-[#020406] text-slate-200">
            <AdminSidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#050608]/50 backdrop-blur-md sticky top-0 z-[90]">
                    <div className="flex items-center gap-4">
                        <h2 className="text-sm font-bold tracking-widest text-white uppercase italic opacity-80">NexusAI Console</h2>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Systems Nominal</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <a 
                            href="/dashboard" 
                            className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest px-3 py-1.5 hover:bg-white/5 rounded-lg transition-all"
                        >
                            Return to Dashboard
                        </a>
                        <div className="flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 shadow-inner">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg border border-white/10">
                                AD
                            </div>
                            <span className="text-xs font-semibold text-slate-300">Admin Console</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
