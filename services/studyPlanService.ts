import { type StudyPlan } from '../types';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

// Get auth token from localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getStudyPlan = async (courseId: string): Promise<StudyPlan | null> => {
    try {
        const response = await axios.get(`${API_URL}/api/study-plan/${courseId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching study plan:", error);
        return null;
    }
};

export const saveStudyPlan = async (plan: Omit<StudyPlan, 'id' | 'createdAt'>): Promise<StudyPlan | null> => {
    try {
        const response = await axios.post(`${API_URL}/api/study-plan`, plan, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        console.error("Error saving study plan:", error);
        return null;
    }
};

export const updateTaskCompletion = async (courseId: string, dayIndex: number, taskId: string, completed: boolean): Promise<StudyPlan | null> => {
    try {
        const response = await axios.patch(`${API_URL}/api/study-plan/task`,
            { courseId, dayIndex, taskId, completed },
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating task completion:", error);
        return null;
    }
};
