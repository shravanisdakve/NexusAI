/**
 * Extraction Provider - Multi-LLM Strategy
 * Primary: NVIDIA -> Secondary: Groq -> Tertiary: Gemini
 */

const express = require('express');
const router = express.Router();
const aiProvider = require('../services/aiProvider');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

// --- GEMINI KEY POOL MANAGER (OCR Fallback) ---
const getGeminiKeys = () => {
    const keys = [process.env.GEMINI_API_KEY];
    for (let i = 1; i <= 10; i++) {
        const key = process.env[`GEMINI_API_KEY_${i}`];
        if (key) keys.push(key);
    }
    return [...new Set(keys.filter(Boolean))]; // Filter nulls and remove duplicates
};

const keyPool = getGeminiKeys();
let currentKeyIndex = 0;

const getGenAIInstance = (forceNext = false) => {
    if (keyPool.length === 0) return null;
    if (forceNext) {
        currentKeyIndex = (currentKeyIndex + 1) % keyPool.length;
        console.log(`[GeminiPool] Manually rotating to key index ${currentKeyIndex}...`);
    }
    return new GoogleGenerativeAI(keyPool[currentKeyIndex], { apiVersion: 'v1beta' });
};

const getGeminiModel = (modelName = 'gemini-1.5-flash', forceNext = false) => {
    const genAI = getGenAIInstance(forceNext);
    if (!genAI) return null;
    return genAI.getGenerativeModel({ model: modelName });
};

const callGeminiWithRetry = async (prompt, dataPart, retries = keyPool.length) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            const model = getGeminiModel('gemini-2.0-flash', i > 0);
            if (!model) throw new Error('No Gemini model available');
            const result = await model.generateContent([prompt, dataPart]);
            return result.response.text().trim();
        } catch (error) {
            lastError = error;
            if (error.status === 429 || error.message?.includes('429')) {
                console.warn(`[GeminiPool] Key ${currentKeyIndex} hit 429. Retrying with next key...`);
            } else {
                throw error; // If it's not a rate limit error, throw immediately
            }
        }
    }
    throw lastError;
};

const FILE_EXTRACTION_PROMPT = `You are an expert academic document parser. Extract all textual content precisely. Maintain headings, lists, and hierarchical structure. decoupher handwriting if found. Return ONLY clean extracted text. Do not add commentary or "Here is the text".`;

// --- AUTH MIDDLEWARE (Optional if app level handles it, but good to be safe) ---
const auth = require('../middleware/auth');

// --- ENDPOINTS ---

router.post('/streamChat', async (req, res) => {
    try {
        const { message, language } = req.body;
        console.log(`[StreamChat] Lang: ${language}`);
        let systemInstruction = 'You are an expert AI Tutor specifically for MUMBAI UNIVERSITY (MU) engineering students. You provide extremely precise, concise answers following the MU syllabus and marking scheme. Priority: MU Rev-2019/2024 C-Scheme.';
        if (language === 'mr') systemInstruction += ' Respond ONLY in MARATHI (मराठी).';
        else if (language === 'hi') systemInstruction += ' Respond ONLY in HINDI (हिंदी).';

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = aiProvider.stream(message, { feature: 'chat', systemInstruction });
        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
        res.end();
    } catch (e) {
        console.error(`[AI Stream] Error: ${e.message}`);
        if (!res.headersSent) {
            res.status(500).json({ error: e.message });
        } else {
            res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
            res.end();
        }
    }
});

