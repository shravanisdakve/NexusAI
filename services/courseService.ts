import { type Course } from '../types';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

// Get auth token from localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

let coursesCache: Course[] | null = null;
let lastFetchTime = 0;
let pendingPromise: Promise<Course[]> | null = null;
const CACHE_STALE_TIME = 5000; // 5 seconds cache

export const getCourses = async (forceRefresh = false): Promise<Course[]> => {
    const now = Date.now();
    
    // If not a forced refresh and we have valid cache, return it
    if (!forceRefresh && coursesCache && (now - lastFetchTime < CACHE_STALE_TIME)) {
        return coursesCache;
    }

    // If a request is already in progress, return the pending promise instead of starting a new one
    if (pendingPromise) {
        return pendingPromise;
    }

    // Start a new request
    pendingPromise = (async () => {
        console.log("[courseService] Fetching courses from MongoDB backend");
        try {
            const response = await axios.get(`${API_URL}/api/courses`, {
                headers: getAuthHeaders()
            });

            if (response.data.success) {
                console.log(`[courseService] Successfully fetched ${response.data.courses.length} courses`);
                coursesCache = response.data.courses;
                lastFetchTime = Date.now();
                return coursesCache || [];
            }

            console.error("[courseService] API returned success: false");
            return [];
        } catch (error) {
            console.error("[courseService] Error fetching courses from backend:", error);
            return [];
        } finally {
            // Clear the pending promise when the request completes (success or failure)
            pendingPromise = null;
        }
    })();

    return pendingPromise;
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

export const importCurriculumSubjects = async (branch: string, semester: number): Promise<Course[]> => {
    try {
        console.log(`[courseService] Importing subjects for ${branch} Sem ${semester}`);
        const response = await axios.get(`${API_URL}/api/curriculum/${encodeURIComponent(branch)}/${semester}`, {
            headers: getAuthHeaders()
        });

        if (response.data.success && response.data.curriculum?.subjects) {
            const subjects = response.data.curriculum.subjects;
            const existingCourses = await getCourses(true);
            const addedCourses: Course[] = [];

            for (const subject of subjects) {
                const alreadyExists = existingCourses.some(c => 
                    c.name.toLowerCase() === subject.name.toLowerCase()
                );

                if (!alreadyExists) {
                    try {
                        const newCourse = await addCourse(subject.name);
                        if (newCourse) addedCourses.push(newCourse);
                    } catch (e) {
                        console.warn(`[courseService] Failed to add subject ${subject.name}:`, e);
                    }
                }
            }
            return addedCourses;
        }
        return [];
    } catch (error) {
        console.error("[courseService] Error importing curriculum subjects:", error);
        throw error;
    }
};
