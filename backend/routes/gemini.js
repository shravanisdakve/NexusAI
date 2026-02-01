const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Initialize Gemini with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper to get model
const getModel = (modelName = 'gemini-2.5-flash', systemInstruction = null) => {
    const config = { model: modelName };
    if (systemInstruction) {
        config.systemInstruction = systemInstruction;
    }
    return genAI.getGenerativeModel(config);
};

// --- AI TUTOR SERVICE ---
router.post('/streamChat', async (req, res) => {
    try {
        const { message } = req.body;
        const model = getModel('gemini-2.5-flash', 'You are an expert AI Tutor. Your goal is to help users understand complex topics by providing clear explanations, step-by-step examples, and asking probing questions to test their knowledge. Be patient, encouraging, and adapt your teaching style to the user\'s needs.');

        const chat = model.startChat({
            history: [],
            generationConfig: {
                maxOutputTokens: 2000,
            },
        });

        const result = await chat.sendMessageStream(message);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
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
3. If the answer is NOT in the notes, you MUST begin your response with the exact phrase: "Based on the provided notes, I can't find information on that topic." After this phrase, you may optionally and briefly mention what the notes DO cover. Do not try to answer the original question.`;

        const model = getModel('gemini-2.5-flash', systemInstruction);
        const chat = model.startChat();

        const result = await chat.sendMessageStream(message);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
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
        // Attempt to use 'imagen-4.0-generate-001' if available on the key.
        // Note: The generateContent method is typically for text/multimodal text.
        // Standard Image Generation via the SDK works differently or might not be fully supported via `generateContent`.
        // However, some newer endpoints allow it. Let's try or return a clear message.

        // As a safe fallback for "Concept Visualizer", we will return a descriptive text 
        // that the frontend can display, or implement true image gen if feasible later.

        res.status(400).json({ error: "Image generation requires specific SDK support not currently configured for this endpoint." });
    } catch (error) {
        console.error("Error in generateImage:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- NOTE SUMMARIZATION SERVICE ---
router.post('/summarizeText', async (req, res) => {
    try {
        const { text } = req.body;
        const model = getModel('gemini-2.5-flash');
        const prompt = `Summarize the following academic text or notes. Focus on extracting the key concepts, definitions, and main arguments. Present the summary in a clear, structured format, using bullet points or numbered lists where appropriate. Text: "${text}"`;

        const result = await model.generateContent(prompt);
        res.json({ summary: result.response.text() });
    } catch (error) {
        console.error("Error in summarizeText:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- AUDIO SUMMARIZATION SERVICE ---
router.post('/summarizeAudioFromBase64', async (req, res) => {
    try {
        const { base64Data, mimeType } = req.body;
        const model = getModel('gemini-2.5-flash');

        const audioPart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType,
            },
        };
        const textPart = {
            text: "First, transcribe the provided audio accurately. Second, based on the transcription, provide a concise summary of the key points and topics discussed. Use bullet points for the summary."
        };

        const result = await model.generateContent([textPart, audioPart]);
        res.json({ summary: result.response.text() });
    } catch (error) {
        console.error("Error in summarizeAudioFromBase64:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- CODE HELPER SERVICE ---
router.post('/generateCode', async (req, res) => {
    try {
        const { prompt, language } = req.body;
        const model = getModel('gemini-2.5-flash');
        const fullPrompt = `You are an expert programming assistant. The user is asking for help with a coding task in ${language}. Provide a clear and accurate response. If generating code, wrap it in a single markdown code block (use triple backticks with ${language.toLowerCase()}). Task: "${prompt}"`;

        const result = await model.generateContent(fullPrompt);
        res.json({ code: result.response.text() });
    } catch (error) {
        console.error("Error in generateCode:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- TEXT EXTRACTION FROM FILE SERVICE ---
router.post('/extractTextFromFile', async (req, res) => {
    try {
        const { base64Data, mimeType } = req.body;
        const model = getModel('gemini-2.5-flash');

        const filePart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType,
            },
        };
        const textPart = {
            text: "Extract all text content from the provided document. Present it as clean, unformatted text. If the document is a presentation, extract text from all slides."
        };

        const result = await model.generateContent([textPart, filePart]);
        res.json({ text: result.response.text() });
    } catch (error) {
        console.error("Error in extractTextFromFile:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- QUIZ GENERATION SERVICE ---
router.post('/generateQuizQuestion', async (req, res) => {
    try {
        const { context } = req.body;
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Based on the following context, generate a single multiple-choice quiz question to test understanding. The question should focus on a key concept from the text. 
        RETURN ONLY RAW JSON. Do not wrap in markdown or code blocks.
        
        Context: "${context.substring(0, 4000)}"
        
        The JSON must match this schema:
        {
            "topic": "string",
            "question": "string",
            "options": ["string", "string", "string", "string"],
            "correctOptionIndex": number
        }`;

        const result = await model.generateContent(prompt);
        res.json({ question: result.response.text() });
    } catch (error) {
        console.error("Error in generateQuizQuestion:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- AI STUDY SUGGESTIONS SERVICE ---
router.post('/getStudySuggestions', async (req, res) => {
    try {
        const { reportJson } = req.body;
        const model = getModel('gemini-2.5-flash');
        const prompt = `You are an expert academic advisor. Based on the following JSON data of a student's weekly performance, provide 2-3 concise, actionable suggestions to help them improve. Focus on their weaknesses, time management, or quiz performance. Frame your advice in a positive and encouraging tone.
        
        Student Performance Data:
        ${reportJson}
        
        Your Suggestions:`;

        const result = await model.generateContent(prompt);
        res.json({ suggestions: result.response.text() });
    } catch (error) {
        console.error("Error in getStudySuggestions:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- FLASHCARD GENERATION SERVICE ---
router.post('/generateFlashcards', async (req, res) => {
    try {
        const { context } = req.body;
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Based on the following context, generate a list of flashcards. Each flashcard should have a 'front' (a question or term) and a 'back' (the answer or definition).
        RETURN ONLY RAW JSON. Do not wrap in markdown or code blocks.
        
        Context: "${context.substring(0, 4000)}"
        
        Schema:
        [
            { "front": "string", "back": "string" }
        ]`;

        const result = await model.generateContent(prompt);
        res.json({ flashcards: result.response.text() });
    } catch (error) {
        console.error("Error in generateFlashcards:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/getSuggestionForMood', async (req, res) => {
    try {
        const { mood } = req.body;
        const model = getModel('gemini-2.5-flash');
        console.log(`Getting AI suggestion for mood: ${mood}`);

        const prompt = `A user in my learning app just reported their mood as '${mood}'.
        Provide one, short (1-2 sentences) and encouraging, actionable suggestion.
        - If mood is 'Happy' or 'Calm', suggest a good study task.
        - If mood is 'Overwhelmed', suggest a way to get clarity.
        - If mood is 'Sad' or 'Angry', suggest a constructive way to manage the feeling.`;

        const result = await model.generateContent(prompt);
        res.json({ suggestion: result.response.text() });

    } catch (error) {
        console.error("Error in getSuggestionForMood:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- GOAL BREAKDOWN SERVICE ---
router.post('/breakDownGoal', async (req, res) => {
    try {
        const { goalTitle } = req.body;
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `A user has set the following academic goal: "${goalTitle}".
        Break this high-level goal down into a short list of 3-5 small, actionable sub-tasks.
        Return ONLY a JSON array of strings.
        Example: ["Understand JSX syntax", "Learn about components and props"]`;

        const result = await model.generateContent(prompt);
        res.json({ breakdown: result.response.text() });
    } catch (error) {
        console.error("Error in breakDownGoal:", error);
        res.status(500).json({ error: error.message });
    }
});


// --- PROJECT IDEA GENERATOR SERVICE ---
router.post('/generateProjectIdeas', async (req, res) => {
    try {
        const { branch, interest, difficulty } = req.body;
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Generate 3 unique and innovative engineering project ideas.
        Branch: ${branch}
        Area of Interest: ${interest}
        Difficulty Level: ${difficulty}

        Return ONLY a JSON array of objects.
        Schema:
        [
            { "title": "string", "description": "string", "techStack": ["string", "string"] }
        ]`;

        const result = await model.generateContent(prompt);
        res.json({ ideas: result.response.text() });
    } catch (error) {
        console.error("Error in generateProjectIdeas:", error);
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
