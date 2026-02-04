import { GeminiRequest, GeminiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_BASE_URL || '';

// --- AI TUTOR SERVICE ---
export const streamChat = async (message: string, base64Data?: string, mimeType?: string): Promise<ReadableStream<Uint8Array> | null> => {
    const requestBody: GeminiRequest = { message, base64Data, mimeType };
    const response = await fetch(`${API_URL}/api/gemini/streamChat`, {
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
    const response = await fetch(`${API_URL}/api/gemini/streamStudyBuddyChat`, {
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
    const response = await fetch(`${API_URL}/api/gemini/generateImage`, {
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
    const response = await fetch(`${API_URL}/api/gemini/summarizeText`, {
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
    const response = await fetch(`${API_URL}/api/gemini/summarizeAudioFromBase64`, {
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
    const response = await fetch(`${API_URL}/api/gemini/generateCode`, {
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
    const response = await fetch(`${API_URL}/api/gemini/extractTextFromFile`, {
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
    const response = await fetch(`${API_URL}/api/gemini/generateQuizQuestion`, {
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

export const generateQuizSet = async (context: string, count: number = 5): Promise<string> => {
    const requestBody: GeminiRequest = { context, count };
    const response = await fetch(`${API_URL}/api/gemini/generateQuizSet`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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
    const response = await fetch(`${API_URL}/api/gemini/generateFlashcards`, {
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
    console.log(`Getting AI suggestion for mood: ${mood} `);

    try {
        const requestBody: GeminiRequest = { mood };
        const response = await fetch(`${API_URL}/api/gemini/getSuggestionForMood`, {
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
    const response = await fetch(`${API_URL}/api/gemini/breakDownGoal`, {
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
    return data.breakdown;
};

// --- PROJECT IDEA GENERATOR SERVICE ---
export const generateProjectIdeas = async (branch: string, interest: string, difficulty: string): Promise<string> => {
    const requestBody: GeminiRequest = { branch, interest, difficulty };
    // Enhanced prompt handled in backend, passing context in request potentially?
    // Actually, let's update the backend prompt in gemini.js instead as that's where the prompt is constructed.
    // But for this service, we just pass the params.
    // Wait, I should verify backend/routes/gemini.js for the prompt update.
    // Let's assume I will update the backend route.

    const response = await fetch(`${API_URL}/api/gemini/generateProjectIdeas`, {
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
    if (!data.ideas) {
        throw new Error('Project ideas not found in response');
    }
    return data.ideas;
};

// --- MOCK PAPER GENERATOR SERVICE ---
export const generateMockPaper = async (branch: string, subject: string, year: string): Promise<any> => {
    const requestBody: GeminiRequest = { branch, subject, year };
    const response = await fetch(`${API_URL}/api/gemini/generateMockPaper`, {
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
    if (!data.paper) {
        throw new Error('Question paper not found in response');
    }
    return data.paper;
};

// --- VIVA SIMULATOR SERVICE ---
export const streamVivaChat = async (message: string, subject: string, branch: string, persona: string): Promise<ReadableStream<Uint8Array> | null> => {
    const requestBody: GeminiRequest = { message, subject, branch, persona };
    const response = await fetch(`${API_URL}/api/gemini/streamVivaChat`, {
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

// --- STUDY PLAN GENERATION SERVICE ---
export const generateStudyPlan = async (goal: string, timeframe: string, level: string, subjects: string[]): Promise<any> => {
    const token = localStorage.getItem('token');

    /* 
       Note: The backend expects { goal, durationDays, notesContext }.
       We map the UI parameters to these fields.
       - timeframe -> durationDays (passed as string, prompt handles it)
       - level + subjects -> notesContext
    */
    const notesContext = `Student Level: ${level}. Topics to cover: ${subjects.join(', ')}.`;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/study-plan/generate`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            goal,
            durationDays: timeframe,
            notesContext
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    try {
        // The backend returns a JSON string in 'planJson', so we must parse it
        return JSON.parse(data.planJson);
    } catch (e) {
        console.error("Failed to parse generated study plan JSON:", e);
        throw new Error("Received invalid JSON format from AI generation.");
    }
};
// --- FEYNMAN TECHNIQUE SERVICE ---
export const streamFeynmanChat = async (message: string, topic: string, notes: string): Promise<ReadableStream<Uint8Array> | null> => {
    const requestBody: GeminiRequest = { message, notes, topic };
    const response = await fetch(`${API_URL}/api/gemini/streamFeynmanChat`, {
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

export const getFeynmanFeedback = async (topic: string, explanation: string, notes: string): Promise<any> => {
    const response = await fetch(`${API_URL}/api/gemini/getFeynmanFeedback`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, explanation, notes }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};
