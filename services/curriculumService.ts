import axios from 'axios';

const API_URL = '/api/curriculum';

export interface Module {
    moduleNumber: number;
    title: string;
    topics: string[];
    technicalRequirements?: string;
    pedagogyFocus?: string;
    weightage?: number;
}

export interface Subject {
    subjectCode: string;
    name: string;
    credits: number;
    modules: Module[];
    category: string;
    tutorials?: { title: string; link: string; type: string }[];
}

export interface SemesterData {
    semesterNumber: number;
    subjects: Subject[];
}

export const getCurriculum = async (branch: string, semester: number) => {
    try {
        const response = await axios.get(`${API_URL}/${encodeURIComponent(branch)}/${semester}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching curriculum:', error);
        throw error;
    }
};

export const searchSubjects = async (query: string) => {
    try {
        const response = await axios.get(`${API_URL}/search`, { params: { query } });
        return response.data;
    } catch (error) {
        console.error('Error searching subjects:', error);
        throw error;
    }
};
