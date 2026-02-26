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

const parseRetryAfterSec = (message = '') => {
    const retryInMatch = message.match(/retry in ([\d.]+)s/i);
    if (retryInMatch?.[1]) {
        return Math.ceil(Number(retryInMatch[1]));
    }

    const retryDelayMatch = message.match(/"retryDelay":"(\d+)s"/i);
    if (retryDelayMatch?.[1]) {
        return Number(retryDelayMatch[1]);
    }

    return undefined;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isGeminiQuotaError = (error) => {
    const rawMessage = String(error?.message || '');
    const status = Number(error?.status || error?.code || 0);
    return status === 429 || /429|quota exceeded|too many requests|rate limit/i.test(rawMessage);
};

const isGeminiModelUnavailableError = (error) => {
    const rawMessage = String(error?.message || '');
    const status = Number(error?.status || error?.code || 0);
    return status === 404
        || /404/i.test(rawMessage)
        || /is not found for API version/i.test(rawMessage)
        || /not supported for generatecontent/i.test(rawMessage);
};

const handleGeminiError = (res, error, fallbackMessage) => {
    const rawMessage = String(error?.message || fallbackMessage || 'Gemini request failed');
    const status = Number(error?.status || error?.code || 0);
    const retryAfterSec = parseRetryAfterSec(rawMessage);
    const isQuotaError = status === 429 || /429|quota exceeded|too many requests|rate limit/i.test(rawMessage);

    if (isQuotaError) {
        return res.status(429).json({
            error: 'AI quota exceeded or rate limited. Please retry shortly.',
            code: 'AI_QUOTA_EXCEEDED',
            retryAfterSec
        });
    }

    return res.status(500).json({ error: rawMessage });
};

const FILE_EXTRACTION_PROMPT = `You are an expert OCR and document parser.
Extract all textual content from the provided document. This document could be a PDF, an image (possibly handwritten notes), or a presentation (PPTX).

DIRECTIONS:
1. Extract all text.
2. Preserve logical structure (headings, bullet points, sections, slide numbers).
3. Represent formulas clearly in plain text or LaTeX-like notation.
4. For presentations, keep content slide-wise when possible.
5. Return only clean extracted text with no meta-commentary.`;
// --- AI TUTOR SERVICE (Using Groq) ---
router.post('/streamChat', async (req, res) => {
    try {
        const { message, language } = req.body;
        console.log(`[StreamChat] Message received. Language: ${language}`);
        let systemInstruction = 'You are an expert AI Tutor. Provide extremely precise, concise, and easy-to-understand answers. You must absolutely avoid long, verbose explanations. Use short, punchy sentences and bullet points. If an explanation can be 2 sentences, do not make it 3. Get straight to the point while remaining encouraging.';

        if (language === 'mr') {
            systemInstruction += ' IMPORTANT: Respond to the user ONLY in MARATHI (मराठी). Translated technical terms are okay, but the main conversation must be in Marathi.';
        } else if (language === 'hi') {
            systemInstruction += ' IMPORTANT: Respond to the user ONLY in HINDI (हिंदी).';
        }

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
        const { message, notes, language } = req.body;
        console.log(`[StreamStudyBuddyChat] Language: ${language}`);
        let systemInstruction = `You are an expert AI Study Buddy. The user has provided the following notes to study from:
---
${notes || 'No notes provided yet.'}
---
Your knowledge is strictly limited to the text provided above. You CANNOT use any external information. When responding to the user:
1. First, determine if the user's question can be answered using ONLY the provided notes.
2. If the answer is in the notes, provide a comprehensive answer based exclusively on that text.
3. If the answer is NOT in the notes, you MUST begin your response with the exact phrase: "Based on the provided notes, I can't find information on that topic." After this phrase, you may optionally and briefly mention what the notes DO cover. Do not try to answer the original question.
4. Keep your answers incredibly concise, precise, and easy-to-understand. You are forbidden from giving long, verbose explanations. Always use short sentences and bullet points where appropriate.`;

        if (language === 'mr') {
            systemInstruction += ' IMPORTANT: Respond to the user ONLY in MARATHI (मराठी).';
        } else if (language === 'hi') {
            systemInstruction += ' IMPORTANT: Respond to the user ONLY in HINDI (हिंदी).';
        }

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
        handleGeminiError(res, error, 'Audio summarization failed');
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

        if (!genAI) {
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
                mimeType
            }
        };
        const textPart = { text: FILE_EXTRACTION_PROMPT };

        const modelFallbackOrder = Array.from(new Set([
            process.env.GEMINI_FILE_PRIMARY_MODEL || 'gemini-2.0-flash',
            process.env.GEMINI_FILE_FALLBACK_MODEL || 'gemini-2.0-flash-exp'
        ]));
        let lastError = null;
        let sawQuotaError = false;
        let maxRetryAfterSec = 0;

        for (const modelName of modelFallbackOrder) {
            const model = getGeminiModel(modelName);
            if (!model) continue;

            const maxAttemptsPerModel = 2;
            for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
                try {
                    const result = await model.generateContent([textPart, filePart]);
                    const extractedText = String(result?.response?.text?.() || '').trim();

                    if (!extractedText) {
                        throw new Error('No text could be extracted from this file. It might be empty or in an unsupported format.');
                    }

                    return res.json({ text: extractedText });
                } catch (error) {
                    lastError = error;
                    if (isGeminiQuotaError(error)) {
                        sawQuotaError = true;
                        const retryAfterSec = parseRetryAfterSec(String(error?.message || ''));
                        if (typeof retryAfterSec === 'number' && retryAfterSec > maxRetryAfterSec) {
                            maxRetryAfterSec = retryAfterSec;
                        }

                        const canRetryThisModel = attempt < maxAttemptsPerModel;
                        if (canRetryThisModel) {
                            const waitSec = Math.min(45, Math.max(2, retryAfterSec || 6));
                            console.warn(`[extractTextFromFile] ${modelName} rate limited. Retrying in ${waitSec}s (attempt ${attempt + 1}/${maxAttemptsPerModel})...`);
                            await sleep(waitSec * 1000);
                            continue;
                        }

                        console.warn(`[extractTextFromFile] ${modelName} still rate limited after retries. Trying next model...`);
                        break;
                    }

                    if (isGeminiModelUnavailableError(error)) {
                        console.warn(`[extractTextFromFile] ${modelName} unavailable for this API/version. Trying next model...`);
                        break;
                    }

                    console.error(`[extractTextFromFile] ${modelName} failed:`, error?.message || error);
                    throw error;
                }
            }
        }

        if (sawQuotaError) {
            return res.status(429).json({
                error: 'AI quota exceeded or rate limited. Please retry shortly.',
                code: 'AI_QUOTA_EXCEEDED',
                retryAfterSec: maxRetryAfterSec || undefined
            });
        }

        if (isGeminiModelUnavailableError(lastError)) {
            return res.status(503).json({
                error: 'No compatible Gemini file-extraction model is currently available for this server configuration.',
                code: 'AI_MODEL_UNAVAILABLE'
            });
        }

        throw lastError || new Error('File text extraction failed.');
    } catch (error) {
        console.error("Error in extractTextFromFile:", error);
        handleGeminiError(res, error, 'File text extraction failed');
    }
});

