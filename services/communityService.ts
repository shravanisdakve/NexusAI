import { type StudyRoom, type ChatMessage, type Quiz, type Thread, type Post } from '../types';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { getResources } from './resourceService';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
// Socket URL is same as API URL usually, but can be different in production
const SOCKET_URL = API_URL;

let socket: Socket | null = null;

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const getUserId = () => {
    // Helper to get ID from token or context (simplified)
    // Actually we should get this from AuthContext or decode token, 
    // but for now we'll pass it in function args or rely on server auth middleware.
    // For socket messages, we need to send userID explicitly.
    // Let's assume the caller handles user info for now.
    return '';
}

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
        if (response.data.success) {
            return response.data.rooms;
        }
        return [];
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return [];
    }
};

export const getRoom = async (id: string): Promise<StudyRoom | null> => {
    // For now, we fetch all and find one, or we can add a specific endpoint later
    const rooms = await getRooms();
    return rooms.find(r => r.id === id) || null;
};

export const addRoom = async (name: string, courseId: string, maxUsers: number, createdBy: any, university?: string, technique?: string, topic?: string): Promise<StudyRoom | null> => {
    try {
        const response = await axios.post(`${API_URL}/api/community/rooms`, {
            name, courseId, maxUsers, technique, topic
        }, {
            headers: getAuthHeaders()
        });

        if (response.data.success) {
            return response.data.room;
        }
        return null;
    } catch (error) {
        console.error("Error creating room:", error);
        return null;
    }
};

// --- Socket Events Wrappers ---

export const joinRoom = (roomId: string, user?: any) => {
    if (socket) {
        socket.emit('join-room', roomId);
    }
};

export const leaveRoom = (roomId: string) => {
    // Socket.io handles leave automatically on disconnect, or we can emit 'leave-room'
    // For now, just client side cleanup
};

// --- Message Management ---

export const getRoomMessages = async (roomId: string): Promise<ChatMessage[]> => {
    try {
        const response = await axios.get(`${API_URL}/api/community/rooms/${roomId}/messages`, {
            headers: getAuthHeaders()
        });

        if (response.data.success) {
            return response.data.messages.map((msg: any) => ({
                id: msg.id,
                text: msg.text,
                sender: msg.sender,
                isUser: msg.isUser,
                timestamp: new Date(msg.timestamp).getTime()
            })); // Map to ChatMessage type
        }
        return [];
    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
};

export const sendChatMessage = async (roomId: string, message: any) => {
    if (socket) {
        socket.emit('send-message', {
            roomId,
            userId: message.userId,
            email: message.email,
            senderName: message.sender,
            content: message.text
        });
    }
};

export const onMessagesUpdate = (roomId: string, callback: (messages: ChatMessage[]) => void) => {
    if (!socket) return () => { };

    const messageHandler = (msg: any) => {
        // We receive a single message, but the callback expects an array usually?
        // Or we can modify the callback to accept one.
        // Actually, existing code expects a full list or we handle state update in component.
        // Let's assume the component will append the new message.
        // Wait, typical use is: `setMessages(prev => [...prev, newMessage])`
        // But the signature here is `callback(messages[])`.

        // Strategy: The component should listen to 'receive-message' directly via socket?
        // Or we bridge it here.
        // Given existing architecture, let's expose specific listener.
    };

    // This function signature is legacy Firebase (snapshot).
    // It's better to let the COMPONENT subscribe to socket events.
    // For now, we'll return a cleanup function.
    return () => { };
};

// --- Helper to subscribe to socket messages in Component ---
export const subscribeToMessages = (callback: (msg: any) => void) => {
    if (!socket) return () => { };
    socket.on('receive-message', callback);
    return () => socket?.off('receive-message', callback);
};

// --- Helper for Whiteboard ---
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

// --- Legacy stubs to prevent crashing ---
// --- Legacy stubs to prevent crashing ---
export const saveRoomMessages = async (roomId: string, messages: any[]) => { };
export const getRoomAINotes = async (roomId: string) => '';
export const saveRoomAINotes = async (roomId: string, content: string) => { };
export const onRoomUpdate = (roomId: string, callback: any) => { return () => { } };
export const onNotesUpdate = (roomId: string, callback: any) => { return () => { } };
export const saveUserNotes = async (roomId: string, userId: string, content: string) => { };
export const onUserNotesUpdate = (roomId: string, userId: string, callback: any) => { return () => { } };
export const deleteResource = async (roomId: string, fileName: string) => { };
export const uploadResource = async (roomId: string, file: any, metadata: any) => { };
export const getRoomResources = async (courseName: string) => {
    try {
        const resources = await getResources({ subject: courseName });
        return resources;
    } catch (e) {
        console.error("Error fetching room resources:", e);
        return [];
    }
};

export const onResourcesUpdate = (courseName: string, callback: any) => {
    // For now, since we don't have a real subscription, just fetch once and call callback
    getRoomResources(courseName).then(callback);
    return () => { };
};
export const onQuizUpdate = (roomId: string, callback: any) => { return () => { } };
export const saveQuiz = async (roomId: string, quiz: any) => { };
export const saveQuizAnswer = async (roomId: string, userId: string, userName: string, index: number) => { };
export const clearQuiz = async (roomId: string) => { };

// --- Q&A FORUM SERVICES ---

export const getThreads = async (courseId: string): Promise<Thread[]> => {
    try {
        const response = await axios.get(`${API_URL}/api/community/courses/${courseId}/threads`, {
            headers: getAuthHeaders()
        });
        return response.data.success ? response.data.threads : [];
    } catch (error) {
        console.error("Error fetching threads:", error);
        return [];
    }
};

export const createThread = async (data: { courseId: string, title: string, content: string, category: string, pyqTag?: string }): Promise<Thread | null> => {
    try {
        const response = await axios.post(`${API_URL}/api/community/threads`, data, {
            headers: getAuthHeaders()
        });
        return response.data.success ? response.data.thread : null;
    } catch (error) {
        console.error("Error creating thread:", error);
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
        console.error("Error fetching posts:", error);
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
        console.error("Error creating post:", error);
        return null;
    }
};

export const upvoteThread = async (threadId: string): Promise<{ success: boolean, upvotes: number }> => {
    try {
        const response = await axios.patch(`${API_URL}/api/community/threads/${threadId}/upvote`, {}, {
            headers: getAuthHeaders()
        });
        return { success: response.data.success, upvotes: response.data.upvotes };
    } catch (error) {
        console.error("Error upvoting thread:", error);
        return { success: false, upvotes: 0 };
    }
};

export const upvotePost = async (postId: string): Promise<{ success: boolean, upvotes: number }> => {
    try {
        const response = await axios.patch(`${API_URL}/api/community/posts/${postId}/upvote`, {}, {
            headers: getAuthHeaders()
        });
        return { success: response.data.success, upvotes: response.data.upvotes };
    } catch (error) {
        console.error("Error upvoting post:", error);
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
        console.error("Error marking best answer:", error);
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

export const emitNewPost = (data: { threadId: string, post: any }) => {
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
