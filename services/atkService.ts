import axios from 'axios';

const API_URL = '/api/atkt';

export interface SubjectMarks {
    name: string;
    obtainedMarks: number;
    passingMarks: number;
    distinctionMarks: number;
    status: 'Pass' | 'Fail';
}

export interface GraceReport {
    ordinance5042A: { eligible: boolean; marksRecommended: number; details: string };
    ordinance5044A: { eligible: boolean; marksRecommended: number; details: string };
    ordinance229A: { eligible: boolean; marksRecommended: number };
}

export const calculateGrace = async (subjects: SubjectMarks[], totalAggregate: number, extracurriculars: boolean) => {
    try {
        const response = await axios.post(`${API_URL}/calculate-grace`, {
            subjects,
            totalAggregate,
            extracurriculars
        });
        return response.data;
    } catch (error) {
        console.error('Error calculating grace:', error);
        throw error;
    }
};

export const checkProgression = async (currentSemester: number, cumulativeCredits: number) => {
    try {
        const response = await axios.post(`${API_URL}/progression-check`, {
            currentSemester,
            cumulativeCredits
        });
        return response.data;
    } catch (error) {
        console.error('Error checking progression:', error);
        throw error;
    }
};
