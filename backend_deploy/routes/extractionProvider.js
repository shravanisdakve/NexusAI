/**
 * Extraction Provider - GEMINI ONLY Strategy
 * Optimized for Gemini 2.0/1.5 Flash
 */

const express = require('express');
const router = express.Router();
const aiProvider = require('../services/aiProvider');
const ocrService = require('../services/ocrService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const pdfService = require('../services/pdfService');
const geminiService = require('../services/geminiService');
const axios = require('axios');

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
    // Force v1 to be safe for 1.5-flash
    return new GoogleGenerativeAI(keyPool[currentKeyIndex], { apiVersion: 'v1' });
};

const getGeminiModel = (modelName = 'gemini-1.5-flash', forceNext = false) => {
    const genAI = getGenAIInstance(forceNext);
    if (!genAI) return null;
    return genAI.getGenerativeModel({ model: modelName });
};

const callGeminiWithRetry = async (prompt, dataPart, retries = keyPool.length * 2) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        // Try 2.0 first, then rotate and try 1.5 if it fails.
        const modelName = i < keyPool.length ? 'gemini-2.0-flash' : 'gemini-1.5-flash';
        const forceNext = i > 0;
        
        try {
            const model = getGeminiModel(modelName, forceNext);
            if (!model) throw new Error('No Gemini model available');
            
            console.log(`[GeminiPool] Attempting ${modelName} with key index ${currentKeyIndex}...`);
            const result = await model.generateContent([prompt, dataPart]);
            return result.response.text().trim();
        } catch (error) {
            lastError = error;
            if (error.status === 429 || error.message?.includes('429')) {
                console.warn(`[GeminiPool] Key ${currentKeyIndex} (${modelName}) hit 429. Retrying...`);
                // Move to next key on 429
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
        const feature = 'chat'; // R-03 FIX: was referenced but never declared
        console.log(`[StreamChat] Lang: ${language}`);
        let systemInstruction = `You are a professional AI Mentor for Mumbai University (MU) Engineering students. 
        
        STRICT RESPONSE FORMAT:
        1. EXPLAIN (2-3 lines): Explain the concept clearly and concisely. Use "It's like..." analogies for complex topics.
        2. INTERACT (1 question): Ask one targeted question to check understanding or offer a specific next step.
        
        VOICE RULES:
        - Be direct. Dive straight into the explanation without introductory filler like "You're looking for..." or "I understand...".
        - Conversational mentor tone. Use contractions ("You're", "Let's").
        - NO ROBOTIC WORDS: "Additionally", "Furthermore", "Moreover", "As per syllabus".
        - Focus: MU Rev-2019/2024 C-Scheme.`;
        if (language === 'mr') systemInstruction += ' Respond ONLY in MARATHI (मराठी).';
        else if (language === 'hi') systemInstruction += ' Respond ONLY in HINDI (हिंदी).';

        console.log(`[StreamChat] Initializing response stream headers...`);
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        // Ensure the connection stays open by sending an immediate comment
        res.write(': nexusai-ping\n\n');

        console.log(`[StreamChat] Calling AI Provider for message: ${message.slice(0, 50)}...`);
        const stream = aiProvider.stream(message, { feature: feature || 'chat', systemInstruction });
        
        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
        console.log(`[StreamChat] Stream completed successfully.`);
        res.end();
    } catch (e) {
        console.error(`[AI Stream] CRITICAL Error: ${e.message}`, e);
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
        let systemInstruction = `You are a high-performance Nexus Study Buddy. 
        RULES:
        1. Be extremely concise. Max 3 lines per response.
        2. NO greetings, NO "I understand", NO "Sure thing".
        3. Use professional, academic tone (No emojis).
        4. Focus strictly on the material.
        
        NOTES CONTEXT:
        ---
        ${notes || 'No notes available'}
        ---`;
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

const getFullTextFromFile = async (base64Data, mimeType) => {
    if (!base64Data) throw new Error('No file data');
    
    const isPdf = mimeType === 'application/pdf' || (base64Data.startsWith('JVBERi') && !mimeType);
    const isImage = mimeType?.includes('image');
    const buffer = Buffer.from(base64Data, 'base64');
    let localText = '';

    // --- STAGE 1: LOCAL PARSING (Zero-Cost, High Speed) ---
    try {
        if (isPdf) {
            console.log("[Extraction] Attempting Local PDF Parse...");
            const data = await pdf(buffer);
            localText = data.text || '';
        } else if (mimeType?.includes('word')) {
            localText = (await mammoth.extractRawText({ buffer })).value || '';
        } else if (mimeType?.includes('text')) {
            localText = buffer.toString('utf-8');
        }

        // If local parsing is high quality (>300 chars), return immediately
        if (localText.trim().length > 300) {
            console.log(`[Extraction] Local parse successful (${localText.length} chars). Skipping AI.`);
            return localText.trim();
        }
    } catch (e) {
        console.warn("[Extraction] Local parse failed, moving to AI Stage.");
    }

    // --- STAGE 2: MULTIMODAL PDF CHUNKING (Advanced OCR) ---
    if (isPdf) {
        try {
            console.log("[Extraction] Local parse insufficient. Using Advanced Multimodal AI...");
            const chunks = await pdfService.splitPdfIntoChunks(buffer, 5);
            let fullText = '';
            
            for (let i = 0; i < chunks.length; i++) {
                console.log(`[Extraction] Processing PDF Chunk ${i + 1}/${chunks.length}...`);
                const chunkBase64 = chunks[i].toString('base64');
                const dataPart = { inlineData: { data: chunkBase64, mimeType: 'application/pdf' } };
                const chunkText = await callGeminiWithRetry(FILE_EXTRACTION_PROMPT, dataPart);
                fullText += chunkText + '\n\n';
            }

            if (fullText.trim().length > 100) {
                return fullText.trim();
            }
        } catch (pdfErr) {
            console.error(`[Extraction] Chunked PDF processing failed: ${pdfErr.message}. Falling back...`);
        }
    }

    // --- MULTIMODAL IMAGE STRATEGY ---
    if (isImage) {
        try {
            console.log("[Extraction] Image detected. Using Multimodal Vision...");
            const dataPart = { inlineData: { data: base64Data, mimeType: mimeType } };
            const extractedText = await callGeminiWithRetry(FILE_EXTRACTION_PROMPT, dataPart);
            if (extractedText?.length > 50) return extractedText;
        } catch (imgErr) {
            console.warn(`[Extraction] Multimodal Image fail: ${imgErr.message}`);
        }
    }

    // Last resort: standard Gemini call for other types
    const dataPart = { inlineData: { data: base64Data, mimeType: mimeType || 'application/pdf' } };
    return await callGeminiWithRetry(FILE_EXTRACTION_PROMPT, dataPart);
};

router.post('/extractTextFromFile', async (req, res) => {
    try {
        const { base64Data, mimeType } = req.body;
        const text = await getFullTextFromFile(base64Data, mimeType);
        res.json({ text });
    } catch (e) { 
        console.error(`[ExtractFromFile Error]: ${e.message}`, e.stack);
        res.status(500).json({ error: `AI Extraction Failed: ${e.message}` }); 
    }
});

router.post('/extractTextFromUrl', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) throw new Error("URL is required");

        console.log(`[RAG-Grounding] Fetching content from: ${url}`);
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const mimeType = response.headers['content-type'] || 'application/pdf';
        const base64Data = Buffer.from(response.data).toString('base64');
        
        const text = await getFullTextFromFile(base64Data, mimeType);
        res.json({ text, source: url });
    } catch (e) {
        console.error(`[URL Injection Error]: ${e.message}`);
        res.status(500).json({ error: `Could not ingest URL: ${e.message}` });
    }
});

