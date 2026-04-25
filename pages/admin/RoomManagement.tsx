import React, { useEffect, useState } from 'react';
import { getRooms, deleteRoom } from '../../services/adminService';
import { MessageSquare, Users, Clock, Trash2, Power, RefreshCw } from 'lucide-react';

const RoomManagement: React.FC = () => {
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const data = await getRooms();
            if (data.success) {
                setRooms(data.rooms);
            }
        } catch (error) {
            console.error('Failed to fetch rooms');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(fetchRooms, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleTerminateRoom = async (id: string) => {
        if (!window.confirm('Terminate this session? All connected users will be disconnected.')) return;
        try {
            const data = await deleteRoom(id);
            if (data.success) {
                setRooms(rooms.filter(r => (r._id || r.id) !== id));
            }
        } catch (error) {
            console.error('Termination failed');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Study Room Monitor</h1>
                    <p className="text-xs text-slate-500 font-medium">Real-time observation and moderation of active collaboration spaces.</p>
                </div>
                <button 
                    onClick={fetchRooms}
                    className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
                    title="Refresh List"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading && rooms.length === 0 ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="bg-[#0A0C10] border border-white/5 p-5 rounded-2xl h-48 animate-pulse" />
                    ))
                ) : rooms.length === 0 ? (
                    <div className="col-span-full p-12 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-2xl">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No active study rooms detected.</p>
                    </div>
                ) : (
                    rooms.map((room) => (
                        <div key={room._id || room.id} className="bg-[#0A0C10] border border-white/5 p-5 rounded-2xl hover:border-violet-500/20 transition-all flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-[10px] font-bold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded uppercase tracking-tighter">
                                        ID: {(room._id || room.id).slice(-4)}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <Clock size={10} />
                                        {new Date(room.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <h3 className="text-sm font-bold text-white mb-1">{room.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                                    TOPIC: {room.topic || 'General'}
                                </p>
                                
                                <div className="flex items-center gap-4 py-3 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Users size={14} className="text-slate-500" />
                                        <span className="text-xs font-bold text-slate-300">
                                            {room.participants?.length || 0} / {room.maxUsers}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${room.active ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                                            {room.active ? 'Live' : 'Closed'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                                <button className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                                    Audit Logs
                                </button>
                                <button 
                                    onClick={() => handleTerminateRoom(room._id || room.id)}
                                    className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-500 transition-colors" 
                                    title="Terminate Room"
                                >
                                    <Power size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="flex items-center justify-center p-8 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl">
                <div className="text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Systems Status: Online</p>
                    <p className="text-[10px] text-slate-600 font-medium italic">Automatic refresh every 30 seconds.</p>
                </div>
            </div>
        </div>
    );
};

export default RoomManagement;
