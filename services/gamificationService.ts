import axios from 'axios';

const API_URL = '/api/gamification';

export interface UserStats {
    xp: number;
    level: number;
    streak: number;
    badges: string[];
    coins: number;
}

export const getUserStats = async () => {
    try {
        const response = await axios.get(`${API_URL}/stats`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user stats:', error);
        // Fallback for demo
        return {
            success: true,
            stats: { xp: 1250, level: 5, streak: 7, badges: ['early-bird', 'math-wizard'], coins: 450 }
        };
    }
};

export const awardXP = async (amount: number, reason: string) => {
    try {
        const response = await axios.post(`${API_URL}/award-xp`, { amount, reason });
        return response.data;
    } catch (error) {
        console.error('Error awarding XP:', error);
        return { success: false };
    }
};
