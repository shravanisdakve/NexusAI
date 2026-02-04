import { GeminiRequest, GeminiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

// --- AI TUTOR SERVICE ---
export const streamChat = async (message: string, base64Data?: string, mimeType?: string, language?: string): Promise<ReadableStream<Uint8Array> | null> => {
    const requestBody: GeminiRequest = { message, base64Data, mimeType, language };
    const response = await fetch(`${API_URL}/api/gemini/streamChat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.body;
};


// --- STUDY BUDDY (NOTES-BASED) SERVICE ---
export const streamStudyBuddyChat = async (message: string, notes: string, language?: string): Promise<ReadableStream<Uint8Array> | null> => {
    const requestBody: GeminiRequest = { message, notes, language };
    const response = await fetch(`${API_URL}/api/gemini/streamStudyBuddyChat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.body;
};


// --- CONCEPT VISUALIZER SERVICE ---
export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    const requestBody: GeminiRequest = { prompt, aspectRatio };
    const response = await fetch(`${API_URL}/api/gemini/generateImage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    if (!data.image) {
        throw new Error('Image not found in response');
    }
    return data.image;
};

// --- NOTE SUMMARIZATION SERVICE ---
export const summarizeText = async (text: string): Promise<string> => {
    const requestBody: GeminiRequest = { text };
    const response = await fetch(`${API_URL}/api/gemini/summarizeText`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    if (!data.summary) {
        throw new Error('Summary not found in response');
    }
    return data.summary;
};

// --- AUDIO SUMMARIZATION SERVICE ---
export const summarizeAudioFromBase64 = async (base64Data: string, mimeType: string): Promise<string> => {
    const requestBody: GeminiRequest = { base64Data, mimeType };
    const response = await fetch(`${API_URL}/api/gemini/summarizeAudioFromBase64`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    if (!data.summary) {
        throw new Error('Summary not found in response');
    }
    return data.summary;
};

// --- CODE HELPER SERVICE ---
export const generateCode = async (prompt: string, language: string): Promise<string> => {
    const requestBody: GeminiRequest = { prompt, language };
    const response = await fetch(`${API_URL}/api/gemini/generateCode`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    if (!data.code) {
        throw new Error('Code not found in response');
    }
    return data.code;
};

// --- TEXT EXTRACTION FROM FILE SERVICE ---
export const extractTextFromFile = async (base64Data: string, mimeType: string): Promise<string> => {
    const requestBody: GeminiRequest = { base64Data, mimeType };
    const response = await fetch(`${API_URL}/api/gemini/extractTextFromFile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    if (!data.text) {
        throw new Error('Text not found in response');
    }
    return data.text;
};

// --- QUIZ GENERATION SERVICE ---
export const generateQuizQuestion = async (context: string, language?: string): Promise<string> => {
    const requestBody: GeminiRequest = { context, language };
    const response = await fetch(`${API_URL}/api/gemini/generateQuizQuestion`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    if (!data.question) {
        throw new Error('Question not found in response');
    }
    return data.question;
};

export const generateQuizSet = async (context: string, count: number = 5, language?: string): Promise<string> => {
    const requestBody: GeminiRequest = { context, count, language };
    const response = await fetch(`${API_URL}/api/gemini/generateQuizSet`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody), // 'count' is technically extra but handled by backend
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    if (!data.quizSet) {
        throw new Error('Quiz set not found in response');
    }
    return data.quizSet;
};

// --- AI STUDY SUGGESTIONS SERVICE ---
export const getStudySuggestions = async (reportJson: string): Promise<string> => {
    const requestBody: GeminiRequest = { reportJson };
    const response = await fetch(`${API_URL}/api/gemini/getStudySuggestions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    if (!data.suggestions) {
        throw new Error('Suggestions not found in response');
    }
    return data.suggestions;
};

// --- FLASHCARD GENERATION SERVICE ---
export const generateFlashcards = async (context: string, language?: string): Promise<string> => {
    const requestBody: GeminiRequest = { context, language };
    const response = await fetch(`${API_URL}/api/gemini/generateFlashcards`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    if (!data.flashcards) {
        throw new Error('Flashcards not found in response');
    }
    return data.flashcards;
};

export const getSuggestionForMood = async (mood: string): Promise<string> => {
    console.log(`Getting AI suggestion for mood: ${mood} `);

    try {
        const requestBody: GeminiRequest = { mood };
        const response = await fetch(`${API_URL}/api/gemini/getSuggestionForMood`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData: GeminiResponse = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data: GeminiResponse = await response.json();
        if (!data.suggestion) {
            throw new Error('Suggestion not found in response');
        }
        return data.suggestion;
    } catch (error) {
        console.error("Error in getSuggestionForMood:", error);
        return "Could not get an AI suggestion at this time.";
    }
};

// --- GOAL BREAKDOWN SERVICE ---
export const breakDownGoal = async (goalTitle: string): Promise<string> => {
    const requestBody: GeminiRequest = { goalTitle };
    const response = await fetch(`${API_URL}/api/gemini/breakDownGoal`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    return data.breakdown;
};

// --- PROJECT IDEA GENERATOR SERVICE ---
export const generateProjectIdeas = async (branch: string, interest: string, difficulty: string, language?: string): Promise<string> => {
    const requestBody: GeminiRequest = { branch, interest, difficulty, language };
    // Enhanced prompt handled in backend, passing context in request potentially?
    // Actually, let's update the backend prompt in gemini.js instead as that's where the prompt is constructed.
    // But for this service, we just pass the params.
    // Wait, I should verify backend/routes/gemini.js for the prompt update.
    // Let's assume I will update the backend route.

    const response = await fetch(`${API_URL}/api/gemini/generateProjectIdeas`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    if (!data.ideas) {
        throw new Error('Project ideas not found in response');
    }
    return data.ideas;
};

// --- MOCK PAPER GENERATOR SERVICE ---
export const generateMockPaper = async (branch: string, subject: string, year: string, language?: string): Promise<any> => {
    const requestBody: GeminiRequest = { branch, subject, year, language };
    const response = await fetch(`${API_URL}/api/gemini/generateMockPaper`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    if (!data.paper) {
        throw new Error('Question paper not found in response');
    }
    return data.paper;
};

// --- VIVA SIMULATOR SERVICE ---
export const streamVivaChat = async (message: string, subject: string, branch: string, persona: string, language?: string): Promise<ReadableStream<Uint8Array> | null> => {
    const requestBody: GeminiRequest = { message, subject, branch, persona, language };
    const response = await fetch(`${API_URL}/api/gemini/streamVivaChat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.body;
};

// --- STUDY PLAN GENERATION SERVICE ---
export const generateStudyPlan = async (goal: string, durationDays: number, notesContext: string, language?: string): Promise<string> => {
    const response = await fetch(`${API_URL}/api/study-plan/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ goal, durationDays, notesContext, language }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.planJson;
};
// --- FEYNMAN TECHNIQUE SERVICE ---
export const streamFeynmanChat = async (message: string, topic: string, notes: string, language?: string): Promise<ReadableStream<Uint8Array> | null> => {
    const requestBody: GeminiRequest = { message, notes, topic, language };
    const response = await fetch(`${API_URL}/api/gemini/streamFeynmanChat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.body;
};

export const getFeynmanFeedback = async (topic: string, explanation: string, notes: string, language?: string): Promise<any> => {
    const response = await fetch(`${API_URL}/api/gemini/getFeynmanFeedback`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ topic, explanation, notes, language }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};
