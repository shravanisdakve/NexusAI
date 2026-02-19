import { type StudyRoom, type ChatMessage, type Quiz, type Thread, type Post, type TechniqueState, type TechniqueKey } from '../types';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { getResources } from './resourceService';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';
const SOCKET_URL = API_URL;

let socket: Socket | null = null;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const isRoomId = (value: string) => /^[a-f0-9]{24}$/i.test(value);

// --- Socket Initialization ---
export const initializeSocket = (token: string) => {
    if (socket) return socket;

    socket = io(SOCKET_URL, {
        auth: { token },
        withCredentials: true
    });

    socket.on('connect', () => {
        console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', () => {
        console.log('[Socket] Disconnected');
    });

    return socket;
};

export const getSocket = () => socket;

// --- Room Management ---
export const getRooms = async (): Promise<StudyRoom[]> => {
    try {
        const response = await axios.get(`${API_URL}/api/community/rooms`, {
            headers: getAuthHeaders()
        });
        return response.data.success ? response.data.rooms : [];
    } catch (error) {
        console.error('Error fetching rooms:', error);
        return [];
    }
};

export const getRoom = async (id: string): Promise<StudyRoom | null> => {
    try {
        const response = await axios.get(`${API_URL}/api/community/rooms/${id}`, {
            headers: getAuthHeaders()
        });
        return response.data.success ? response.data.room : null;
    } catch (error) {
        console.error(`Error fetching room ${id}:`, error);
        return null;
    }
};

export const addRoom = async (name: string, courseId: string, maxUsers: number, createdBy: any, university?: string, technique?: string, topic?: string): Promise<StudyRoom | null> => {
    try {
        const response = await axios.post(
            `${API_URL}/api/community/rooms`,
            { name, courseId, maxUsers, technique, topic },
            { headers: getAuthHeaders() }
        );

        return response.data.success ? response.data.room : null;
    } catch (error) {
        console.error('Error creating room:', error);
        return null;
    }
};

// --- Socket Events ---
export const joinRoom = (roomId: string, user?: any) => {
    if (!socket) return;
    if (user) {
        socket.emit('join-room', roomId, { id: user.id, displayName: user.displayName, email: user.email });
    } else {
        socket.emit('join-room', roomId);
    }
};

export const leaveRoom = async (roomId: string) => {
    try {
        if (socket) {
            socket.emit('leave-room', roomId);
        }
        await axios.post(`${API_URL}/api/community/rooms/${roomId}/leave`, {}, {
            headers: getAuthHeaders()
        });
    } catch (error) {
        console.error(`Error leaving room ${roomId}:`, error);
    }
};

export const updateRoom = async (
    roomId: string,
    updates: { name?: string; topic?: string; maxUsers?: number }
): Promise<StudyRoom | null> => {
    try {
        const response = await axios.patch(`${API_URL}/api/community/rooms/${roomId}`, updates, {
            headers: getAuthHeaders()
        });
        return response.data?.success ? response.data.room : null;
    } catch (error) {
        console.error(`Error updating room ${roomId}:`, error);
        throw error;
    }
};

export const deleteRoom = async (roomId: string): Promise<boolean> => {
    try {
        const response = await axios.delete(`${API_URL}/api/community/rooms/${roomId}`, {
            headers: getAuthHeaders()
        });
        return !!response.data?.success;
    } catch (error) {
        console.error(`Error deleting room ${roomId}:`, error);
        throw error;
    }
};

export type RoomModerationAction = 'mute_chat' | 'unmute_chat' | 'remove' | 'transfer_host';

