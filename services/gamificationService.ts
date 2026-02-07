import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_BASE_URL || '') + '/api/gamification';

export interface UserStats {
    xp: number;
    level: number;
    streak: number;
    badges: string[];
    coins: number;
}

export const getUserStats = async () => {
    try {
        const token = localStorage.getItem('token');
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
        const response = await axios.get(`${API_URL}/stats`, config);
        return response.data;
    } catch (error) {
        console.error('Error fetching user stats:', error);
        // Fallback for demo
        return {
            success: true,
            stats: { xp: 0, level: 1, streak: 0, badges: [], coins: 0 }
        };
    }
};

export const awardXP = async (amount: number, reason: string) => {
    try {
        const token = localStorage.getItem('token');
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
        const response = await axios.post(`${API_URL}/award-xp`, { amount, reason }, config);
        return response.data;
    } catch (error) {
        console.error('Error awarding XP:', error);
        return { success: false };
    }
};

export const awardBadge = async (badgeName: string) => {
    try {
        const token = localStorage.getItem('token');
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
        const response = await axios.post(`${API_URL}/award-badge`, { badgeName }, config);
        return response.data;
    } catch (error) {
        console.error('Error awarding badge:', error);
        return { success: false };
    }
};

export const updateStreak = async () => {
    try {
        const token = localStorage.getItem('token');
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
        const response = await axios.post(`${API_URL}/update-streak`, {}, config);
        return response.data;
    } catch (error) {
        console.error('Error updating streak:', error);
        return { success: false };
    }
};
