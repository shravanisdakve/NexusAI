
import { GeminiRequest, GeminiResponse } from '../types';

// --- AI TUTOR SERVICE ---
export const streamChat = async (message: string): Promise<ReadableStream<Uint8Array> | null> => {
    const requestBody: GeminiRequest = { message };
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/gemini/streamChat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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
export const streamStudyBuddyChat = async (message: string, notes: string): Promise<ReadableStream<Uint8Array> | null> => {
    const requestBody: GeminiRequest = { message, notes };
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/gemini/streamStudyBuddyChat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/gemini/generateImage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/gemini/summarizeText`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/gemini/summarizeAudioFromBase64`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/gemini/generateCode`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/gemini/extractTextFromFile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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
export const generateQuizQuestion = async (context: string): Promise<string> => {
    const requestBody: GeminiRequest = { context };
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/gemini/generateQuizQuestion`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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

// --- AI STUDY SUGGESTIONS SERVICE ---
export const getStudySuggestions = async (reportJson: string): Promise<string> => {
    const requestBody: GeminiRequest = { reportJson };
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/gemini/getStudySuggestions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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
export const generateFlashcards = async (context: string): Promise<string> => {
    const requestBody: GeminiRequest = { context };
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/gemini/generateFlashcards`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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
    console.log(`Getting AI suggestion for mood: ${mood}`);

    try {
        const requestBody: GeminiRequest = { mood };
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/gemini/getSuggestionForMood`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/gemini/breakDownGoal`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData: GeminiResponse = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    if (!data.breakdown) {
        throw new Error('Goal breakdown not found in response');
    }
    return data.breakdown;
};