export const moderateRoomMember = async (
    roomId: string,
    payload: { action: RoomModerationAction; targetUserEmail?: string; targetUserId?: string }
) => {
    const response = await axios.post(`${API_URL}/api/community/rooms/${roomId}/members/moderate`, payload, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const onRoomUpdate = (roomId: string, callback: (room: any) => void) => {
    if (!socket) return () => { };

    const handler = (room: any) => {
        if (!roomId || room?.id === roomId) {
            callback(room);
        }
    };

    socket.on('room-update', handler);
    return () => socket?.off('room-update', handler);
};

// --- Technique Orchestration ---
export const getTechniqueState = async (roomId: string): Promise<{ technique: string; techniqueState: TechniqueState | null }> => {
    try {
        const response = await axios.get(`${API_URL}/api/community/rooms/${roomId}/technique-state`, {
            headers: getAuthHeaders()
        });
        return {
            technique: response.data?.technique || 'Pomodoro Technique',
            techniqueState: response.data?.techniqueState || null
        };
    } catch (error) {
        console.error(`Error fetching technique state for ${roomId}:`, error);
        return { technique: 'Pomodoro Technique', techniqueState: null };
    }
};

export const updateTechniqueState = async (
    roomId: string,
    action: 'start' | 'pause' | 'reset' | 'set_technique',
    expectedVersion?: number,
    techniqueKey?: TechniqueKey
): Promise<{ stale?: boolean; technique: string; techniqueState: TechniqueState | null }> => {
    const response = await axios.put(`${API_URL}/api/community/rooms/${roomId}/technique-state`, {
        action,
        expectedVersion,
        techniqueKey
    }, {
        headers: getAuthHeaders()
    });

    return {
        stale: response.data?.stale,
        technique: response.data?.technique || 'Pomodoro Technique',
        techniqueState: response.data?.techniqueState || null
    };
};

export const advanceTechniquePhase = async (
    roomId: string,
    expectedVersion?: number
): Promise<{ stale?: boolean; technique: string; techniqueState: TechniqueState | null }> => {
    const response = await axios.post(`${API_URL}/api/community/rooms/${roomId}/technique-state/advance`, {
        expectedVersion
    }, {
        headers: getAuthHeaders()
    });

    return {
        stale: response.data?.stale,
        technique: response.data?.technique || 'Pomodoro Technique',
        techniqueState: response.data?.techniqueState || null
    };
};

export const onTechniqueUpdate = (
    roomId: string,
    callback: (data: { technique: string; techniqueState: TechniqueState | null }) => void
) => {
    getTechniqueState(roomId).then(callback);
    if (!socket) return () => { };

    const handler = (payload: { roomId: string; technique?: string; techniqueState: TechniqueState | null }) => {
        if (payload.roomId === roomId) {
            callback({
                technique: payload.technique || 'Pomodoro Technique',
                techniqueState: payload.techniqueState || null
            });
        }
    };

    socket.on('room-technique-updated', handler);
    return () => socket?.off('room-technique-updated', handler);
};

// --- Message Management ---
export const getRoomMessages = async (roomId: string): Promise<ChatMessage[]> => {
    try {
        const response = await axios.get(`${API_URL}/api/community/rooms/${roomId}/messages`, {
            headers: getAuthHeaders()
        });

        if (!response.data.success) return [];

        return response.data.messages.map((msg: any) => ({
            id: msg.id,
            role: 'user',
            parts: [{ text: msg.text || '' }],
            user: {
                displayName: msg.sender || 'Unknown',
                email: msg.email || msg.userId || 'unknown'
            },
            timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now()
        }));
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
};

export const sendChatMessage = async (roomId: string, message: any) => {
    if (!socket) return;

    socket.emit('send-message', {
        roomId,
        userId: message.userId,
        email: message.email,
        senderName: message.sender,
        content: message.text
    });
};

// Legacy API kept for compatibility with older call sites.
export const onMessagesUpdate = (roomId: string, callback: (messages: ChatMessage[]) => void) => {
    if (!socket) return () => { };

    let currentMessages: ChatMessage[] = [];
    getRoomMessages(roomId).then((messages) => {
        currentMessages = messages;
        callback(messages);
    });

    const handler = (rawMsg: any) => {
        const newMessage: ChatMessage = {
            id: rawMsg.id || Date.now().toString(),
            role: 'user',
            parts: [{ text: rawMsg.text || '' }],
            user: {
                displayName: rawMsg.sender || 'Unknown',
                email: rawMsg.email || rawMsg.userId || 'unknown'
            },
            timestamp: rawMsg.timestamp ? new Date(rawMsg.timestamp).getTime() : Date.now()
        };
        currentMessages = [...currentMessages, newMessage];
        callback(currentMessages);
    };

    socket.on('receive-message', handler);
    return () => socket?.off('receive-message', handler);
};

export const subscribeToMessages = (callback: (msg: any) => void) => {
    if (!socket) return () => { };
    socket.on('receive-message', callback);
    return () => socket?.off('receive-message', callback);
};

export const subscribeToDraw = (callback: (data: any) => void) => {
    if (!socket) return () => { };
    socket.on('draw', callback);
    return () => socket?.off('draw', callback);
};

export const emitDraw = (data: any) => {
    if (socket) socket.emit('draw', data);
};

export const requestModeration = (roomId: string) => {
    if (socket) socket.emit('request-moderation', { roomId });
};

// --- Shared Room Notes ---
export const saveRoomMessages = async (roomId: string, messages: any[]) => {
    if (!messages.length) return;
    await Promise.all(messages.map((message) => sendChatMessage(roomId, message)));
};

export const getRoomAINotes = async (roomId: string) => {
    try {
        const response = await axios.get(`${API_URL}/api/community/rooms/${roomId}/notes`, {
            headers: getAuthHeaders()
        });
        return response.data.success ? (response.data.notes || '') : '';
    } catch (error) {
        console.error(`Error fetching room notes for ${roomId}:`, error);
        return '';
    }
};

export const saveRoomAINotes = async (roomId: string, content: string) => {
    try {
        await axios.put(`${API_URL}/api/community/rooms/${roomId}/notes`, { content }, {
            headers: getAuthHeaders()
        });
    } catch (error) {
        console.error(`Error saving room notes for ${roomId}:`, error);
        throw error;
    }
};

export const onNotesUpdate = (roomId: string, callback: any) => {
    getRoomAINotes(roomId).then(callback);
    if (!socket) return () => { };

    const handler = (payload: { roomId: string; content: string }) => {
        if (payload.roomId === roomId) {
            callback(payload.content || '');
        }
    };

    socket.on('room-notes-updated', handler);
    return () => socket?.off('room-notes-updated', handler);
};

export const saveUserNotes = async (roomId: string, userId: string, content: string) => {
    await axios.put(`${API_URL}/api/community/rooms/${roomId}/user-notes`, { userId, content }, {
        headers: getAuthHeaders()
    });
};

export const onUserNotesUpdate = (roomId: string, userId: string, callback: any) => {
    axios.get(`${API_URL}/api/community/rooms/${roomId}/user-notes/${userId}`, {
        headers: getAuthHeaders()
    }).then((response) => {
        callback(response.data?.content || '');
    }).catch((error) => {
        console.error(`Error loading initial user notes for ${roomId}/${userId}:`, error);
        callback('');
    });
    if (!socket) return () => { };

    const handler = (payload: { roomId: string; userId: string; content: string }) => {
        if (payload.roomId === roomId && payload.userId === userId) {
            callback(payload.content || '');
        }
    };

    socket.on('room-user-notes-updated', handler);
    return () => socket?.off('room-user-notes-updated', handler);
};

// --- Room Resources ---
export const deleteResource = async (roomId: string, fileName: string) => {
    await axios.delete(`${API_URL}/api/community/rooms/${roomId}/resources/${encodeURIComponent(fileName)}`, {
        headers: getAuthHeaders()
    });
};

export const uploadResource = async (roomId: string, file: any, metadata: any) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata?.displayName) {
        formData.append('displayName', metadata.displayName);
    }

    await axios.post(`${API_URL}/api/community/rooms/${roomId}/resources`, formData, {
        headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
        }
    });
};

