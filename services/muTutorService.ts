const API_URL = import.meta.env.VITE_API_BASE_URL || '';

export const ingestPaper = async (paperData: {
    text: string;
    subject: string;
    branch: string;
    semester: number;
    paperYear: number;
    paperType: 'May' | 'Dec' | 'KT';
    year: 'FE' | 'SE' | 'TE' | 'BE';
}): Promise<any> => {
    const response = await fetch(`${API_URL}/api/mu-tutor/ingestPaper`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paperData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to ingest paper');
    }

    return response.json();
};

export const predictTopics = async (subject: string): Promise<any> => {
    const response = await fetch(`${API_URL}/api/mu-tutor/predictTopics?subject=${encodeURIComponent(subject)}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to predict topics');
    }

    const data = await response.json();
    return data.prediction;
};

export const getLikelyQuestions = async (subject: string, module?: number): Promise<any> => {
    const url = new URL(`${API_URL}/api/mu-tutor/likelyQuestions`);
    url.searchParams.append('subject', subject);
    if (module) url.searchParams.append('module', module.toString());

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch likely questions');
    }

    const data = await response.json();
    return data.questions;
};
export const getSubjects = async (): Promise<string[]> => {
    const response = await fetch(`${API_URL}/api/mu-tutor/subjects`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch subjects');
    }
    const data = await response.json();
    return data.subjects;
};

export const getPaperYears = async (): Promise<number[]> => {
    const response = await fetch(`${API_URL}/api/mu-tutor/paper-years`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch years');
    }
    const data = await response.json();
    return data.years;
};

export const browsePapers = async (subject?: string, year?: number): Promise<any[]> => {
    const url = new URL(`${API_URL}/api/mu-tutor/browse`);
    if (subject) url.searchParams.append('subject', subject);
    if (year) url.searchParams.append('year', year.toString());

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to browse papers');
    }
    const data = await response.json();
    return data.papers;
};
