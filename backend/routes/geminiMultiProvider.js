/**
 * Gemini Routes - Multi-Provider Version
 * Uses Groq/OpenRouter as primary, with Gemini fallback for media processing
 */

const express = require('express');
const router = express.Router();
const aiProvider = require('../services/aiProvider');

// Keep Gemini for media processing (audio, file extraction) as Groq doesn't support it
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY, { apiVersion: 'v1beta' })
    : null;

const getGeminiModel = (modelName = 'gemini-2.0-flash', systemInstruction = null) => {
    if (!genAI) return null;
    const config = { model: modelName };
    if (systemInstruction) {
        config.systemInstruction = systemInstruction;
    }
    return genAI.getGenerativeModel(config);
};

// --- AI TUTOR SERVICE (Using Groq) ---
router.post('/streamChat', async (req, res) => {
    try {
        const { message } = req.body;
        const systemInstruction = 'You are an expert AI Tutor. Your goal is to help users understand complex topics by providing clear explanations, step-by-step examples, and asking probing questions to test their knowledge. Be patient, encouraging, and adapt your teaching style to the user\'s needs.';

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = aiProvider.stream(message, {
            feature: 'chat',
            systemInstruction,
            maxTokens: 2000
        });

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
        res.end();
    } catch (error) {
        console.error("Error in streamChat:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- STUDY BUDDY (NOTES-BASED) SERVICE (Using Groq) ---
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

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = aiProvider.stream(message, {
            feature: 'studyBuddy',
            systemInstruction
        });

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
        res.end();
    } catch (error) {
        console.error("Error in streamStudyBuddyChat:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- CONCEPT VISUALIZER SERVICE (Using Pollinations - already external) ---
router.post('/generateImage', async (req, res) => {
    try {
        const { prompt, aspectRatio = '16:9' } = req.body;
        const width = aspectRatio === '16:9' ? 1280 : 1024;
        const height = aspectRatio === '16:9' ? 720 : 1024;

        const encodedPrompt = encodeURIComponent(prompt + " high quality educational 4k concept art diagram");
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

        res.json({ image: imageUrl });
    } catch (error) {
        console.error("Error in generateImage:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- NOTE SUMMARIZATION SERVICE (Using Groq) ---
router.post('/summarizeText', async (req, res) => {
    try {
        const { text } = req.body;
        const prompt = `Summarize the following academic text or notes. Focus on extracting the key concepts, definitions, and main arguments. Present the summary in a clear, structured format, using bullet points or numbered lists where appropriate. Text: "${text}"`;

        const result = await aiProvider.generate(prompt, { feature: 'summarize' });
        res.json({ summary: result });
    } catch (error) {
        console.error("Error in summarizeText:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- AUDIO SUMMARIZATION SERVICE (Gemini only - needs media processing) ---
router.post('/summarizeAudioFromBase64', async (req, res) => {
    try {
        const { base64Data, mimeType } = req.body;

        // Audio processing requires Gemini's multimodal capabilities
        const model = getGeminiModel('gemini-2.0-flash');
        if (!model) {
            return res.status(503).json({ error: 'Audio processing requires Gemini API. Please configure GEMINI_API_KEY or wait and try again.' });
        }

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

// --- CODE HELPER SERVICE (Using Groq) ---
router.post('/generateCode', async (req, res) => {
    try {
        const { prompt, language } = req.body;
        const fullPrompt = `You are an expert programming assistant. The user is asking for help with a coding task in ${language}. Provide a clear and accurate response. If generating code, wrap it in a single markdown code block (use triple backticks with ${language.toLowerCase()}). Task: "${prompt}"`;

        const result = await aiProvider.generate(fullPrompt, { feature: 'code' });
        res.json({ code: result });
    } catch (error) {
        console.error("Error in generateCode:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- TEXT EXTRACTION FROM FILE SERVICE (Gemini only - needs multimodal) ---
router.post('/extractTextFromFile', async (req, res) => {
    try {
        let { base64Data, mimeType } = req.body;

        // File processing requires Gemini's multimodal capabilities
        const model = getGeminiModel('gemini-2.0-flash');
        if (!model) {
            return res.status(503).json({ error: 'File extraction requires Gemini API. Please configure GEMINI_API_KEY or wait and try again.' });
        }

        // Fallback for missing or generic mime types
        if (!mimeType || mimeType === 'application/octet-stream') {
            // Very basic guessing based on common magic numbers in base64 could be done here, 
            // but for now we'll just log it.
            console.warn("[extractTextFromFile] Missing or generic mimeType, using application/pdf as fallback");
            mimeType = 'application/pdf'; // Common fallback
        }

        const filePart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType,
            },
        };

        const textPart = {
            text: `You are an expert OCR and document parser. 
            Extract all textual content from the provided document. This document could be a PDF, an image (possibly of handwritten notes), or a presentation (PPTX).
            
            DIRECTIONS:
            1. Extract ALL text. For handwritten notes, be extremely thorough and use your best judgment to decipher messy handwriting.
            2. Preserve the logical structure (headings, bullet points, sections, slide numbers).
            3. For mathematical formulas, represent them clearly in plain text or LaTeX-like notation.
            4. If it's a presentation, extract the content slide by slide.
            5. Return ONLY the clean, unformatted continuous text. Do not include any meta-commentary like "Here is the text".`
        };

        const result = await model.generateContent([textPart, filePart]);
        const extractedText = result.response.text();

        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error("No text could be extracted from this file. It might be empty or in an unsupported format.");
        }

        res.json({ text: extractedText });
    } catch (error) {
        console.error("Error in extractTextFromFile:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- QUIZ GENERATION SERVICE (Using Groq) ---
router.post('/generateQuizQuestion', async (req, res) => {
    try {
        const { context } = req.body;
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

        const result = await aiProvider.generate(prompt, { feature: 'quiz', json: true });
        const cleanedResponse = result.replace(/```json|```/g, '').trim();
        res.json({ question: cleanedResponse });
    } catch (error) {
        console.error("Error in generateQuizQuestion:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/generateQuizSet', async (req, res) => {
    try {
        const { context, count = 5 } = req.body;
        const prompt = `Based on the provided notes/context, generate a set of ${count} multiple-choice quiz questions.
        Focus on testing key concepts, definitions, and applications.
        RETURN ONLY RAW JSON. Do not wrap in markdown or code blocks.

        Context: "${context.substring(0, 8000)}"

        Schema:
        [
            {
                "topic": "string",
                "question": "string",
                "options": ["string", "string", "string", "string"],
                "correctOptionIndex": number
            }
        ]`;

        const result = await aiProvider.generate(prompt, { feature: 'quiz', json: true });
        res.json({ quizSet: result });
    } catch (error) {
        console.error("Error in generateQuizSet:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- AI STUDY SUGGESTIONS SERVICE (Using Groq) ---
router.post('/getStudySuggestions', async (req, res) => {
    try {
        const { reportJson } = req.body;
        const prompt = `You are an expert academic advisor for engineering students (specifically Mumbai University context). 
        Based on the following JSON data of a student's weekly performance, provide 3-4 specific, actionable suggestions.
        Considering Mumbai University's pattern, emphasize the importance of consistent practice and concept clarity.
        
        Student Performance Data:
        ${reportJson}
        
        Your Suggestions:`;

        const result = await aiProvider.generate(prompt, { feature: 'suggestions' });
        res.json({ suggestions: result });
    } catch (error) {
        console.error("Error in getStudySuggestions:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- FLASHCARD GENERATION SERVICE (Using Groq) ---
router.post('/generateFlashcards', async (req, res) => {
    try {
        const { context } = req.body;
        const prompt = `Based on the following context, generate a list of flashcards. Each flashcard should have a 'front' (a question or term) and a 'back' (the answer or definition).
        RETURN ONLY RAW JSON. Do not wrap in markdown or code blocks.
        
        Context: "${context.substring(0, 4000)}"
        
        Schema:
        [
            { "front": "string", "back": "string" }
        ]`;

        const result = await aiProvider.generate(prompt, { feature: 'flashcards', json: true });
        const cleanedResponse = result.replace(/```json|```/g, '').trim();
        res.json({ flashcards: cleanedResponse });
    } catch (error) {
        console.error("Error in generateFlashcards:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/getSuggestionForMood', async (req, res) => {
    try {
        const { mood } = req.body;
        console.log(`Getting AI suggestion for mood: ${mood}`);

        const prompt = `A user in my learning app just reported their mood as '${mood}'.
        Provide one, short (1-2 sentences) and encouraging, actionable suggestion.
        - If mood is 'Happy' or 'Calm', suggest a good study task.
        - If mood is 'Overwhelmed', suggest a way to get clarity.
        - If mood is 'Sad' or 'Angry', suggest a constructive way to manage the feeling.`;

        const result = await aiProvider.generate(prompt, { feature: 'mood' });
        res.json({ suggestion: result });
    } catch (error) {
        console.error("Error in getSuggestionForMood:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- GOAL BREAKDOWN SERVICE (Using Groq) ---
router.post('/breakDownGoal', async (req, res) => {
    try {
        const { goalTitle } = req.body;
        const prompt = `A user has set the following academic goal: "${goalTitle}".
        Break this high-level goal down into a short list of 3-5 small, actionable sub-tasks.
        Return ONLY a JSON array of strings.
        Example: ["Understand JSX syntax", "Learn about components and props"]`;

        const result = await aiProvider.generate(prompt, { feature: 'goals', json: true });
        const cleanedResponse = result.replace(/```json|```/g, '').trim();
        res.json({ breakdown: cleanedResponse });
    } catch (error) {
        console.error("Error in breakDownGoal:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- PROJECT IDEA GENERATOR SERVICE (Using Groq) ---
router.post('/generateProjectIdeas', async (req, res) => {
    try {
        const { branch, interest, difficulty } = req.body;
        const prompt = `Generate 5 unique and innovative engineering project ideas.
        Branch: ${branch}
        Area of Interest: ${interest}
        Difficulty Level: ${difficulty}

        Context: The student is likely from Mumbai University. innovative projects that solve local problems (Mumbai/India) or follow current industry trends are highly appreciated. 
        Ensure a mix of software, hardware (if applicable), and research-based ideas.

        Return ONLY a JSON array of objects.
        Schema:
        [
            { "title": "string", "description": "string", "techStack": ["string", "string"] }
        ]`;

        const result = await aiProvider.generate(prompt, { feature: 'projectIdeas', json: true });
        const cleanedResponse = result.replace(/```json|```/g, '').trim();
        res.json({ ideas: cleanedResponse });
    } catch (error) {
        console.error("Error in generateProjectIdeas:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- MOCK PAPER GENERATOR SERVICE (Using Groq) ---
router.post('/generateMockPaper', async (req, res) => {
    try {
        const { branch, subject, year } = req.body;
        const prompt = `Generate a comprehensive engineering exam mock question paper for Mumbai University.
        Branch: ${branch}
        Subject: ${subject}
        Year: ${year}

        MASTER SKELETON (Strict MU Rev-2019/2024 C-Scheme Pattern):
        - Total Marks: 80 | Time: 3 Hours
        - Q1: COMPULSORY (20 Marks) - 4 sub-questions of 5 marks each. Covering all modules.
        - Q2 to Q6: Attempt ANY THREE (20 Marks each).
        - SYLLABUS COVERAGE: Must include questions from all 6 modules.
        - SUB-QUESTION PATTERN: Use MU standard distributions: (10+10) or (5+5+10) or (8+6+6).
        - DIFFICULTY MIX: 20% Easy, 50% Moderate, 30% Hard.
        - STEP MARKING: Ensure question phrasing allows for step-wise evaluation.

        Return ONLY a JSON object matching this exact schema:
        {
            "subject": "${subject}",
            "time": "3 Hours",
            "totalMarks": 80,
            "instructions": ["Q1 is compulsory", "Attempt any 3 from Q2-Q6", "Figures to the right indicate full marks"],
            "questions": [
                {
                    "number": 1,
                    "title": "Compulsory Short Questions",
                    "totalMarks": 20,
                    "subQuestions": [
                        { "text": "...", "marks": 5 },
                        { "text": "...", "marks": 5 },
                        { "text": "...", "marks": 5 },
                        { "text": "...", "marks": 5 }
                    ]
                },
                {
                    "number": 2,
                    "title": "Module 1 & 2 Focus",
                    "totalMarks": 20,
                    "subQuestions": [
                        { "text": "...", "marks": 10 },
                        { "text": "...", "marks": 10 }
                    ]
                },
                { "number": 3, "title": "Module 3 Focus", "totalMarks": 20, "subQuestions": [...] },
                { "number": 4, "title": "Module 4 Focus", "totalMarks": 20, "subQuestions": [...] },
                { "number": 5, "title": "Module 5 Focus", "totalMarks": 20, "subQuestions": [...] },
                { "number": 6, "title": "Module 6 Focus", "totalMarks": 20, "subQuestions": [...] }
            ]
        }`;

        const result = await aiProvider.generate(prompt, { feature: 'mockPaper', json: true });
        const cleanedResponse = result.replace(/```json|```/g, '').trim();
        res.json({ paper: JSON.parse(cleanedResponse) });
    } catch (error) {
        console.error("Error in generateMockPaper:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- VIVA SIMULATOR SERVICE (Using Groq) ---
router.post('/streamVivaChat', async (req, res) => {
    try {
        const { message, subject, branch, persona = 'Standard' } = req.body;

        const systemInstruction = `You are an External Examiner for the Mumbai University (MU) Engineering Viva Voce. 
        Subject: ${subject}
        Branch: ${branch}
        Current Mode: ${persona}

        Core Behavior:
        1. Ask One Question at a Time: Never stack questions. Wait for the student's response.
        2. Context: Stick strictly to the MU syllabus for ${subject}.
        3. Evaluation: After the student answers, evaluate their technical accuracy.

        Persona Guidelines (Mode: ${persona}):
        - IF Mode = "The Griller": Strict but fair. Be skeptical and relentless. If the answer is correct but shallow, ask "Why?" or "How would this fail in a real scenario?". If wrong, bluntly state "Incorrect" and ask a harder follow-up. Do not offer hints. Use a formal, high-pressure tone equivalent to an external examiner at a top-tier Mumbai college.
        - IF Mode = "Standard": Professional MU Examiner. Balanced approach. If the answer is wrong, say "Not quite, think about [Related Concept]" and move to the next question.
        - IF Mode = "The Guide": Encouraging mentor. If the student struggles, provide a progressive hint. Use phrases like "You're close, consider the relationship between..."
        
        SYLLABUS DEPTH: For 3rd and 4th year subjects, focus on application-level questions rather than just definitions.

        Fail State: If the student fails 3 consecutive questions, politely end the viva and suggest specific modules to revise.

        The goal is to test their conceptual depth according to the chosen mode.`;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = aiProvider.stream(message, {
            feature: 'viva',
            systemInstruction
        });

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
        res.end();
    } catch (error) {
        console.error("Error in streamVivaChat:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- PROVIDER STATUS ENDPOINT ---
router.get('/providers', (req, res) => {
    const providers = aiProvider.getAvailableProviders();
    res.json({
        available: providers,
        primary: providers[0] || 'none',
        message: providers.length > 0
            ? `Using ${providers[0]} as primary provider`
            : 'No AI providers configured. Please add GROQ_API_KEY or OPENROUTER_API_KEY to your .env file.'
    });
});

module.exports = router;