export const getRoomResources = async (roomIdOrCourseName: string) => {
    try {
        if (isRoomId(roomIdOrCourseName)) {
            const response = await axios.get(`${API_URL}/api/community/rooms/${roomIdOrCourseName}/resources`, {
                headers: getAuthHeaders()
            });
            return response.data.success ? response.data.resources : [];
        }

        // Fallback for course community (subject-based resources)
        const resources = await getResources({ subject: roomIdOrCourseName });
        return resources.map((resource: any) => ({
            name: resource.title,
            url: resource.link,
            mimeType: 'external/link',
            uploader: typeof resource.uploadedBy === 'string'
                ? 'User'
                : (resource.uploadedBy?.displayName || 'Unknown'),
            timeCreated: resource.createdAt
        }));
    } catch (error) {
        console.error('Error fetching room resources:', error);
        return [];
    }
};

export const onResourcesUpdate = (roomIdOrCourseName: string, callback: any) => {
    if (isRoomId(roomIdOrCourseName)) {
        getRoomResources(roomIdOrCourseName).then(callback);
        if (!socket) return () => { };

        const handler = (payload: { roomId: string; resources: any[] }) => {
            if (payload.roomId === roomIdOrCourseName) {
                callback(payload.resources || []);
            }
        };

        socket.on('room-resources-updated', handler);
        return () => socket?.off('room-resources-updated', handler);
    }

    // Course-community usage: one-shot fetch from global resource library.
    getRoomResources(roomIdOrCourseName).then(callback);
    return () => { };
};

// --- Shared Quiz ---
export const onQuizUpdate = (roomId: string, callback: any) => {
    axios.get(`${API_URL}/api/community/rooms/${roomId}/quiz`, {
        headers: getAuthHeaders()
    }).then((response) => {
        callback(response.data?.quiz || null);
    }).catch((error) => {
        console.error(`Error loading initial quiz for ${roomId}:`, error);
        callback(null);
    });
    if (!socket) return () => { };

    const handler = (payload: { roomId: string; quiz: any }) => {
        if (payload.roomId === roomId) {
            callback(payload.quiz || null);
        }
    };

    socket.on('room-quiz-updated', handler);
    return () => socket?.off('room-quiz-updated', handler);
};

