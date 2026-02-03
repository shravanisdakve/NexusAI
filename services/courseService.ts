import { type Course } from '../types';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

// Get auth token from localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getCourses = async (): Promise<Course[]> => {
    console.log("[courseService] Fetching courses from MongoDB backend");
    try {
        const response = await axios.get(`${API_URL}/api/courses`, {
            headers: getAuthHeaders()
        });

        if (response.data.success) {
            console.log(`[courseService] Successfully fetched ${response.data.courses.length} courses`);
            return response.data.courses;
        }

        console.error("[courseService] API returned success: false");
        return [];
    } catch (error) {
        console.error("[courseService] Error fetching courses from backend:", error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            console.error("[courseService] Unauthorized - user may not be logged in");
        }
        return [];
    }
};

export const getCourse = async (id: string): Promise<Course | null> => {
    console.log(`[courseService] Fetching course with id: ${id}`);
    try {
        const response = await axios.get(`${API_URL}/api/courses/${id}`, {
            headers: getAuthHeaders()
        });

        if (response.data.success) {
            return response.data.course;
        }
        return null;
    } catch (error) {
        console.error(`[courseService] Error fetching course ${id}:`, error);
        return null;
    }
};

export const addCourse = async (name: string): Promise<Course | null> => {
    if (!name || name.trim() === '') {
        const errorMsg = "[courseService] Course name cannot be empty";
        console.error(errorMsg);
        throw new Error("Course name cannot be empty");
    }

    console.log(`[courseService] Attempting to add course: "${name}"`);
    try {
        const response = await axios.post(
            `${API_URL}/api/courses`,
            { name: name.trim() },
            { headers: getAuthHeaders() }
        );

        if (response.data.success) {
            console.log(`[courseService] Successfully added course with ID: ${response.data.course.id}`);
            return response.data.course;
        }

        throw new Error(response.data.message || "Failed to add course");
    } catch (error) {
        console.error("[courseService] Error in addCourse:", error);

        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                throw new Error("You must be logged in to add courses");
            }
            throw new Error(error.response?.data?.message || "Failed to add course");
        }

        throw error;
    }
};

export const updateCourse = async (id: string, updates: Partial<Course>): Promise<Course | null> => {
    console.log(`[courseService] Updating course ${id}`);
    try {
        const response = await axios.put(
            `${API_URL}/api/courses/${id}`,
            updates,
            { headers: getAuthHeaders() }
        );

        if (response.data.success) {
            return response.data.course;
        }
        return null;
    } catch (error) {
        console.error(`[courseService] Error updating course ${id}:`, error);
        throw error;
    }
};

export const deleteCourse = async (id: string): Promise<void> => {
    console.log("[courseService] Deleting course:", id);
    try {
        await axios.delete(`${API_URL}/api/courses/${id}`, {
            headers: getAuthHeaders()
        });
    } catch (error) {
        console.error(`[courseService] Error deleting course ${id}:`, error);
        throw error;
    }
};