router.post('/streamStudyBuddyChat', async (req, res) => {
    try {
        const { message, notes, language } = req.body;
        let systemInstruction = `You are a Study Buddy. Context:\n---\n${notes || 'No notes'}\n---\nAnswer ONLY using these notes. If topic is absent, say you can't find it in the provided text.`;
        if (language === 'mr') systemInstruction += ' Respond ONLY in MARATHI.';
        else if (language === 'hi') systemInstruction += ' Respond ONLY in HINDI.';

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = aiProvider.stream(message, { feature: 'studyBuddy', systemInstruction });
        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
        res.end();
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateImage', async (req, res) => {
    const { prompt, aspectRatio = '16:9' } = req.body;
    const width = aspectRatio === '16:9' ? 1280 : 1024;
    const height = aspectRatio === '16:9' ? 720 : 1024;
    const encoded = encodeURIComponent(prompt + " educational diagram 4k concept art");
    res.json({ image: `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true` });
});

router.post('/summarizeText', async (req, res) => {
    try {
        const { text, language } = req.body;
        let prompt = `Summarize academic text: "${text}"`;
        if (language === 'mr') prompt += ' Respond ONLY in MARATHI.';
        else if (language === 'hi') prompt += ' Respond ONLY in HINDI.';
        const result = await aiProvider.generate(prompt, { feature: 'summarize' });
        res.json({ summary: result });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/summarizeAudioFromBase64', async (req, res) => {
    try {
        const { base64Data, mimeType } = req.body;
        const model = getGeminiModel('gemini-1.5-flash');
        if (!model) throw new Error('Gemini OCR unavailable');
        const audioPart = { inlineData: { data: base64Data, mimeType } };
        const result = await model.generateContent(["Summarize accurately with bullet points.", audioPart]);
        res.json({ summary: result.response.text() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateCode', async (req, res) => {
    try {
        const { prompt, language } = req.body;
        const result = await aiProvider.generate(`Coding helper for ${language}: "${prompt}"`, { feature: 'code' });
        res.json({ code: result });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/extractTextFromFile', async (req, res) => {
    try {
        let { base64Data, mimeType } = req.body;
        if (!base64Data) throw new Error('No file data');
        const buffer = Buffer.from(base64Data, 'base64');
        let localText = '';

        try {
            if (mimeType === 'application/pdf') localText = (await pdf(buffer)).text || '';
            else if (mimeType?.includes('word')) localText = (await mammoth.extractRawText({ buffer })).value || '';
            else if (mimeType?.includes('text')) localText = buffer.toString('utf-8');
            
            if (localText.trim().length > 300) return res.json({ text: localText.trim() });
        } catch (e) { }

        // Cloud OCR Fallback (NVIDIA vision models don't support PDF directly via standard API yet, so we use Gemini/Groq)
        if (mimeType?.includes('image') && process.env.GROQ_API_KEY) {
            try {
                const text = await aiProvider.extractTextWithGroqVision(base64Data, mimeType, FILE_EXTRACTION_PROMPT);
                if (text?.length > 50) return res.json({ text });
            } catch (e) {}
        }

        const dataPart = { inlineData: { data: base64Data, mimeType: mimeType || 'application/pdf' } };
        const extractedText = await callGeminiWithRetry(FILE_EXTRACTION_PROMPT, dataPart);
        res.json({ text: extractedText });
    } catch (e) { 
        console.error(`[ExtractFromFile Error]: ${e.message}`, e.stack);
        res.status(500).json({ error: `AI Extraction Failed: ${e.message}` }); 
    }
});

router.post('/generateQuizQuestion', async (req, res) => {
    try {
        const { context, language } = req.body;
        let p = `Generate 1 MCQ from context: "${context}". Return JSON.`;
        if (language === 'mr') p += ' Lang: MARATHI.';
        const result = await aiProvider.generate(p, { feature: 'quiz', json: true });
        res.json({ question: result });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateQuizSet', async (req, res) => {
    try {
        const { context, count = 5, language } = req.body;
        const p = `Generate ${count} MCQs JSON: "${context}"`;
        const r = await aiProvider.generate(p, { feature: 'quiz', json: true });
        res.json({ quizSet: r });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/getStudySuggestions', async (req, res) => {
    try {
        const { reportJson } = req.body;
        const r = await aiProvider.generate(`Suggestions for: ${reportJson}`, { feature: 'suggestions' });
        res.json({ suggestions: r });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateKnowledgeMap', async (req, res) => {
    try {
        const { quizHistory } = req.body;
        const r = await aiProvider.generate(`Map proficiency for: ${JSON.stringify(quizHistory)} as JSON`, { feature: 'suggestions', json: true });
        res.json({ result: JSON.parse(r) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateFlashcards', async (req, res) => {
    try {
        const { context } = req.body;
        const r = await aiProvider.generate(`JSON flashcards for: "${context}"`, { feature: 'flashcards', json: true });
        res.json({ flashcards: r });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/getSuggestionForMood', async (req, res) => {
    try {
        const { mood, language } = req.body;
        const r = await aiProvider.generate(`Encouraging suggestion for ${mood} mood.`, { feature: 'mood' });
        res.json({ suggestion: r });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/breakDownGoal', async (req, res) => {
    try {
        const { goalTitle } = req.body;
        const r = await aiProvider.generate(`JSON steps for: ${goalTitle}`, { feature: 'goals', json: true });
        res.json({ breakdown: r });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateProjectIdeas', async (req, res) => {
    try {
        const { branch, interest, difficulty } = req.body;
        const r = await aiProvider.generate(`5 innovative project ideas for ${branch} interested in ${interest}. JSON.`, { feature: 'projectIdeas', json: true });
        res.json({ ideas: r });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateMockPaper', async (req, res) => {
    try {
        const { branch, subject } = req.body;
        const r = await aiProvider.generate(`MU Mock Paper for ${subject} (${branch}) as JSON.`, { feature: 'mockPaper', json: true });
        res.json({ paper: JSON.parse(r) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/streamVivaChat', async (req, res) => {
    try {
        const { message, subject, persona } = req.body;
        res.setHeader('Content-Type', 'text/event-stream');
        const stream = aiProvider.stream(message, { feature: 'viva', systemInstruction: `Act as MU Examiner for ${subject} in ${persona} mode.` });
        for await (const chunk of stream) res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        res.end();
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/streamFeynmanChat', async (req, res) => {
    try {
        const { message, topic } = req.body;
        res.setHeader('Content-Type', 'text/event-stream');
        const stream = aiProvider.stream(message, { feature: 'chat', systemInstruction: `Act as a 10yr old student named Nino learning about ${topic}.` });
        for await (const chunk of stream) res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        res.end();
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateHighlights', async (req, res) => {
    try {
        const r = await aiProvider.generate(`Return 5 JSON highlight strings from: "${req.body.text}"`, { feature: 'summarize', json: true });
        res.json({ highlights: JSON.parse(r) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateMindMap', async (req, res) => {
    try {
        const r = await aiProvider.generate(`Mermaid mindmap for: "${req.body.text}". Return only syntax.`, { feature: 'summarize' });
        res.json({ mindMap: r.replace(/```mermaid|```/g, '').trim() });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/simplify', async (req, res) => {
    try {
        const r = await aiProvider.generate(`Simplify this text for a 10 year old: "${req.body.text}"`, { feature: 'summarize' });
        res.json({ simplifiedText: r });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateResumeAnalysis', async (req, res) => {
    try {
        const r = await aiProvider.generate(`Analyze resume: ${JSON.stringify(req.body)}. Return JSON with summary and keywords.`, { feature: 'code', json: true });
        res.json(JSON.parse(r));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generatePersonalizedQuiz', async (req, res) => {
    try {
        const r = await aiProvider.generate(`Personalized MU quiz for: ${JSON.stringify(req.body)}. JSON format.`, { feature: 'quiz', json: true });
        res.json({ quiz: JSON.parse(r) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateTimedChallenge', async (req, res) => {
    try {
        const r = await aiProvider.generate(`Personalized timed challenge for: ${JSON.stringify(req.body)}. JSON format.`, { feature: 'quiz', json: true });
        res.json({ challenge: JSON.parse(r) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateFlashcardChallenge', async (req, res) => {
    try {
        const r = await aiProvider.generate(`Flashcard challenge for: ${JSON.stringify(req.body)}. JSON format.`, { feature: 'flashcards', json: true });
        res.json({ data: JSON.parse(r) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