router.post('/generateQuizFromFile', async (req, res) => {
    try {
        let { base64Data, mimeType, count = 5, language } = req.body;
        const text = await getFullTextFromFile(base64Data, mimeType);
        if (!text) throw new Error("Could not extract content from file for quiz generation.");

        const prompt = `Generate ${count} multiple choice questions from this context.
        RETURN ONLY RAW JSON ARRAY of objects with the following keys:
        'question' (string), 'options' (array of 4 strings), 'correctAnswer' (string, must exactly match one of the options), 'explanation' (string).
        Do not wrap in markdown or code blocks.
        Context: "${text.substring(0, 50000)}"`;
        
        const r = await aiProvider.generate(prompt, { feature: 'quiz', json: true });
        res.json({ quizSet: r });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateFlashcardsFromFile', async (req, res) => {
    try {
        let { base64Data, mimeType, language } = req.body;
        const text = await getFullTextFromFile(base64Data, mimeType);
        if (!text) throw new Error("Could not extract content from file for flashcards.");

        const prompt = `Based on the following context, generate a list of flashcards. Each flashcard should have a 'front' (a question or term) and a 'back' (the answer or definition).
        RETURN ONLY RAW JSON ARRAY of objects with keys 'front' and 'back'. Do not wrap in markdown or code blocks.
        Context: "${text.substring(0, 50000)}"`;
        
        const r = await aiProvider.generate(prompt, { feature: 'flashcards', json: true });
        res.json({ flashcards: r });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateQuizQuestion', async (req, res) => {
    try {
        const { context, language } = req.body;
        let p = `Generate 1 multiple choice question from the following context.
        RETURN ONLY RAW JSON object with the following keys:
        'question' (string), 'options' (array of 4 strings), 'correctAnswer' (string, must exactly match one of the options), 'explanation' (string).
        Do not wrap in markdown or code blocks.
        Context: "${context}"`;
        if (language === 'mr') p += ' Respond ONLY in MARATHI.';
        const result = await aiProvider.generate(p, { feature: 'quiz', json: true });
        res.json({ question: result });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateQuizSet', async (req, res) => {
    try {
        const { context, count = 5, language } = req.body;
        const prompt = `Generate ${count} multiple choice questions from this context.
        RETURN ONLY RAW JSON ARRAY of objects with the following keys:
        'question' (string), 'options' (array of 4 strings), 'correctAnswer' (string, must exactly match one of the options), 'explanation' (string).
        Do not wrap in markdown or code blocks.
        Context: "${context}"`;

        const r = await aiProvider.generate(prompt, { feature: 'quiz', json: true });
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

router.post('/generateMockPaper', async (req, res) => {
    try {
        const { branch, subject, year, semester } = req.body;
        const quickFallbackPaper = () => ({
            subject: subject || 'Engineering Subject',
            time: '3 Hours',
            totalMarks: 80,
            instructions: [
                'Attempt any two questions from each section.',
                'Assume suitable data where required.',
                'Draw neat labeled diagrams wherever necessary.'
            ],
            questions: [
                {
                    number: 1,
                    title: `Section A (${branch || 'Core'})`,
                    totalMarks: 20,
                    subQuestions: [
                        { text: `Explain core concepts of ${subject || 'the subject'} with one practical example.`, marks: 10 },
                        { text: `Differentiate two key approaches used in ${subject || 'this subject'}.`, marks: 10 }
                    ]
                },
                {
                    number: 2,
                    title: `Section B (${year || 'SE'} Level)`,
                    totalMarks: 20,
                    subQuestions: [
                        { text: `Solve a representative problem from ${subject || 'the syllabus'} step by step.`, marks: 10 },
                        { text: 'Write short notes on performance, complexity, and trade-offs.', marks: 10 }
                    ]
                },
                {
                    number: 3,
                    title: `Section C (Semester ${semester || 'N/A'})`,
                    totalMarks: 20,
                    subQuestions: [
                        { text: 'Design a small real-world use case and justify your approach.', marks: 10 },
                        { text: 'Discuss common errors and suggest reliable debugging strategy.', marks: 10 }
                    ]
                },
                {
                    number: 4,
                    title: 'Section D (Applied/Case Study)',
                    totalMarks: 20,
                    subQuestions: [
                        { text: 'Analyze a case-study scenario and propose an implementation plan.', marks: 10 },
                        { text: 'State testing criteria and evaluation metrics for the solution.', marks: 10 }
                    ]
                }
            ]
        });

        const p = `Generate a concise Mumbai University (MU) engineering mock exam paper quickly.
        Subject: ${subject}
        Branch: ${branch}
        Year/Sem: ${year}, ${semester}

        Output EXACT JSON:
        {
          "subject": "string",
          "time": "3 Hours",
          "totalMarks": 80,
          "instructions": ["string"],
          "questions": [
            {
              "number": number,
              "title": "string (e.g. Attempt any two)",
              "totalMarks": number,
              "subQuestions": [
                { "text": "string (markdown allowed)", "marks": number }
              ]
            }
          ]
        }

        Constraints:
        - Return exactly 4 questions.
        - Each question must contain exactly 2 subQuestions.
        - Keep each subQuestion text short (max 18 words).
        - Do not add explanations outside JSON.`;

        const toText = (value) => (typeof value === 'string' ? value : JSON.stringify(value ?? {}));
        const extractJsonObject = (value) => {
            const text = toText(value).replace(/```json|```/gi, '').trim();
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start === -1 || end === -1 || end <= start) return text;
            return text.slice(start, end + 1);
        };
        const repairEscapes = (value) =>
            String(value)
                .replace(/[\u201C\u201D]/g, '"')
                .replace(/[\u2018\u2019]/g, "'")
                .replace(/,\s*([}\]])/g, '$1')
                // Escape invalid backslashes that break JSON.parse
                .replace(/\\(?!["\\/bfnrtu])/g, '\\\\');

        const modelCandidates = (
            process.env.MOCK_PAPER_MODELS ||
            process.env.MOCK_PAPER_MODEL ||
            'gemini-1.5-flash,gemini-1.5-pro'
        )
            .split(',')
            .map((m) => m.trim())
            .filter(Boolean);

        let r = null;
        let lastModelError = null;
        const startedAt = Date.now();
        const hardDeadlineMs = 22000;
        for (const modelName of modelCandidates) {
            if (Date.now() - startedAt > hardDeadlineMs) break;
            try {
                r = await aiProvider.generate(p, {
                    feature: 'mockPaper',
                    json: true,
                    model: modelName,
                    fast: true,
                    temperature: 0.1,
                    maxTokens: 420,
                    timeoutMs: 12000
                });
                if (r) break;
            } catch (err) {
                lastModelError = err;
                console.warn(`[MockPaper] Model ${modelName} failed: ${err.message}`);
            }
        }

        if (!r) {
            console.warn(`[MockPaper] Falling back to instant template: ${lastModelError?.message || 'deadline exceeded'}`);
            return res.json({ paper: quickFallbackPaper(), source: 'fallback-template' });
        }

        const candidates = [
            toText(r),
            extractJsonObject(r),
            repairEscapes(extractJsonObject(r)),
            repairEscapes(toText(r))
        ];

        let parsed = null;
        let lastError = null;
        for (const candidate of candidates) {
            if (!candidate) continue;
            try {
                parsed = JSON.parse(candidate);
                break;
            } catch (err) {
                lastError = err;
            }
        }

        if (!parsed || typeof parsed !== 'object') {
            throw new Error(lastError?.message || 'Failed to parse mock paper JSON');
        }

        // Normalize AI output into UI-required shape
        const normalized = {
            subject: parsed.subject || subject || 'Engineering Subject',
            time: parsed.time || '3 Hours',
            totalMarks: Number(parsed.totalMarks) || 80,
            instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
            questions: []
        };

        let rawQuestions = [];
        if (Array.isArray(parsed.questions)) rawQuestions = parsed.questions;
        else if (Array.isArray(parsed.questionPaper)) rawQuestions = parsed.questionPaper;
        else if (Array.isArray(parsed.sections)) rawQuestions = parsed.sections;

        normalized.questions = rawQuestions.map((q, index) => {
            const subRaw = Array.isArray(q?.subQuestions)
                ? q.subQuestions
                : Array.isArray(q?.parts)
                    ? q.parts
                    : [];
            return {
                number: Number(q?.number) || index + 1,
                title: q?.title || `Question ${index + 1}`,
                totalMarks: Number(q?.totalMarks) || 20,
                subQuestions: subRaw
                    .map((sub) => ({
                        text: String(sub?.text || sub?.question || '').trim(),
                        marks: Number(sub?.marks) || 10
                    }))
                    .filter((sub) => sub.text.length > 0)
            };
        }).filter((q) => q.subQuestions.length > 0);

        // Guarantee usable output for frontend rendering
        if (normalized.questions.length === 0) {
            return res.json({ paper: quickFallbackPaper(), source: 'normalized-fallback' });
        }
        if (normalized.instructions.length === 0) {
            normalized.instructions = quickFallbackPaper().instructions;
        }

        res.json({ paper: normalized });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateFlashcards', async (req, res) => {
    try {
        const { context } = req.body;
        const prompt = `Based on the following context, generate a list of flashcards. Each flashcard should have a 'front' (a question or term) and a 'back' (the answer or definition).
        RETURN ONLY RAW JSON ARRAY of objects with keys 'front' and 'back'. Do not wrap in markdown or code blocks.
        Context: "${context}"`;
        const r = await aiProvider.generate(prompt, { feature: 'flashcards', json: true });
        res.json({ flashcards: r });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/getSuggestionForMood', async (req, res) => {
    try {
        const { mood } = req.body;
        // Super punchy prompt
        const prompt = `Student feels ${mood}. Give one extremely short, punchy academic motivation.`;
        
        const systemInstruction = `You are a strict high-performance coach.
        1. Respond with MAX 1 short sentence.
        2. NO greetings, NO empathy, NO "I understand".
        3. Start IMMEDIATELY with the motivation.
        4. Focus on exam victory and focus.`;
        
        let r = await aiProvider.generate(prompt, { 
            feature: 'mood', 
            systemInstruction,
            maxTokens: 25 
        });
        
        // If the AI provider returns the emergency fallback message (system overloaded)
        // We should provide a much better academic-specific fallback for mood.
        if (r.includes('high volume of student queries') || r.includes('syncing')) {
            const defaults = [
                "Stay focused. Excellence is a habit!",
                "One step at a time. You've got this!",
                "Turn your pressure into power today!",
                "Focus on the progress, not the perfection!",
                "Keep going. Future you will thank you!"
            ];
            const fallback = defaults[Math.floor(Math.random() * defaults.length)];
            return res.json({ suggestion: fallback });
        }

        // Surgical cleanup for real AI responses
        let clean = r.split('\n')[0].split('. ')[0].replace(/[".]/g, '').trim();
        
        // Ensure some minimum length but cap it reasonably
        if (!clean || clean.length < 5) clean = "Keep pushing forward!";
        if (clean.length > 60) clean = clean.substring(0, 57) + '...';
        
        res.json({ suggestion: clean + "!" });
    } catch (e) { 
        res.json({ suggestion: "Stay focused. Excellence is a habit!" });
    }
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
        const prompt = `Generate 5 unique and innovative engineering project ideas.
        Branch: ${branch}
        Area of Interest: ${interest}
        Difficulty Level: ${difficulty}

        Context: The student is likely from Mumbai University. innovative projects that solve local problems (Mumbai/India) or follow current industry trends are highly appreciated.
        Ensure a mix of software, hardware (if applicable), and research-based ideas.

        Return ONLY a JSON array of objects with the exact keys: "title", "description", "techStack" (array of strings).`;
        
        const r = await aiProvider.generate(prompt, { feature: 'projectIdeas', json: true });
        res.json({ ideas: r });
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
        const systemInstruction = `You are "Nino", a curious 10-year-old learning about ${topic}.
        
        RULES:
        1. Use very simple language. Short sentences only.
        2. Be concise. Max 2-3 sentences.
        3. Act interested but slightly confused if they use big words.
        4. End with ONE simple "why" or "how" question.
        5. NO complex paragraphs. NO bullet points.`;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = aiProvider.stream(message, { feature: 'chat', systemInstruction });
        for await (const chunk of stream) res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        res.end();
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/getFeynmanFeedback', async (req, res) => {
    try {
        const { topic, explanation, notes, language } = req.body;
        const p = `Evaluate Feynman Technique explanation for "${topic}". Context: "${notes || ''}". Student explanation: "${explanation}". Return JSON with clarityScore(1-10), jargon(array), gaps(array), analogySuggestions(array), verdict(string), improvement(string).`;
        const r = await aiProvider.generate(p, { feature: 'chat', json: true });
        res.json(JSON.parse(r));
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
        const prompt = `Analyze this candidate data and generate a professional resume profile. 
If the candidate data contains raw extracted text (e.g. from a PDF), also extract and structure their technical skills, projects, and achievements.

Candidate Data:
Target Role: ${req.body.targetRole}
Extracted Text/Context: ${req.body.skills} ${req.body.projects || ''}

Output ONLY valid JSON:
{ 
  "summary": "3-sentence professional summary focus on outcomes", 
  "keywords": ["ATS", "Keywords", "15 total"],
  "extractedSkills": "Technical Skills (comma separated)",
  "extractedProjects": "Detailed Project List (newline separated)",
  "extractedAchievements": "Achievements (newline separated)",
  "name": "Full Name if found in notes"
}`;

        const result = await aiProvider.generate(prompt, { feature: 'code', json: true });
        res.json(typeof result === 'string' ? JSON.parse(result) : result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generatePersonalizedQuiz', async (req, res) => {
    try {
        const { weakTopics, targetExam, difficulty, questionCount } = req.body;
        const p = `Generate a personalized MU academic quiz for a student struggling with: ${weakTopics}.
        Target Exam: ${targetExam}
        Difficulty: ${difficulty}
        Count: ${questionCount}
        
        Output exact JSON:
        {
          "title": "string",
          "recommendedTimeMinutes": number,
          "questions": [
            {
              "id": "string",
              "type": "mcq",
              "topic": "string",
              "question": "string",
              "options": ["string", "string", "string", "string"],
              "correctAnswer": "string (one of the options)",
              "explanation": "string"
            }
          ]
        }`;
        const r = await aiProvider.generate(p, { feature: 'quiz', json: true });
        const parsed = JSON.parse(r);
        res.json({ quiz: parsed });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateTimedChallenge', async (req, res) => {
    try {
        const { mode, weakTopics, timeAvailableMinutes } = req.body;
        const p = `Generate a ${mode} timed academic challenge for topics: ${weakTopics}.
        Time available: ${timeAvailableMinutes} minutes.
        
        Output exact JSON:
        {
          "mode": "${mode}",
          "title": "string",
          "description": "string",
          "rules": ["string"],
          "questions": [
            {
              "id": "string",
              "type": "mcq",
              "topic": "string",
              "question": "string",
              "options": ["string", "string", "string", "string"],
              "correctAnswer": "string (exact match with option)",
              "timeLimitSeconds": number (e.g. 15)
            }
          ]
        }`;
        const r = await aiProvider.generate(p, { feature: 'quiz', json: true });
        const parsed = JSON.parse(r);
        if (!parsed.questions) parsed.questions = [];
        res.json({ challenge: parsed });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/generateFlashcardChallenge', async (req, res) => {
    try {
        const { weakTopics, count } = req.body;
        const p = `Generate ${count} flashcards for: ${weakTopics}.
        
        Output exact JSON:
        {
          "title": "string",
          "flashcards": [
            { "id": "string", "topic": "string", "front": "string", "back": "string" }
          ],
          "errorFixItems": [
            { "id": "string", "topic": "string", "brokenStatementOrCode": "string", "task": "string", "solution": "string" }
          ]
        }`;
        const r = await aiProvider.generate(p, { feature: 'flashcards', json: true });
        const parsed = JSON.parse(r);
        res.json({ data: parsed });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
