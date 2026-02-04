import axios from 'axios';
import { ChatMessage } from '../types';

export interface ChatSession {
    _id: string;
    userId: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
    lastUpdated: string;
}

export const getChatHistory = async (): Promise<ChatSession[]> => {
    const token = localStorage.getItem('token');
    const response = await axios.get('/api/ai-chat/history', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.sessions;
};

export const getChatSession = async (sessionId: string): Promise<ChatSession> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`/api/ai-chat/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.session;
};

export const createChatSession = async (title?: string, initialMessages?: ChatMessage[]): Promise<ChatSession> => {
    const token = localStorage.getItem('token');
    const response = await axios.post('/api/ai-chat/session', { title, initialMessages }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.session;
};

export const addMessageToSession = async (sessionId: string, messages: ChatMessage[]): Promise<void> => {
    const token = localStorage.getItem('token');
    await axios.post(`/api/ai-chat/session/${sessionId}/message`, { messages }, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
