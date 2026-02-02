import { type Goal } from '../types';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getGoals = async (): Promise<Goal[]> => {
    try {
        const response = await axios.get(`${API_URL}/api/goals`, {
            headers: getAuthHeaders()
        });
        if (response.data.success) {
            return response.data.goals;
        }
        return [];
    } catch (error) {
        console.error("[goalService] Error fetching goals:", error);
        return [];
    }
};

export const addGoal = async (goal: Omit<Goal, 'id' | 'userId'>): Promise<Goal | null> => {
    try {
        const response = await axios.post(`${API_URL}/api/goals`, goal, {
            headers: getAuthHeaders()
        });
        if (response.data.success) {
            return response.data.goal;
        }
        return null;
    } catch (error) {
        console.error("[goalService] Error adding goal:", error);
        return null;
    }
};

export const updateGoal = async (id: string, updates: Partial<Omit<Goal, 'id' | 'userId'>>): Promise<void> => {
    try {
        await axios.put(`${API_URL}/api/goals/${id}`, updates, {
            headers: getAuthHeaders()
        });
    } catch (error) {
        console.error(`[goalService] Error updating goal ${id}:`, error);
        throw error;
    }
};

export const deleteGoal = async (id: string): Promise<void> => {
    try {
        await axios.delete(`${API_URL}/api/goals/${id}`, {
            headers: getAuthHeaders()
        });
    } catch (error) {
        console.error(`[goalService] Error deleting goal ${id}:`, error);
        throw error;
    }
};