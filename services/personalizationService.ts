import { type Mood } from '../types';

export type ToolKey = 'tutor' | 'visualizer' | 'summarizer' | 'code-helper' | 'study-room';

const TOOL_USAGE_KEY = 'nexus_tool_usage';
const MOOD_HISTORY_KEY = 'nexus_mood_history';

export const trackToolUsage = async (tool: ToolKey) => {
    try {
        const stored = localStorage.getItem(TOOL_USAGE_KEY);
        const usage = stored ? JSON.parse(stored) : {};
        usage[tool] = (usage[tool] || 0) + 1;
        localStorage.setItem(TOOL_USAGE_KEY, JSON.stringify(usage));
    } catch (error) {
        console.error("Error tracking tool usage:", error);
    }
};

export const getMostUsedTool = async (): Promise<string | null> => {
    try {
        const stored = localStorage.getItem(TOOL_USAGE_KEY);
        if (!stored) return null;

        const usage: Record<string, number> = JSON.parse(stored);
        const totalUsage = Object.values(usage).reduce((sum, count) => sum + count, 0);

        if (totalUsage < 3) return null;

        const sortedTools = Object.entries(usage).sort((a, b) => b[1] - a[1]);

        if (sortedTools.length > 0 && sortedTools[0][1] > 0) {
            return sortedTools[0][0];
        }
    } catch (error) {
        console.error("Error getting most used tool:", error);
    }
    return null;
};

export const recordMood = async (mood: Omit<Mood, 'timestamp'>) => {
    try {
        const stored = localStorage.getItem(MOOD_HISTORY_KEY);
        const moods = stored ? JSON.parse(stored) : [];
        const newMood = { ...mood, timestamp: new Date() };
        moods.push(newMood);
        localStorage.setItem(MOOD_HISTORY_KEY, JSON.stringify(moods));
    } catch (error) {
        console.error("Error recording mood:", error);
    }
};

// These functions are simple and don't require backend interaction, so they remain the same.
export const getTimeOfDayGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
        return "Good morning";
    }
    if (hour >= 12 && hour < 18) {
        return "Good afternoon";
    }
    return "Good evening";
};

const breakActivities = [
    "Time for a quick stretch! Reach for the sky.",
    "Hydration check! Grab a glass of water.",
    "Look at something 20 feet away for 20 seconds to rest your eyes.",
    "Stand up and walk around for a minute.",
    "Tidy up one small thing on your desk.",
    "Take a few deep breaths. Inhale, exhale.",
];

export const getBreakActivitySuggestion = (): string => {
    const randomIndex = Math.floor(Math.random() * breakActivities.length);
    return breakActivities[randomIndex];
};