import { type Mood } from '../types';

export type ToolKey =
    | 'tutor'
    | 'summaries'
    | 'quizzes'
    | 'gpa'
    | 'project'
    | 'curriculum'
    | 'placement'
    | 'kt'
    | 'paper'
    | 'viva'
    | 'study-plan'
    | 'math';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

const TOOL_USAGE_KEY = 'nexus_tool_usage';
const MOOD_HISTORY_KEY = 'nexus_mood_history';
const QUICK_ACCESS_KEY = 'nexus_quick_access_tools';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const safeReadObject = (key: string): Record<string, any> => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return {};
        return JSON.parse(raw);
    } catch {
        return {};
    }
};

const safeWrite = (key: string, value: unknown) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Failed writing ${key}:`, error);
    }
};

const syncPreferences = async (payload: { quickAccessTools?: string[] }) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        await fetch(`${API_URL}/api/personalization/preferences`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(payload),
        });
    } catch (error) {
        console.error('Failed syncing preferences:', error);
    }
};

export const hydratePersonalizationFromServer = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/api/personalization/profile`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) return;

        const payload = await response.json();
        const data = payload?.data;
        if (!data) return;

        if (data.toolUsageCounters && typeof data.toolUsageCounters === 'object') {
            safeWrite(TOOL_USAGE_KEY, data.toolUsageCounters);
        }
        if (Array.isArray(data.quickAccessTools)) {
            safeWrite(QUICK_ACCESS_KEY, data.quickAccessTools);
        }
    } catch (error) {
        console.error('Failed hydrating personalization:', error);
    }
};

export const getPersonalizationRecommendations = async (): Promise<{
    recommendedTools: string[];
    weakTopics: Array<{ topic: string; accuracy: number }>;
    latestPlacement: {
        simulatorSlug: string;
        accuracy: number;
        readinessBand: string;
        focusAreas: string[];
        attemptedAt: string;
    } | null;
    mostUsedTool: string | null;
} | null> => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/api/personalization/recommendations`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) return null;

        const payload = await response.json();
        return payload?.data || null;
    } catch (error) {
        console.error('Failed fetching personalization recommendations:', error);
        return null;
    }
};

export const trackToolUsage = async (tool: ToolKey) => {
    try {
        const usage = safeReadObject(TOOL_USAGE_KEY);
        usage[tool] = Number(usage[tool] || 0) + 1;
        safeWrite(TOOL_USAGE_KEY, usage);
    } catch (error) {
        console.error('Error tracking tool usage:', error);
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        await fetch(`${API_URL}/api/personalization/tool-usage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify({ toolKey: tool }),
        });
    } catch (error) {
        console.error('Error syncing tool usage:', error);
    }
};

export const getMostUsedTool = async (): Promise<string | null> => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${API_URL}/api/personalization/profile`, {
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const payload = await response.json();
                const serverTool = payload?.data?.mostUsedTool;
                if (serverTool) return serverTool;
            }
        } catch (error) {
            console.error('Error fetching most used tool from backend:', error);
        }
    }

    try {
        const usage = safeReadObject(TOOL_USAGE_KEY);
        const entries = Object.entries(usage)
            .filter(([, count]) => Number(count) > 0)
            .sort((a, b) => Number(b[1]) - Number(a[1]));
        return entries.length > 0 ? entries[0][0] : null;
    } catch (error) {
        console.error('Error getting most used tool:', error);
        return null;
    }
};

export const recordMood = async (mood: Omit<Mood, 'timestamp'>) => {
    try {
        const moods = safeReadObject(MOOD_HISTORY_KEY);
        const list = Array.isArray(moods) ? moods : [];
        list.push({ ...mood, timestamp: Date.now() });
        safeWrite(MOOD_HISTORY_KEY, list);
    } catch (error) {
        console.error('Error recording mood:', error);
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        await fetch(`${API_URL}/api/personalization/mood`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
            },
            body: JSON.stringify(mood),
        });
    } catch (error) {
        console.error('Error syncing mood:', error);
    }
};

export const getTimeOfDayGreeting = (language: 'en' | 'mr' | 'hi' = 'en'): string => {
    const hour = new Date().getHours();
    const slot = hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'evening';

    if (language === 'mr') {
        if (slot === 'morning') return 'Shubh sakal';
        if (slot === 'afternoon') return 'Shubh dupar';
        return 'Shubh sandhya';
    }

    if (language === 'hi') {
        if (slot === 'morning') return 'Shubh prabhat';
        if (slot === 'afternoon') return 'Shubh dopahar';
        return 'Shubh sandhya';
    }

    if (slot === 'morning') return 'Good morning';
    if (slot === 'afternoon') return 'Good afternoon';
    return 'Good evening';
};

const breakActivities = [
    'Time for a quick stretch! Reach for the sky.',
    'Hydration check! Grab a glass of water.',
    'Look at something 20 feet away for 20 seconds to rest your eyes.',
    'Stand up and walk around for a minute.',
    'Tidy up one small thing on your desk.',
    'Take a few deep breaths. Inhale, exhale.',
];

export const getBreakActivitySuggestion = (): string => {
    const randomIndex = Math.floor(Math.random() * breakActivities.length);
    return breakActivities[randomIndex];
};

export const getQuickAccessTools = (): string[] => {
    try {
        const raw = localStorage.getItem(QUICK_ACCESS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Error getting quick access tools:', error);
        return [];
    }
};

export const addToQuickAccess = (toolKey: string): string[] => {
    try {
        const current = getQuickAccessTools();
        if (current.includes(toolKey)) return current;

        const updated = [...current, toolKey];
        safeWrite(QUICK_ACCESS_KEY, updated);
        syncPreferences({ quickAccessTools: updated });
        return updated;
    } catch (error) {
        console.error('Error adding to quick access:', error);
        return [];
    }
};

export const removeFromQuickAccess = (toolKey: string): string[] => {
    try {
        const updated = getQuickAccessTools().filter((key) => key !== toolKey);
        safeWrite(QUICK_ACCESS_KEY, updated);
        syncPreferences({ quickAccessTools: updated });
        return updated;
    } catch (error) {
        console.error('Error removing from quick access:', error);
        return [];
    }
};

export const isInQuickAccess = (toolKey: string): boolean =>
    getQuickAccessTools().includes(toolKey);
