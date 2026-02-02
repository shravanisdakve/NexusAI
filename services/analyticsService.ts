import { type LeaderboardEntry } from '../types';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- Session Tracking ---
// For now, we'll just track the start time locally and send the duration when ending.
let sessionStartTime: number | null = null;
let currentTool: string | null = null;

export const startSession = async (tool: string, courseId: string | null = null): Promise<string | null> => {
    sessionStartTime = Date.now();
    currentTool = tool;
    return "local-session";
};

export const endSession = async (sessionId: string | null) => {
    if (!sessionId || !sessionStartTime) return;

    // Check if token exists before trying (service function doesn't need to return anything)
    if (!localStorage.getItem('token')) return;

    const duration = Math.round((Date.now() - sessionStartTime) / 1000); // in seconds

    try {
        await axios.post(`${API_URL}/api/analytics/session`, {
            type: 'study_session',
            duration,
            description: `Studied using ${currentTool}`
        }, { headers: getAuthHeaders() });
    } catch (error) {
        console.error("Error ending session:", error);
    }

    sessionStartTime = null;
    currentTool = null;
};

// --- Pomodoro Tracking ---
export const recordPomodoroCycle = async () => {
    if (!localStorage.getItem('token')) return;

    try {
        await axios.post(`${API_URL}/api/analytics/session`, {
            type: 'pomodoro',
            duration: 25 * 60, // 25 minutes
            description: 'Completed Pomodoro Cycle'
        }, { headers: getAuthHeaders() });
    } catch (error) {
        console.error("Error logging pomodoro:", error);
    }
};

// --- Quiz Tracking ---
export const recordQuizResult = async (topic: string, correct: boolean, courseId: string | null = null) => {
    if (!localStorage.getItem('token')) return;

    try {
        await axios.post(`${API_URL}/api/analytics/quiz`, {
            topic,
            isCorrect: correct,
            score: correct ? 100 : 0
        }, { headers: getAuthHeaders() });
    } catch (error) {
        console.error("Error logging quiz:", error);
    }
};

// --- Data Retrieval for UI ---
export const getProductivityReport = async (courseId: string | null = null) => {
    if (!localStorage.getItem('token')) return getEmptyReport();

    try {
        const response = await axios.get(`${API_URL}/api/analytics`, {
            headers: getAuthHeaders()
        });

        // Backend now returns { success: true, data: { ... } }
        const data = response.data.success ? response.data.data : response.data;

        if (!data) return getEmptyReport();

        // Transform UserProgress model to expected report format
        // We need to calculate strengths and weaknesses from topicMastery

        const strengths = (data.topicMastery || [])
            .filter((t: any) => t.accuracy >= 70)
            .sort((a: any, b: any) => b.accuracy - a.accuracy)
            .slice(0, 3)
            .map((t: any) => ({ topic: t.topic, accuracy: t.accuracy, count: t.attempts }));

        const weaknesses = (data.topicMastery || [])
            .filter((t: any) => t.accuracy < 70)
            .sort((a: any, b: any) => a.accuracy - b.accuracy)
            .slice(0, 3)
            .map((t: any) => ({ topic: t.topic, accuracy: t.accuracy, count: t.attempts }));

        return {
            totalStudyTime: data.totalStudyTime || 0,
            quizAccuracy: 0, // Calculated globally if needed, or per topic
            totalQuizzes: data.quizzesTaken || 0,
            correctQuizzes: 0, // Not stored primarily
            strengths,
            weaknesses,
            completedPomodoros: data.pomodoroSessions || 0,
            sessions: [] // Can be filled from recentActivity if needed
        };

    } catch (error) {
        console.error("Error fetching productivity report:", error);
        return getEmptyReport();
    }
};

const getEmptyReport = () => ({
    totalStudyTime: 0, quizAccuracy: 0, totalQuizzes: 0, correctQuizzes: 0,
    strengths: [], weaknesses: [], completedPomodoros: 0, sessions: []
});

export const getLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
    // Phase 3 TODO
    return [];
};
