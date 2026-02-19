import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Input, Modal, PageHeader } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, PlusCircle, RefreshCw, Settings2, Trash2, Users } from 'lucide-react';
import CreateRoomModal from '../components/CreateRoomModal';
import { deleteRoom, getRooms, updateRoom } from '../services/communityService';
import { getCourses } from '../services/courseService';
import { type Course, type StudyRoom } from '../types';

const ROOMS_PER_PAGE = 8;

const StudyLobby: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { t } = useLanguage();

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

        let next = [...rooms];

        if (topicQuery) {
            next = next.filter((room) => {
                const courseName = (courseNameById.get(room.courseId) || '').toLowerCase();
                const roomTopic = (room.topic || '').toLowerCase();
                return courseName.includes(topicQuery) || roomTopic.includes(topicQuery);
            });
        }

        if (showOnlyMine) {
            next = next.filter((room) => isRoomHost(room));
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

    const handleJoinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinId.trim()) return;
        navigate(`/study-room/${joinId.trim()}`);
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
        const confirmed = window.confirm(`Delete "${room.name}"? This will close the room for everyone.`);
        if (!confirmed) return;

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
        } catch (deleteError: any) {
            const message = deleteError?.response?.data?.message || deleteError?.message || 'Failed to delete room.';
            setError(message);
        } finally {
            setActionLoadingRoomId(null);
        }
    };

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
                        <p className="mt-1 text-[11px] text-slate-500">
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

            <div className="h-full overflow-y-auto px-4 md:px-6 py-6">
                <div className="mx-auto w-full max-w-6xl space-y-6">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Users size={36} className="text-violet-400 shrink-0" />
                            <PageHeader title={t('studyLobby.title')} subtitle={t('studyLobby.subtitle')} />
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchLobbyData}
                            disabled={isLoading}
                            className="self-start mt-1"
                        >
                            <RefreshCw size={14} className="mr-1.5" />
                            Refresh
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 p-6 rounded-xl ring-1 ring-slate-700 flex flex-col gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{t('studyLobby.createTitle')}</h3>
                                <p className="text-slate-400 mt-1">{t('studyLobby.createSubtitle')}</p>
                            </div>
                            <Button size="sm" onClick={() => setCreateModalOpen(true)} className="w-full h-9">
                                <PlusCircle size={18} className="mr-2" /> {t('studyLobby.createAction')}
                            </Button>
                        </div>

                        <div className="bg-slate-800/50 p-6 rounded-xl ring-1 ring-slate-700 flex flex-col gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{t('studyLobby.joinTitle')}</h3>
                                <p className="text-slate-400 mt-1">{t('studyLobby.joinSubtitle')}</p>
                            </div>
                            <form onSubmit={handleJoinRoom} className="w-full flex gap-2">
                                <Input
                                    id="join-room-id"
                                    name="joinId"
                                    type="text"
                                    value={joinId}
                                    onChange={(e) => setJoinId(e.target.value)}
                                    placeholder={t('studyLobby.joinPlaceholder')}
                                    className="text-center"
                                />
                                <Button size="sm" type="submit" className="px-3 h-9">
                                    <ArrowRight size={18} />
                                </Button>
                            </form>
                        </div>
                    </div>

                    <section className="bg-slate-900/40 border border-slate-700/60 rounded-2xl p-4 md:p-5">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{t('studyLobby.publicRooms')}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {visibleRooms.length} visible room{visibleRooms.length === 1 ? '' : 's'}
                                    {topicFromState ? ` for topic "${topicFromState}"` : ''}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                <Input
                                    id="room-search"
                                    name="roomSearch"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by room, course, or topic..."
                                    className="sm:min-w-[280px] h-10"
                                />
                                <Button
                                    variant={showOnlyMine ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setShowOnlyMine((prev) => !prev)}
                                    className="h-9 px-3 whitespace-nowrap"
                                >
                                    My Rooms
                                </Button>
                            </div>
                        </div>

                        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

                        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                            {isLoading ? (
                                <p className="text-slate-400 text-center py-8">Loading rooms...</p>
                            ) : paginatedRooms.length === 0 ? (
                                <p className="text-slate-400 text-center py-8">{t('studyLobby.noPublicRooms')}</p>
                            ) : (
                                paginatedRooms.map((room) => {
                                    const courseName = room.courseId === 'general'
                                        ? 'General'
                                        : (courseNameById.get(room.courseId) || 'Course');
                                    const roomIsFull = room.users.length >= room.maxUsers;
                                    const host = isRoomHost(room);
                                    const roomLoading = actionLoadingRoomId === room.id;

                                    return (
                                        <div key={room.id} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/70 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-white truncate">{room.name}</h4>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {courseName}{room.topic ? ` | Topic: ${room.topic}` : ''}
                                                </p>
                                                <p className="text-[11px] text-slate-500 mt-1">
                                                    Host: {room.createdBy}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                                <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded-md border border-slate-700/60">
                                                    <Users size={14} />
                                                    <span>{room.users.length} / {room.maxUsers}</span>
                                                </div>

                                                {host && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenManageRoom(room)}
                                                        className="h-8 px-2"
                                                        title="Manage room"
                                                    >
                                                        <Settings2 size={14} className="mr-1" /> Manage
                                                    </Button>
                                                )}

                                                {host && (
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleDeleteRoom(room)}
                                                        disabled={roomLoading}
                                                        className="h-8 px-2"
                                                        title="Delete room"
                                                    >
                                                        <Trash2 size={14} className="mr-1" /> Delete
                                                    </Button>
                                                )}

                                                <Button
                                                    onClick={() => navigate(`/study-room/${room.id}`)}
                                                    disabled={roomIsFull}
                                                    size="sm"
                                                    className="h-8 px-3"
                                                >
                                                    {roomIsFull ? 'Full' : t('studyLobby.joinAction')}
                                                    {!roomIsFull && <ArrowRight size={13} className="ml-1" />}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-4 flex items-center justify-between text-sm">
                                <span className="text-slate-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={currentPage <= 1}
                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
};

export default StudyLobby;