// --- QUIZ GENERATION SERVICE (Using Groq) ---
router.post('/generateQuizQuestion', async (req, res) => {
    try {
        const { context, language } = req.body;
        console.log(`[GenerateQuizQuestion] Language: ${language}`);
        let prompt = `Based on the following context, generate a single multiple-choice quiz question to test understanding. The question should focus on a key concept from the text. 
        RETURN ONLY RAW JSON. Do not wrap in markdown or code blocks.
        
        Context: "${context.substring(0, 4000)}"`;

        if (language === 'mr') {
            prompt += '\nIMPORTANT: The question and options MUST be in MARATHI (मराठी). The JSON keys (topic, question, options) must remain in English.';
        } else if (language === 'hi') {
            prompt += '\nIMPORTANT: The question and options MUST be in HINDI (हिंदी). The JSON keys (topic, question, options) must remain in English.';
        }

        prompt += `
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
        const { mood, language } = req.body;
        console.log(`Getting AI suggestion for mood: ${mood}, Language: ${language}`);

        let prompt = `A user in my learning app just reported their mood as '${mood}'.
        Provide one, short (1-2 sentences) and encouraging, actionable suggestion.
        - If mood is 'Happy' or 'Calm', suggest a good study task.
        - If mood is 'Overwhelmed', suggest a way to get clarity.
        - If mood is 'Sad' or 'Angry', suggest a constructive way to manage the feeling.`;

        if (language === 'mr') {
            prompt += ' IMPORTANT: Respond to the user ONLY in MARATHI (मराठी).';
        } else if (language === 'hi') {
            prompt += ' IMPORTANT: Respond to the user ONLY in HINDI (हिंदी).';
        }

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
        const { message, subject, branch, persona = 'Standard', language } = req.body;
        console.log(`[StreamVivaChat] Language: ${language}`);

        let systemInstruction = `You are an External Examiner for the Mumbai University (MU) Engineering Viva Voce. 
        Subject: ${subject}
        Branch: ${branch}
        Current Mode: ${persona}

        Core Behavior:
        1. Ask One Question at a Time: Never stack questions. Wait for the student's response.
        2. Context: Stick strictly to the MU syllabus for ${subject}.
        3. Evaluation: After the student answers, evaluate their technical accuracy.
        4. Your responses MUST be extremely short, concise, and straight to the point. Do not give long explanations under any circumstances. Limit your responses to 1-3 sentences maximum.

        Persona Guidelines (Mode: ${persona}):
        - IF Mode = "The Griller": Strict but fair. Be skeptical and relentless. If the answer is correct but shallow, ask "Why?" or "How would this fail in a real scenario?". If wrong, bluntly state "Incorrect" and ask a harder follow-up. Do not offer hints. Use a formal, high-pressure tone equivalent to an external examiner at a top-tier Mumbai college.
        - IF Mode = "Standard": Professional MU Examiner. Balanced approach. If the answer is wrong, say "Not quite, think about [Related Concept]" and move to the next question.
        - IF Mode = "The Guide": Encouraging mentor. If the student struggles, provide a progressive hint. Use phrases like "You're close, consider the relationship between..."
        
        SYLLABUS DEPTH: For 3rd and 4th year subjects, focus on application-level questions rather than just definitions.

        Fail State: If the student fails 3 consecutive questions, politely end the viva and suggest specific modules to revise.

        The goal is to test their conceptual depth according to the chosen mode.`;

        if (language === 'mr') {
            systemInstruction += ' IMPORTANT: Respond to the user ONLY in MARATHI (मराठी).';
        } else if (language === 'hi') {
            systemInstruction += ' IMPORTANT: Respond to the user ONLY in HINDI (हिंदी).';
        }

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

// --- FEYNMAN TECHNIQUE SERVICE (Using multi-provider stack) ---
router.post('/streamFeynmanChat', async (req, res) => {
    try {
        const { message, topic, notes, language } = req.body;

        let systemInstruction = `You are a curious, non-expert student (a 10-year-old named "Nino") who wants to learn about "${topic}".
The user is trying to teach you this concept using the Feynman Technique.

Your Goal:
1. Act like you know nothing about the technical side of ${topic}.
2. Ask innocent but deep "Why?" and "How?" questions.
3. If the user uses jargon or complex language, ask for simpler words suitable for a 10-year-old.
4. Do not provide formal textbook definitions yourself. You are the learner.

Notes context if available:
---
${notes || 'No specific notes provided.'}
---

Current behavior:
- Be friendly and curious.
- Keep your questions and responses extremely short and concise (1-2 sentences max). Do not write long paragraphs under any circumstances.
- If explanation is too short, ask for an analogy.
- Ask for a Mumbai/India real-world example when useful.`;

        if (language === 'mr') {
            systemInstruction += ' IMPORTANT: Respond only in MARATHI (मराठी).';
        } else if (language === 'hi') {
            systemInstruction += ' IMPORTANT: Respond only in HINDI (हिंदी).';
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = aiProvider.stream(message, {
            feature: 'chat',
            systemInstruction,
            maxTokens: 1200
        });

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
        res.end();
    } catch (error) {
        console.error('Error in streamFeynmanChat:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/getFeynmanFeedback', async (req, res) => {
    try {
        const { topic, explanation, notes, language } = req.body;

        let prompt = `You are an expert pedagogy analyzer.
Evaluate the user's explanation of "${topic}" using Feynman Technique principles.

Reference notes:
${notes || 'No notes provided.'}

User explanation:
"${explanation || ''}"

Return ONLY raw JSON with this schema:
{
  "clarityScore": number,
  "jargon": ["string"],
  "gaps": ["string"],
  "analogySuggestions": ["string"],
  "verdict": "string",
  "improvement": "string"
}

Scoring guidance:
- clarityScore must be an integer from 1 to 10
- jargon: complex words used without explanation
- gaps: missing/incorrect concept pieces
- analogySuggestions: 1-3 concrete analogy improvements
- verdict: short summary
- improvement: one highest-impact next step`;

        if (language === 'mr') {
            prompt += '\nIMPORTANT: All textual fields in JSON must be in MARATHI (मराठी).';
        } else if (language === 'hi') {
            prompt += '\nIMPORTANT: All textual fields in JSON must be in HINDI (हिंदी).';
        }

        const result = await aiProvider.generate(prompt, {
            feature: 'studyBuddy',
            json: true,
            temperature: 0.3,
            maxTokens: 1200
        });

        const cleaned = String(result || '').replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        res.json(parsed);
    } catch (error) {
        console.error('Error in getFeynmanFeedback:', error);
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