export const saveQuiz = async (roomId: string, quiz: any) => {
    await axios.put(`${API_URL}/api/community/rooms/${roomId}/quiz`, { quiz }, {
        headers: getAuthHeaders()
    });
};

export const saveQuizAnswer = async (roomId: string, userId: string, userName: string, index: number) => {
    await axios.post(`${API_URL}/api/community/rooms/${roomId}/quiz/answer`, { userId, userName, index }, {
        headers: getAuthHeaders()
    });
};

export const clearQuiz = async (roomId: string) => {
    await axios.delete(`${API_URL}/api/community/rooms/${roomId}/quiz`, {
        headers: getAuthHeaders()
    });
};

// --- Q&A FORUM SERVICES ---
export const getThreads = async (courseId: string): Promise<Thread[]> => {
    try {
        const response = await axios.get(`${API_URL}/api/community/courses/${courseId}/threads`, {
            headers: getAuthHeaders()
        });
        return response.data.success ? response.data.threads : [];
    } catch (error) {
        console.error('Error fetching threads:', error);
        return [];
    }
};

export const createThread = async (data: { courseId: string; title: string; content: string; category: string; pyqTag?: string }): Promise<Thread | null> => {
    try {
        const response = await axios.post(`${API_URL}/api/community/threads`, data, {
            headers: getAuthHeaders()
        });
        return response.data.success ? response.data.thread : null;
    } catch (error) {
        console.error('Error creating thread:', error);
        return null;
    }
};

export const getThreadPosts = async (threadId: string): Promise<Post[]> => {
    try {
        const response = await axios.get(`${API_URL}/api/community/threads/${threadId}/posts`, {
            headers: getAuthHeaders()
        });
        return response.data.success ? response.data.posts : [];
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
};

export const createPost = async (threadId: string, content: string): Promise<Post | null> => {
    try {
        const response = await axios.post(`${API_URL}/api/community/threads/${threadId}/posts`, { content }, {
            headers: getAuthHeaders()
        });
        return response.data.success ? response.data.post : null;
    } catch (error) {
        console.error('Error creating post:', error);
        return null;
    }
};

export const upvoteThread = async (threadId: string): Promise<{ success: boolean; upvotes: number }> => {
    try {
        const response = await axios.patch(`${API_URL}/api/community/threads/${threadId}/upvote`, {}, {
            headers: getAuthHeaders()
        });
        return { success: response.data.success, upvotes: response.data.upvotes };
    } catch (error) {
        console.error('Error upvoting thread:', error);
        return { success: false, upvotes: 0 };
    }
};

export const upvotePost = async (postId: string): Promise<{ success: boolean; upvotes: number }> => {
    try {
        const response = await axios.patch(`${API_URL}/api/community/posts/${postId}/upvote`, {}, {
            headers: getAuthHeaders()
        });
        return { success: response.data.success, upvotes: response.data.upvotes };
    } catch (error) {
        console.error('Error upvoting post:', error);
        return { success: false, upvotes: 0 };
    }
};

export const markBestAnswer = async (postId: string): Promise<boolean> => {
    try {
        const response = await axios.patch(`${API_URL}/api/community/posts/${postId}/best-answer`, {}, {
            headers: getAuthHeaders()
        });
        return response.data.success;
    } catch (error) {
        console.error('Error marking best answer:', error);
        return false;
    }
};

export const joinCommunity = () => {
    if (socket) socket.emit('join-community');
};

export const onCommunityUpdate = (type: 'threads' | 'posts' | 'typing', callback: (data: any) => void) => {
    if (!socket) return () => { };

    let event = '';
    if (type === 'threads') event = 'update-threads';
    else if (type === 'posts') event = 'update-posts';
    else if (type === 'typing') event = 'update-typing';

    socket.on(event, callback);
    return () => socket?.off(event, callback);
};

export const emitNewThread = (thread: any) => {
    if (socket) socket.emit('new-thread', thread);
};

export const emitNewPost = (data: { threadId: string; post: any }) => {
    if (socket) socket.emit('new-post', data);
};

export const emitCommunityTyping = (userName: string, userId: string) => {
    if (socket) socket.emit('typing-community', { userName, userId });
};

export const sendTyping = (roomId: string, userName: string) => {
    if (socket) socket.emit('typing', { roomId, userName });
};

export const onTyping = (callback: (data: { userName: string }) => void) => {
    if (!socket) return () => { };
    socket.on('user-typing', callback);
    return () => socket?.off('user-typing', callback);
};
