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
<<<<<<< Updated upstream
=======
    tutorials?: { title: string; link: string; type: string }[];
>>>>>>> Stashed changes
}

export interface SemesterData {
    semesterNumber: number;
    subjects: Subject[];
}

export const getCurriculum = async (branch: string, semester: number) => {
    try {
<<<<<<< Updated upstream
        const response = await axios.get(`${API_URL}/${encodeURIComponent(branch)}/${semester}`);
=======
        const response = await axios.get(`${API_URL}/${branch}/${semester}`);
>>>>>>> Stashed changes
        return response.data;
    } catch (error) {
        console.error('Error fetching curriculum:', error);
        throw error;
    }
};
<<<<<<< Updated upstream
=======

export const searchSubjects = async (query: string) => {
    try {
        const response = await axios.get(`${API_URL}/search`, { params: { query } });
        return response.data;
    } catch (error) {
        console.error('Error searching subjects:', error);
        throw error;
    }
};
>>>>>>> Stashed changes
