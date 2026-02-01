const express = require('express');
const { GoogleGenAI, Type } = require('@google/genai');
const router = express.Router();

// Initialize Gemini with API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- AI TUTOR SERVICE ---
router.post('/streamChat', async (req, res) => {
    try {
        const { message } = req.body;
        const chat = ai.chats.create({
            model: 'gemini-1.0-pro',
            config: {
                systemInstruction: 'You are an expert AI Tutor. Your goal is to help users understand complex topics by providing clear explanations, step-by-step examples, and asking probing questions to test their knowledge. Be patient, encouraging, and adapt your teaching style to the user\'s needs.',
            },
        });
        const result = await chat.sendMessageStream({ message });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of result.stream) {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        res.end();
    } catch (error) {
        console.error("Error in streamChat:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- STUDY BUDDY (NOTES-BASED) SERVICE ---
router.post('/streamStudyBuddyChat', async (req, res) => {
    try {
        const { message, notes } = req.body;
        const systemInstruction = `You are an expert AI Study Buddy. The user has provided the following notes to study from:
---
${notes || 'No notes provided yet.'}
---
Your knowledge is strictly limited to the text provided above. You CANNOT use any external information. When responding to the user:
1. First, determine if the user's question can be answered using ONLY the provided notes.
2. If the answer is in the notes, provide a comprehensive answer based exclusively on that text.
3. If the answer is NOT in the notes, you MUST begin your response with the exact phrase: "Based on the provided notes, I can\'t find information on that topic." After this phrase, you may optionally and briefly mention what the notes DO cover. Do not try to answer the original question.`;

        const chat = ai.chats.create({
            model: 'gemini-1.0-pro',
            config: {
                systemInstruction,
            },
        });
        const result = await chat.sendMessageStream({ message });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of result.stream) {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        res.end();
    } catch (error) {
        console.error("Error in streamStudyBuddyChat:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- CONCEPT VISUALIZER SERVICE ---
router.post('/generateImage', async (req, res) => {
    try {
        const { prompt, aspectRatio } = req.body;
        const fullPrompt = `A clear, educational diagram or mind map illustrating the following concept. Use minimal text, focusing on visual representation. Concept: "${prompt}"`;
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        });

        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        res.json({ image: `data:image/jpeg;base64,${base64ImageBytes}` });
    } catch (error) {
        console.error("Error in generateImage:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- NOTE SUMMARIZATION SERVICE ---
router.post('/summarizeText', async (req, res) => {
    try {
        const { text } = req.body;
        const prompt = `Summarize the following academic text or notes. Focus on extracting the key concepts, definitions, and main arguments. Present the summary in a clear, structured format, using bullet points or numbered lists where appropriate. Text: "${text}"`;
        const response = await ai.models.generateContent({
            model: 'gemini-1.0-pro',
            contents: prompt,
        });
        res.json({ summary: response.text });
    } catch (error) {
        console.error("Error in summarizeText:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- AUDIO SUMMARIZATION SERVICE ---
router.post('/summarizeAudioFromBase64', async (req, res) => {
    try {
        const { base64Data, mimeType } = req.body;
        const audioPart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType,
            },
        };
        const textPart = {
            text: "First, transcribe the provided audio accurately. Second, based on the transcription, provide a concise summary of the key points and topics discussed. Use bullet points for the summary."
        };

        const response = await ai.models.generateContent({
            model: 'gemini-1.0-pro',
            contents: { parts: [textPart, audioPart] },
        });
        res.json({ summary: response.text });
    } catch (error) {
        console.error("Error in summarizeAudioFromBase64:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- CODE HELPER SERVICE ---
router.post('/generateCode', async (req, res) => {
    try {
        const { prompt, language } = req.body;
        const fullPrompt = `You are an expert programming assistant. The user is asking for help with a coding task in ${language}. Provide a clear and accurate response. If generating code, wrap it in a single markdown code block (use triple backticks with ${language.toLowerCase()}). Task: "${prompt}"`;
        const response = await ai.models.generateContent({
            model: 'gemini-1.0-pro',
            contents: fullPrompt,
        });
        res.json({ code: response.text });
    } catch (error) {
        console.error("Error in generateCode:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- TEXT EXTRACTION FROM FILE SERVICE ---
router.post('/extractTextFromFile', async (req, res) => {
    try {
        const { base64Data, mimeType } = req.body;
        const filePart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType,
            },
        };
        const textPart = {
            text: "Extract all text content from the provided document. Present it as clean, unformatted text. If the document is a presentation, extract text from all slides."
        };

        const response = await ai.models.generateContent({
            model: 'gemini-1.0-pro',
            contents: { parts: [textPart, filePart] },
        });
        res.json({ text: response.text });
    } catch (error) {
        console.error("Error in extractTextFromFile:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- QUIZ GENERATION SERVICE ---
router.post('/generateQuizQuestion', async (req, res) => {
    try {
        const { context } = req.body;
        const prompt = `Based on the following context, generate a single multiple-choice quiz question to test understanding. The question should focus on a key concept from the text. Context: "${context.substring(0, 4000)}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.0-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topic: { type: Type.STRING, description: "A brief, one or two-word topic for the question (e.g., 'Photosynthesis', 'Calculus')." },
                        question: { type: Type.STRING },
                        options: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        correctOptionIndex: { type: Type.INTEGER }
                    },
                    required: ["topic", "question", "options", "correctOptionIndex"]
                }
            }
        });

        res.json({ question: response.text });
    } catch (error) {
        console.error("Error in generateQuizQuestion:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- AI STUDY SUGGESTIONS SERVICE ---
router.post('/getStudySuggestions', async (req, res) => {
    try {
        const { reportJson } = req.body;
        const prompt = `You are an expert academic advisor. Based on the following JSON data of a student's weekly performance, provide 2-3 concise, actionable suggestions to help them improve. Focus on their weaknesses, time management, or quiz performance. Frame your advice in a positive and encouraging tone.

Student Performance Data:
${reportJson}

Your Suggestions:`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.0-pro',
            contents: prompt,
        });
        res.json({ suggestions: response.text });
    } catch (error) {
        console.error("Error in getStudySuggestions:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- FLASHCARD GENERATION SERVICE ---
router.post('/generateFlashcards', async (req, res) => {
    try {
        const { context } = req.body;
        const prompt = `Based on the following context, generate a list of flashcards. Each flashcard should have a 'front' (a question or term) and a 'back' (the answer or definition). Context: "${context.substring(0, 4000)}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.0-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            front: { type: Type.STRING },
                            back: { type: Type.STRING }
                        },
                        required: ["front", "back"]
                    }
                }
            }
        });

        res.json({ flashcards: response.text });
    } catch (error) {
        console.error("Error in generateFlashcards:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Gets a smart suggestion based on the user's reported mood.
 */
router.post('/getSuggestionForMood', async (req, res) => {
    try {
        const { mood } = req.body;
        console.log(`Getting AI suggestion for mood: ${mood}`);

        const prompt = `A user in my learning app just reported their mood as '${mood}'.
Provide one, short (1-2 sentences) and encouraging, actionable suggestion.
- If mood is 'Happy' or 'Calm', suggest a good study task.
- If mood is 'Overwhelmed', suggest a way to get clarity.
- If mood is 'Sad' or 'Angry', suggest a constructive way to manage the feeling.

Example for 'Angry': 'Feeling frustrated? Try taking a short 5-minute walk to clear your head before diving back in.'
Example for 'Overwhelmed': 'Not sure what to do next? Try breaking down your main goal into smaller steps or ask the AI chat for ideas.'
Example for 'Happy': 'Great! Now is a perfect time to tackle that challenging topic you\'ve been putting off.'`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.0-pro',
            contents: prompt,
        });
        res.json({ suggestion: response.text });

    } catch (error) {
        console.error("Error in getSuggestionForMood:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- GOAL BREAKDOWN SERVICE ---
router.post('/breakDownGoal', async (req, res) => {
    try {
        const { goalTitle } = req.body;
        const prompt = `A user has set the following academic goal: "${goalTitle}".
Break this high-level goal down into a short list of 3-5 small, actionable sub-tasks.
Return ONLY a JSON array of strings.
Example for "Learn React": ["Understand JSX syntax", "Learn about components and props", "Practice state management with useState", "Build a simple to-do app"]`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.0-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        res.json({ breakdown: response.text });
    } catch (error) {
        console.error("Error in breakDownGoal:", error);
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
