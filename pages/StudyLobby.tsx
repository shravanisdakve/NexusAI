import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, Modal, PageHeader } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { AlertTriangle, ArrowRight, Briefcase, PlusCircle, RefreshCw, Settings2, Target, Trash2, Users, Search } from 'lucide-react';
import CreateRoomModal from '../components/CreateRoomModal';
import { checkRoomExists, deleteRoom, getRooms, updateRoom } from '../services/communityService';
import { getCourses } from '../services/courseService';
import { type Course, type StudyRoom } from '../types';
import PageLayout from '../components/ui/PageLayout';

const ROOMS_PER_PAGE = 8;

const StudyLobby: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { t } = useLanguage();
    const { showToast } = useToast();

    const [joinId, setJoinId] = useState('');
    const [error, setError] = useState('');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rooms, setRooms] = useState<StudyRoom[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showOnlyMine, setShowOnlyMine] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [actionLoadingRoomId, setActionLoadingRoomId] = useState<string | null>(null);

    const [roomBeingEdited, setRoomBeingEdited] = useState<StudyRoom | null>(null);
    const [editName, setEditName] = useState('');
    const [editTopic, setEditTopic] = useState('');
    const [editMaxUsers, setEditMaxUsers] = useState(5);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const topicFromState = useMemo(() => {
        const value = (location.state as { topic?: string } | null)?.topic;
        return typeof value === 'string' ? value.trim() : '';
    }, [location.state]);

    const courseNameById = useMemo(() => {
        return new Map(courses.map((course) => [course.id, course.name]));
    }, [courses]);

    const fetchLobbyData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const [allRooms, allCourses] = await Promise.all([getRooms(), getCourses()]);
            setRooms(allRooms);
            setCourses(allCourses);
        } catch (fetchError) {
            console.error('Failed to fetch lobby data:', fetchError);
            setError('Failed to load rooms. Please refresh.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLobbyData();
    }, [fetchLobbyData]);

    const isRoomHost = useCallback((room: StudyRoom) => {
        if (!user) return false;
        if (room.createdById && user.id) {
            return room.createdById === user.id;
        }
        if (room.createdByEmail && user.email) {
            return room.createdByEmail.toLowerCase() === user.email.toLowerCase();
        }
        return room.createdBy === user.displayName;
    }, [user]);

    const visibleRooms = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const topicQuery = topicFromState.toLowerCase();

        // Primary deduplication by ID (API safety)
        const uniqueById = Array.from(new Map(rooms.map((r) => [r.id, r])).values());
        let next = [...uniqueById];

        // Deduplicate common duplicates before filtering (host_id + topic)
        const seen = new Set();
        next = next.filter(room => {
            const hostId = room.createdById || room.createdByEmail || room.createdBy;
            const topicId = (room.topic || '').toLowerCase().trim();
            const key = `${hostId}-${topicId}`;
            if (topicId && seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        if (topicQuery) {
            next = next.filter((room) => {
                const courseName = (courseNameById.get(room.courseId) || '').toLowerCase();
                const roomTopic = (room.topic || '').toLowerCase();
                return courseName.includes(topicQuery) || roomTopic.includes(topicQuery);
            });
        }

        // ISSUE 12: In "Public Rooms", filter out user's own rooms if they are just browsing.
        // If showOnlyMine is true, we ONLY show user's rooms.
        if (showOnlyMine) {
            next = next.filter((room) => isRoomHost(room));
        } else {
            // By default, only show "Public" discovery - rooms from others
            next = next.filter((room) => !isRoomHost(room));
        }

        if (query) {
            next = next.filter((room) => {
                const courseName = (courseNameById.get(room.courseId) || '').toLowerCase();
                return (
                    room.name.toLowerCase().includes(query)
                    || (room.topic || '').toLowerCase().includes(query)
                    || courseName.includes(query)
                );
            });
        }

        return next;
    }, [rooms, searchQuery, topicFromState, showOnlyMine, isRoomHost, courseNameById]);

    const findDuplicateRoom = useCallback((room: StudyRoom) => {
        return rooms.find((other) =>
            other.id !== room.id &&
            ((other.createdById && other.createdById === room.createdById) ||
                (other.createdByEmail && other.createdByEmail === room.createdByEmail)) &&
            other.topic === room.topic &&
            room.topic !== undefined &&
            room.topic.trim() !== ''
        );
    }, [rooms]);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(visibleRooms.length / ROOMS_PER_PAGE));
    }, [visibleRooms.length]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, showOnlyMine, topicFromState]);

    const paginatedRooms = useMemo(() => {
        const start = (currentPage - 1) * ROOMS_PER_PAGE;
        return visibleRooms.slice(start, start + ROOMS_PER_PAGE);
    }, [visibleRooms, currentPage]);

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = joinId.trim();
        if (!id) {
            setError('Please enter a Room ID.');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const exists = await checkRoomExists(id);
            if (!exists) {
                setError('Room ID not found. It may be expired or deleted.');
                setIsLoading(false);
                return;
            }
            navigate(`/study-room/${id}`);
        } catch (err: any) {
            console.error('Failed to join room:', err);
            setError('System error. Please try manually refresh.');
            setIsLoading(false);
        }
    };

    const handleOpenManageRoom = (room: StudyRoom) => {
        setRoomBeingEdited(room);
        setEditName(room.name);
        setEditTopic(room.topic || '');
        setEditMaxUsers(Math.max(room.maxUsers, room.users.length, 2));
    };

    const handleCloseManageRoom = () => {
        if (isSavingEdit) return;
        setRoomBeingEdited(null);
        setEditName('');
        setEditTopic('');
        setEditMaxUsers(5);
    };

    const handleSaveManageRoom = async () => {
        if (!roomBeingEdited) return;
        const trimmedName = editName.trim();
        if (trimmedName.length < 3) {
            setError('Room name must be at least 3 characters.');
            return;
        }

        const minimumAllowedMaxUsers = Math.max(2, roomBeingEdited.users.length);
        if (!Number.isInteger(editMaxUsers) || editMaxUsers < minimumAllowedMaxUsers || editMaxUsers > 60) {
            setError(`Max users must be between ${minimumAllowedMaxUsers} and 60.`);
            return;
        }

        setIsSavingEdit(true);
        setError('');

        try {
            const updated = await updateRoom(roomBeingEdited.id, {
                name: trimmedName,
                topic: editTopic.trim(),
                maxUsers: editMaxUsers
            });

            if (!updated) {
                throw new Error('Room update failed');
            }

            setRooms((prev) => prev.map((room) => room.id === updated.id ? updated : room));
            handleCloseManageRoom();
        } catch (updateError: any) {
            const message = updateError?.response?.data?.message || updateError?.message || 'Failed to update room.';
            setError(message);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDeleteRoom = async (room: StudyRoom) => {
        // High-end feedback for room closure
        showToast(`Closing room "${room.name}" for all participants...`, 'info');

        setActionLoadingRoomId(room.id);
        setError('');
        try {
            const ok = await deleteRoom(room.id);
            if (!ok) {
                throw new Error('Room delete failed');
            }
            setRooms((prev) => prev.filter((item) => item.id !== room.id));
            if (roomBeingEdited?.id === room.id) {
                handleCloseManageRoom();
            }
        } catch (error: any) {
            console.error('Failed to delete room:', error);
            showToast("Action failed. Please verify host privileges.", 'error');
        } finally {
            setActionLoadingRoomId(null);
        }
    };

    const MainContent = (
        <div className="space-y-6">
            {/* Header (Inside Main) */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-600/10 rounded-xl border border-violet-500/20">
                        <Users size={20} className="text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-white italic tracking-tight uppercase leading-none">Lobby Registry</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Live Peer Collaboration</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{rooms.length} Active</span>
                </div>
            </div>

            {/* Room List */}
            <div className="space-y-4">
                <div className="space-y-3">
                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                            <AlertTriangle size={16} className="text-rose-400" />
                            <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest">{error}</p>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                            <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-violet-500 animate-spin"></div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Syncing Registry...</p>
                        </div>
                    ) : paginatedRooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center rounded-[3rem] border-2 border-dashed border-white/[0.03] bg-slate-900/20 backdrop-blur-3xl px-10">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-slate-950 border border-white/5 flex items-center justify-center mb-8 relative">
                                <Users size={32} className="text-slate-700" />
                                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-slate-800 animate-pulse border border-slate-900" />
                            </div>
                            <div className="max-w-xs mx-auto">
                                <h4 className="text-lg font-black text-white italic uppercase tracking-tighter mb-2">No active sessions</h4>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-relaxed mb-8 italic">Your filtered search returned zero secure sync rooms.</p>
                                <Button 
                                    onClick={() => setCreateModalOpen(true)}
                                    className="h-11 px-8 bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest hover:bg-violet-600 hover:text-white transition-all rounded-xl"
                                >
                                    + Initialize New Room
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {paginatedRooms.map((room) => {
                                const courseName = room.courseId === 'general' ? 'Global Ecosystem' : (courseNameById.get(room.courseId) || 'Context');
                                const roomIsFull = room.users.length >= room.maxUsers;
                                const host = isRoomHost(room);
                                const roomLoading = actionLoadingRoomId === room.id;
                                const fillPercentage = (room.users.length / room.maxUsers) * 100;

                                return (
                                    <div key={room.id} className="group relative flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-950/40 border border-white/[0.04] rounded-3xl hover:bg-slate-900/60 hover:border-violet-500/20 transition-all duration-500 overflow-hidden shadow-2xl">
                                        <div className="flex-1 min-w-0 flex items-center gap-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-700 shadow-xl ${roomIsFull ? 'bg-slate-900 border-white/5 grayscale' : 'bg-slate-950 border-white/5 group-hover:border-violet-500/40 group-hover:scale-105'}`}>
                                                <div className={`p-3 rounded-xl ${roomIsFull ? 'bg-slate-800' : 'bg-violet-600 shadow-[0_0_15px_rgba(139,92,246,0.2)]'}`}>
                                                    <Briefcase size={20} className="text-white" />
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                                    <h4 className="font-black text-[15px] text-white italic tracking-tighter truncate uppercase leading-none">{room.name}</h4>
                                                    {host && <span className="text-[8px] font-black text-violet-400 border border-violet-500/30 bg-violet-500/5 px-2.5 py-0.5 rounded-lg uppercase tracking-widest italic">Host</span>}
                                                    {roomIsFull && <span className="text-[8px] font-black text-rose-500 border border-rose-500/30 bg-rose-500/5 px-2.5 py-0.5 rounded-lg uppercase tracking-widest italic">Full</span>}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Target size={12} className="text-slate-600" />
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{courseName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.2em] italic bg-white/[0.02] px-3 py-1 rounded-full border border-white/[0.03]">
                                                            {room.topic || 'General sync'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-white/[0.04]">
                                            <div className="flex flex-col items-end gap-2 group/status">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`text-[10px] font-black tabular-nums transition-colors ${roomIsFull ? 'text-rose-500' : 'text-white italic'}`}>
                                                        {room.users.length} <span className="text-slate-700 mx-0.5 opacity-50">/</span> {room.maxUsers}
                                                    </span>
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Joined</span>
                                                </div>
                                                <div className="w-24 h-1 bg-slate-900 rounded-full overflow-hidden border border-white/[0.03]">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 ${roomIsFull ? 'bg-rose-600' : 'bg-violet-600 shadow-[0_0_8px_rgba(139,92,246,0.5)]'}`}
                                                        style={{ width: `${fillPercentage}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {host && (
                                                    <div className="flex border-r border-white/[0.06] pr-2 mr-1 gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => { e.stopPropagation(); handleOpenManageRoom(room); }}
                                                            className="h-10 w-10 p-0 text-slate-500 border border-white/5 hover:text-white hover:bg-white/5 transition-all rounded-xl"
                                                        >
                                                            <Settings2 size={16} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room); }}
                                                            disabled={roomLoading}
                                                            className="h-10 w-10 p-0 text-slate-500 border border-white/5 hover:text-rose-400 hover:bg-rose-400/5 transition-all rounded-xl"
                                                        >
                                                            {roomLoading ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={16} />}
                                                        </Button>
                                                    </div>
                                                )}
                                                <Button
                                                    onClick={() => navigate(`/study-room/${room.id}`)}
                                                    disabled={roomIsFull}
                                                    className={`h-12 px-8 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl border ${roomIsFull ? 'opacity-20 grayscale' : 'bg-slate-900 border-white/5 hover:bg-violet-600 hover:border-violet-500 hover:text-white shadow-xl'}`}
                                                >
                                                    {roomIsFull ? 'LOCKED' : 'JOIN SYNC'}
                                                    {!roomIsFull && <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-white/[0.06] rounded-2xl">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 py-1 bg-black/40 rounded-full border border-white/5">
                        {currentPage} / {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            className="h-8 px-3 text-[9px] font-black uppercase tracking-widest text-slate-400 border border-white/5"
                        >
                            Prev
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            className="h-8 px-3 text-[9px] font-black uppercase tracking-widest text-slate-400 border border-white/5"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );

    const SideContent = (
        <div className="space-y-6">
            {/* Primary Actions */}
            <div className="space-y-2">
                <Button 
                    onClick={() => setCreateModalOpen(true)} 
                    className="w-full h-12 bg-violet-600 hover:bg-violet-500 text-[10px] font-black uppercase tracking-wider rounded-xl border border-white/10"
                >
                    <PlusCircle size={16} className="mr-2" /> Host Session
                </Button>
                <Button 
                    variant="ghost" 
                    onClick={fetchLobbyData}
                    className="w-full h-10 bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-wider"
                >
                    <RefreshCw size={14} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sync Lobby
                </Button>
            </div>

            {/* Join by ID */}
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/[0.06]">
                <p className="eyebrow-label mb-3">Join by ID</p>
                <form onSubmit={handleJoinRoom} className="space-y-2">
                    <Input
                        id="join-room-id"
                        name="joinId"
                        value={joinId}
                        onChange={(e) => setJoinId(e.target.value)}
                        placeholder="SR-XXX"
                        className="h-10 bg-slate-950/50 border-white/5 text-[10px] font-black tracking-widest uppercase"
                    />
                    <Button type="submit" className="w-full h-9 bg-white/5 border border-white/10 hover:bg-slate-800 text-[9px] font-black uppercase tracking-widest">
                        Submit
                    </Button>
                </form>
            </div>

            {/* Filter */}
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/[0.06]">
                <p className="eyebrow-label mb-3">Filter Registry</p>
                <div className="space-y-4">
                    <div className="relative">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <Input
                            id="room-search"
                            name="roomSearch"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="SEARCH..."
                            className="h-9 pl-9 bg-slate-950/50 border-white/5 text-[10px] font-bold uppercase tracking-widest"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setShowOnlyMine(false)}
                            className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all ${!showOnlyMine ? 'bg-violet-600 text-white border-violet-500' : 'text-slate-500 border-white/5 bg-slate-950/50 hover:text-slate-300'}`}
                        >
                            Lobby
                        </button>
                        <button
                            onClick={() => setShowOnlyMine(true)}
                            className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all ${showOnlyMine ? 'bg-emerald-600 text-white border-emerald-500' : 'text-slate-500 border-white/5 bg-slate-950/50 hover:text-slate-300'}`}
                        >
                            Mine
                        </button>
                    </div>
                </div>
            </div>

            {/* Lobby Stats */}
            <div className="p-5 bg-slate-900/40 rounded-2xl border border-white/[0.05]">
                <p className="eyebrow-label mb-3">Ecosystem Stats</p>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Live</span>
                        <span className="text-sm font-black text-emerald-400">42</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Peers</span>
                        <span className="text-sm font-black text-violet-400">128</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <CreateRoomModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />

            <Modal isOpen={!!roomBeingEdited} onClose={handleCloseManageRoom} title="Manage Room">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="manage-room-name" className="block text-sm text-slate-300 mb-1">Room Name</label>
                        <Input
                            id="manage-room-name"
                            name="manageRoomName"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Room name"
                        />
                    </div>
                    <div>
                        <label htmlFor="manage-room-topic" className="block text-sm text-slate-300 mb-1">Topic</label>
                        <Input
                            id="manage-room-topic"
                            name="manageRoomTopic"
                            value={editTopic}
                            onChange={(e) => setEditTopic(e.target.value)}
                            placeholder="Topic"
                        />
                    </div>
                    <div>
                        <label htmlFor="manage-room-max-users" className="block text-sm text-slate-300 mb-1">Max Users</label>
                        <Input
                            id="manage-room-max-users"
                            name="manageRoomMaxUsers"
                            type="number"
                            min={Math.max(2, roomBeingEdited?.users.length || 2)}
                            max={60}
                            value={editMaxUsers}
                            onChange={(e) => setEditMaxUsers(Number(e.target.value))}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Must be at least current participants ({roomBeingEdited?.users.length || 0}).
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <Button size="sm" className="h-8 px-3" variant="ghost" onClick={handleCloseManageRoom} disabled={isSavingEdit}>
                            Cancel
                        </Button>
                        <Button size="sm" className="h-8 px-3" onClick={handleSaveManageRoom} isLoading={isSavingEdit}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Modal>

            <PageLayout 
                main={MainContent}
                side={SideContent}
            />
        </>
    );
};

export default StudyLobby;
