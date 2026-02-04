const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Initialize Gemini with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, { apiVersion: 'v1beta' });

// Helper to get model
const getModel = (modelName = 'gemini-2.0-flash', systemInstruction = null) => {
    const config = { model: modelName };
    if (systemInstruction) {
        config.systemInstruction = systemInstruction;
    }
    return genAI.getGenerativeModel(config);
};

// --- AI TUTOR SERVICE ---
router.post('/streamChat', async (req, res) => {
    try {
        const { message, language } = req.body;
        let systemInstruction = 'You are an expert AI Tutor. Your goal is to help users understand complex topics by providing clear explanations, step-by-step examples, and asking probing questions to test their knowledge. Be patient, encouraging, and adapt your teaching style to the user\'s needs.';

        if (language === 'mr') {
            systemInstruction += ' IMPORTANT: Respond ONLY in MARATHI (मराठी).';
        } else if (language === 'hi') {
            systemInstruction += ' IMPORTANT: Respond ONLY in HINDI (हिंदी).';
        }

        const model = getModel('gemini-2.0-flash', systemInstruction);

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
        const { message, notes, language } = req.body;
        let systemInstruction = `You are an expert AI Study Buddy. The user has provided the following notes to study from:
---
${notes || 'No notes provided yet.'}
---
Your knowledge is strictly limited to the text provided above. You CANNOT use any external information. When responding to the user:
1. First, determine if the user's question can be answered using ONLY the provided notes.
2. If the answer is in the notes, provide a comprehensive answer based exclusively on that text.
3. If the answer is NOT in the notes, you MUST begin your response with the exact phrase: "Based on the provided notes, I can't find information on that topic." After this phrase, you may optionally and briefly mention what the notes DO cover. Do not try to answer the original question.`;

        if (language === 'mr') {
            systemInstruction += ' IMPORTANT: Respond ONLY in MARATHI (मराठी).';
        } else if (language === 'hi') {
            systemInstruction += ' IMPORTANT: Respond ONLY in HINDI (हिंदी).';
        }

        const model = getModel('gemini-2.0-flash', systemInstruction);
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
        const { prompt, aspectRatio = '16:9' } = req.body;

        // Use Pollinations.ai for fast, persistent pedagogical image generation
        // Format: https://image.pollinations.ai/prompt/[prompt]?width=[w]&height=[h]&nologo=true
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

// --- NOTE SUMMARIZATION SERVICE ---
router.post('/summarizeText', async (req, res) => {
    try {
        const { text, language } = req.body;
        const model = getModel('gemini-2.0-flash');
        let prompt = `Summarize the following academic text or notes. Focus on extracting the key concepts, definitions, and main arguments. Present the summary in a clear, structured format, using bullet points or numbered lists where appropriate. Text: "${text}"`;

        if (language === 'mr') {
            prompt += ' IMPORTANT: Return the entire summary ONLY in MARATHI (मराठी).';
        } else if (language === 'hi') {
            prompt += ' IMPORTANT: Return the entire summary ONLY in HINDI (हिंदी).';
        }

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
        const model = getModel('gemini-2.0-flash');

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
        const model = getModel('gemini-2.0-flash');
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
        let { base64Data, mimeType } = req.body;
        const model = getModel('gemini-2.0-flash');

        // Fallback for missing or generic mime types
        if (!mimeType || mimeType === 'application/octet-stream') {
            console.warn("[extractTextFromFile] Missing or generic mimeType, using application/pdf as fallback");
            mimeType = 'application/pdf';
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

// --- QUIZ GENERATION SERVICE ---
router.post('/generateQuizQuestion', async (req, res) => {
    try {
        const { context, language } = req.body;
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        let prompt = `Based on the following context, generate a single multiple-choice quiz question to test understanding. The question should focus on a key concept from the text. 
        RETURN ONLY RAW JSON. Do not wrap in markdown or code blocks.`;

        if (language === 'mr') {
            prompt += ' IMPORTANT: All textual fields in the JSON (topic, question, options) MUST be in MARATHI (मराठी).';
        } else if (language === 'hi') {
            prompt += ' IMPORTANT: All textual fields in the JSON (topic, question, options) MUST be in HINDI (हिंदी).';
        }

        prompt += `
        
        Context: "${context.substring(0, 4000)}"
        
        The JSON must match this schema:
        {
            "topic": "string",
            "question": "string",
            "options": ["string", "string", "string", "string"],
            "correctOptionIndex": number
        }`;

        const result = await model.generateContent(prompt);
        const cleanedResponse = result.response.text().replace(/```json|```/g, '').trim();
        res.json({ question: cleanedResponse });
    } catch (error) {
        console.error("Error in generateQuizQuestion:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/generateQuizSet', async (req, res) => {
    try {
        const { context, count = 5, language } = req.body;
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        let prompt = `Based on the provided notes/context, generate a set of ${count} multiple-choice quiz questions.
        Focus on testing key concepts, definitions, and applications.
        RETURN ONLY RAW JSON. Do not wrap in markdown or code blocks.`;

        if (language === 'mr') {
            prompt += ' IMPORTANT: All textual fields in the JSON (topic, question, options) MUST be in MARATHI (मराठी).';
        } else if (language === 'hi') {
            prompt += ' IMPORTANT: All textual fields in the JSON (topic, question, options) MUST be in HINDI (हिंदी).';
        }

        prompt += `

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

        const result = await model.generateContent(prompt);
        res.json({ quizSet: result.response.text() });
    } catch (error) {
        console.error("Error in generateQuizSet:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- AI STUDY SUGGESTIONS SERVICE ---
router.post('/getStudySuggestions', async (req, res) => {
    try {
        const { reportJson, language } = req.body;
        const model = getModel('gemini-2.0-flash');
        let prompt = `You are an expert academic advisor for engineering students (specifically Mumbai University context). 
        Based on the following JSON data of a student's weekly performance, provide 3-4 specific, actionable suggestions.
        Considering Mumbai University's pattern, emphasize the importance of consistent practice and concept clarity.`;

        if (language === 'mr') {
            prompt += ' IMPORTANT: Return your suggestions ONLY in MARATHI (मराठी).';
        } else if (language === 'hi') {
            prompt += ' IMPORTANT: Return your suggestions ONLY in HINDI (हिंदी).';
        }

        prompt += `
        
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
        const { context, language } = req.body;
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        let prompt = `Based on the following context, generate a list of flashcards. Each flashcard should have a 'front' (a question or term) and a 'back' (the answer or definition).
        RETURN ONLY RAW JSON. Do not wrap in markdown or code blocks.`;

        if (language === 'mr') {
            prompt += ' IMPORTANT: All textual fields in the JSON (front, back) MUST be in MARATHI (मराठी).';
        } else if (language === 'hi') {
            prompt += ' IMPORTANT: All textual fields in the JSON (front, back) MUST be in HINDI (हिंदी).';
        }

        prompt += `
        
        Context: "${context.substring(0, 4000)}"
        
        Schema:
        [
            { "front": "string", "back": "string" }
        ]`;

        const result = await model.generateContent(prompt);
        const cleanedResponse = result.response.text().replace(/```json|```/g, '').trim();
        res.json({ flashcards: cleanedResponse });
    } catch (error) {
        console.error("Error in generateFlashcards:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/getSuggestionForMood', async (req, res) => {
    try {
        const { mood } = req.body;
        const model = getModel('gemini-2.0-flash');
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
        const { goalTitle, language } = req.body;
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        let prompt = `A user has set the following academic goal: "${goalTitle}".
        Break this high-level goal down into a short list of 3-5 small, actionable sub-tasks.
        Return ONLY a JSON array of strings.`;

        if (language === 'mr') {
            prompt += ' IMPORTANT: All sub-tasks in the array MUST be in MARATHI (मराठी).';
        } else if (language === 'hi') {
            prompt += ' IMPORTANT: All sub-tasks in the array MUST be in HINDI (हिंदी).';
        }

        prompt += `
        Example: ["Understand JSX syntax", "Learn about components and props"]`;

        const result = await model.generateContent(prompt);
        const cleanedResponse = result.response.text().replace(/```json|```/g, '').trim();
        res.json({ breakdown: cleanedResponse });
    } catch (error) {
        console.error("Error in breakDownGoal:", error);
        res.status(500).json({ error: error.message });
    }
});


// --- PROJECT IDEA GENERATOR SERVICE ---
router.post('/generateProjectIdeas', async (req, res) => {
    try {
        const { branch, interest, difficulty, language } = req.body;
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        let prompt = `Generate 5 unique and innovative engineering project ideas.
        Branch: ${branch}
        Area of Interest: ${interest}
        Difficulty Level: ${difficulty}

        Context: The student is likely from Mumbai University. innovative projects that solve local problems (Mumbai/India) or follow current industry trends are highly appreciated. 
        Ensure a mix of software, hardware (if applicable), and research-based ideas.

        Return ONLY a JSON array of objects.`;

        if (language === 'mr') {
            prompt += ' IMPORTANT: All textual fields in the JSON (title, description, techStack) MUST be in MARATHI (मराठी).';
        } else if (language === 'hi') {
            prompt += ' IMPORTANT: All textual fields in the JSON (title, description, techStack) MUST be in HINDI (हिंदी).';
        }

        prompt += `
        Schema:
        [
            { "title": "string", "description": "string", "techStack": ["string", "string"] }
        ]`;

        const result = await model.generateContent(prompt);
        const cleanedResponse = result.response.text().replace(/```json|```/g, '').trim();
        res.json({ ideas: cleanedResponse });
    } catch (error) {
        console.error("Error in generateProjectIdeas:", error);
        res.status(500).json({ error: error.message });
    }
});


// --- MOCK PAPER GENERATOR SERVICE ---
router.post('/generateMockPaper', async (req, res) => {
    try {
        const { branch, subject, year, language } = req.body;
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        let prompt = `Generate a comprehensive engineering exam mock question paper for Mumbai University.
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

        Return ONLY a JSON object matching this exact schema:`;

        if (language === 'mr') {
            prompt += ' IMPORTANT: All human-readable textual fields in the JSON (subject, instructions, question titles, subQuestion text) MUST be in MARATHI (मराठी).';
        } else if (language === 'hi') {
            prompt += ' IMPORTANT: All human-readable textual fields in the JSON (subject, instructions, question titles, subQuestion text) MUST be in HINDI (हिंदी).';
        }

        prompt += `
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

        const result = await model.generateContent(prompt);
        const cleanedResponse = result.response.text().replace(/```json|```/g, '').trim();
        res.json({ paper: JSON.parse(cleanedResponse) });
    } catch (error) {
        console.error("Error in generateMockPaper:", error);
        res.status(500).json({ error: error.message });
    }
});


// --- VIVA SIMULATOR SERVICE ---
router.post('/streamVivaChat', async (req, res) => {
    try {
        const { message, subject, branch, persona = 'Standard', language } = req.body;

        let systemInstruction = `You are an External Examiner for the Mumbai University (MU) Engineering Viva Voce. 
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

        if (language === 'mr') {
            systemInstruction += ' IMPORTANT: Respond ONLY in MARATHI (मराठी).';
        } else if (language === 'hi') {
            systemInstruction += ' IMPORTANT: Respond ONLY in HINDI (हिंदी).';
        }

        const model = getModel('gemini-2.0-flash', systemInstruction);
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
        console.error("Error in streamVivaChat:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- FEYNMAN TECHNIQUE SERVICE ---
router.post('/streamFeynmanChat', async (req, res) => {
    try {
        const { message, topic, notes, language } = req.body;

        let systemInstruction = `You are a curious, non-expert student (a 10-year-old named "Nino") who wants to learn about "${topic}".
        The user is trying to teach you this concept using the Feynman Technique.
        
        Your Goal:
        1. Act like you know NOTHING about the technical side of ${topic}.
        2. Ask innocent but deep "Why?" and "How?" questions.
        3. If the user uses jargon or complex academic language, stop them and say "I don't understand that big word, can you explain it like I'm 10?"
        4. Do not offer definitions yourself. You are the LEARNER.
        
        Notes context if available:
        ---
        ${notes || 'No specific notes provided.'}
        ---
        
        Current Behavior:
        - Be friendly and curious.
        - If the user's explanation is too short, ask for an analogy.
        - If the user is being too formal, ask for a real-world example from Mumbai/India context.
        
        Wait for the user to start teaching you.`;

        if (language === 'mr') {
            systemInstruction += ' IMPORTANT: Respond ONLY in MARATHI (मराठी).';
        } else if (language === 'hi') {
            systemInstruction += ' IMPORTANT: Respond ONLY in HINDI (हिंदी).';
        }

        const model = getModel('gemini-2.0-flash', systemInstruction);
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
        console.error("Error in streamFeynmanChat:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/getFeynmanFeedback', async (req, res) => {
    try {
        const { topic, explanation, notes, language } = req.body;
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        let prompt = `You are an expert pedagogy analyzer. Evaluate the user's explanation of "${topic}" using the Feynman Technique principles.
        
        Context (Reference Notes):
        ${notes}
        
        User's Explanation:
        "${explanation}"
        
        Analyze the following and return ONLY a JSON object:`;

        if (language === 'mr') {
            prompt += ' IMPORTANT: All textual fields in the JSON (verdict, improvement, gaps, analogySuggestions) MUST be in MARATHI (मराठी).';
        } else if (language === 'hi') {
            prompt += ' IMPORTANT: All textual fields in the JSON (verdict, improvement, gaps, analogySuggestions) MUST be in HINDI (हिंदी).';
        }

        prompt += `
        1. Clarity Score (1-10)
        2. Jargon Detected (List of complex words used without explanation)
        3. Knowledge Gaps (What key parts of the concept were missed or explained incorrectly?)
        4. Missing Analogies (How could they use a better comparison?)
        5. Final Verdict (A short summary of how well they taught it)
        6. Suggested Improvement (One specific thing to change)

        JSON Schema:
        {
            "clarityScore": number,
            "jargon": ["string"],
            "gaps": ["string"],
            "analogySuggestions": ["string"],
            "verdict": "string",
            "improvement": "string"
        }`;

        const result = await model.generateContent(prompt);
        const cleanedResponse = result.response.text().replace(/```json|```/g, '').trim();
        res.json(JSON.parse(cleanedResponse));
    } catch (error) {
        console.error("Error in getFeynmanFeedback:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

