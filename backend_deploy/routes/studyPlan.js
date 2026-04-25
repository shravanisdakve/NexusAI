const express = require('express');
const router = express.Router();
const StudyPlan = require('../models/StudyPlan');
const auth = require('../middleware/auth');
const aiProvider = require('../services/aiProvider');

const stripCodeFences = (value = '') =>
    String(value)
        .replace(/^\s*```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();

const extractJsonPayload = (value = '') => {
    const text = stripCodeFences(value);
    const firstObject = text.indexOf('{');
    const firstArray = text.indexOf('[');
    const hasObject = firstObject !== -1;
    const hasArray = firstArray !== -1;

    if (!hasObject && !hasArray) return text;

    const start =
        hasObject && hasArray
            ? Math.min(firstObject, firstArray)
            : hasObject
                ? firstObject
                : firstArray;

    const startChar = text[start];
    const end = startChar === '{' ? text.lastIndexOf('}') : text.lastIndexOf(']');
    if (end === -1 || end <= start) return text.slice(start).trim();
    return text.slice(start, end + 1).trim();
};

const repairJsonText = (value = '') =>
    String(value)
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/,\s*([}\]])/g, '$1')
        .trim();

const parseStudyPlanJson = (raw) => {
    console.log(`[StudyPlan] Starting JSON parse. Raw length: ${String(raw).length}`);
    const base = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
    const extracted = extractJsonPayload(base);
    console.log(`[StudyPlan] Extracted payload snippet: ${extracted.substring(0, 100)}...`);
    
    const attempts = [
        extracted,
        repairJsonText(extracted),
        repairJsonText(stripCodeFences(base)),
    ];

    for (const attempt of attempts) {
        if (!attempt) continue;
        try {
            const parsed = JSON.parse(attempt);
            // Check for both 'days' structure and raw array
            if (parsed && (parsed.days || Array.isArray(parsed))) {
                return parsed;
            }
        } catch {
            // Try next variant.
        }
    }

    console.error(`[StudyPlan] All parse attempts failed. Raw response: ${base}`);
    throw new Error('AI returned invalid study plan JSON structure');
};

// Test route to verify router is loaded
router.get('/test', (req, res) => {
    res.json({ message: "Study Plan router is working" });
});

// Get the most recently updated study plan for the user across all courses
router.get('/latest', auth, async (req, res) => {
    try {
        const plan = await StudyPlan.findOne({ user: req.user.id })
            .sort({ updatedAt: -1 })
            .populate('courseId', 'name color');
        
        if (!plan) return res.json(null);
        res.json(plan);
    } catch (err) {
        console.error(`[StudyPlan] GET Latest Error:`, err);
        res.status(500).json({ error: 'Failed to retrieve latest study plan' });
    }
});

// Get study plan for a course
router.get('/:courseId', auth, async (req, res) => {
    try {
        const plan = await StudyPlan.findOne({ user: req.user.id, courseId: req.params.courseId });
        if (!plan) return res.json(null);
        res.json(plan);
    } catch (err) {
        console.error(`[StudyPlan] GET Error:`, err);
        res.status(500).json({ error: 'Failed to retrieve study plan', details: err.message });
    }
});

// Create or update study plan
router.post('/', auth, async (req, res) => {
    const { courseId, goal, durationDays, startDate, days } = req.body;

    // Validate required fields before hitting the DB
    if (!courseId || !goal || !durationDays || !startDate) {
        return res.status(400).json({ error: 'Missing required fields: courseId, goal, durationDays, startDate' });
    }
    if (!Array.isArray(days) || days.length === 0) {
        return res.status(400).json({ error: 'Study plan must include at least one day' });
    }

    try {
        let plan = await StudyPlan.findOne({ user: req.user.id, courseId });
        if (plan) {
            plan.goal = goal;
            plan.durationDays = durationDays;
            plan.startDate = startDate;
            plan.days = days;
            await plan.save();
        } else {
            plan = new StudyPlan({
                user: req.user.id,
                courseId,
                goal,
                durationDays,
                startDate: new Date(startDate),
                days
            });
            await plan.save();
        }
        res.json(plan);
    } catch (err) {
        console.error(`[StudyPlan] POST Error:`, err);
        res.status(500).json({ error: 'Failed to save study plan', details: err.message });
    }
});

// Update task completion
router.patch('/task', auth, async (req, res) => {
    const { courseId, dayIndex, taskId, completed } = req.body;

    if (!courseId || dayIndex == null || !taskId || completed == null) {
        return res.status(400).json({ error: 'Missing required fields: courseId, dayIndex, taskId, completed' });
    }

    try {
        const plan = await StudyPlan.findOne({ user: req.user.id, courseId });
        if (!plan) return res.status(404).json({ error: 'Study plan not found' });

        const day = plan.days[dayIndex];
        if (!day) return res.status(404).json({ error: `Day at index ${dayIndex} not found in plan` });

        // Flexible lookup: Try to find by _id first, then fallback to index
        let task;
        if (require('mongoose').Types.ObjectId.isValid(taskId)) {
            task = day.tasks.id(taskId);
        }
        
        if (!task) {
            const idx = parseInt(taskId);
            if (!isNaN(idx) && day.tasks[idx]) {
                task = day.tasks[idx];
            }
        }

        if (!task) return res.status(404).json({ error: `Task ${taskId} not found` });

        task.completed = Boolean(completed);
        await plan.save();
        res.json(plan);
    } catch (err) {
        console.error(`[StudyPlan] PATCH Error:`, err);
        res.status(500).json({ error: 'Failed to update task', details: err.message });
    }
});

// AI Generation Route (Using Multi-Provider)
router.post('/generate', auth, async (req, res) => {
    console.log(`[StudyPlan] GENERATE request received`);
    try {
        const { goal, durationDays, notesContext, language } = req.body;
        const contextLimit = 1200; // Keep prompt compact for faster local generation
        let prompt = `You are an expert personalized academic advisor for engineering students. 
        A student wants to achieve the following goal: "${goal}" in ${durationDays} days.
        They have provided the following notes context for their course:
        ---
        ${(notesContext || '').substring(0, contextLimit)}
        ---
        Based on this, generate a structured, day-by-day study plan.
        Keep it concise and practical. Each day should have exactly 2 specific tasks.
        Task types MUST be one of: 'note' (reviewing notes), 'quiz' (taking a practice quiz), 'study-room' (collaborative session), or 'review' (general review).
        Make the plan realistic and progressive.`;

        if (language === 'mr') {
            prompt += ' IMPORTANT: All human-readable textual fields in the JSON (title, description) MUST be in MARATHI (मराठी).';
        } else if (language === 'hi') {
            prompt += ' IMPORTANT: All human-readable textual fields in the JSON (title, description) MUST be in HINDI (हिंदी).';
        }

        prompt += `
        
        Return ONLY a raw JSON object string. No conversational text.
        
        JSON Structure:
        {
            "days": [
                {
                    "day": number,
                    "focus": "string",
                    "tasks": [
                        { "title": "string", "description": "string", "type": "note"|"quiz"|"study-room"|"review" }
                    ]
                }
            ]
        }`;

        console.log(`[StudyPlan] Requesting generation from Hybrid Provider chain...`);
        const result = await aiProvider.generate(prompt, {
            feature: 'studyPlan',
            model: 'phi3:latest',
            fast: true,
            json: true,
            maxTokens: 384,
            timeoutMs: 90000,
            temperature: 0.1 // Lower temperature for more predictable JSON
        });

        if (!result) throw new Error('AI Provider returned an empty response.');

        let rawResponse = typeof result === 'string' ? result : JSON.stringify(result);
        
        // --- STAGE 1: Aggressive Extraction ---
        // Find the first { or [ and the last } or ]
        const start = Math.min(
            rawResponse.indexOf('{') === -1 ? Infinity : rawResponse.indexOf('{'),
            rawResponse.indexOf('[') === -1 ? Infinity : rawResponse.indexOf('[')
        );
        const end = Math.max(
            rawResponse.lastIndexOf('}'),
            rawResponse.lastIndexOf(']')
        );

        if (start === Infinity || end === -1 || end <= start) {
            console.error(`[StudyPlan] AI returned non-JSON content: ${rawResponse.substring(0, 100)}...`);
            throw new Error('AI output did not contain valid JSON structure.');
        }

        const jsonSegment = rawResponse.substring(start, end + 1);
        console.log(`[StudyPlan] Parsing segment (${jsonSegment.length} chars)...`);

        try {
            let parsedPlan = JSON.parse(jsonSegment);
            
            // Normalize structure
            let finalPlan = parsedPlan;
            if (Array.isArray(parsedPlan)) {
                finalPlan = { days: parsedPlan };
            } else if (!parsedPlan.days && parsedPlan.schedule) {
                finalPlan = { days: parsedPlan.schedule };
            } else if (!parsedPlan.days) {
                // If the AI just returned a list of days as values but not in an array
                const possibleDays = Object.values(parsedPlan).filter(v => typeof v === 'object' && v !== null);
                if (possibleDays.length > 0) finalPlan = { days: possibleDays };
            }

            if (!finalPlan.days || !Array.isArray(finalPlan.days)) {
                throw new Error('Parsed object missing "days" array.');
            }

            console.log(`[StudyPlan] Generation successful! Days: ${finalPlan.days.length}`);
            res.json({ planJson: JSON.stringify(finalPlan) });

        } catch (parseErr) {
            console.error(`[StudyPlan] JSON Parse Failure. Segment: ${jsonSegment.substring(0, 200)}...`);
            throw new Error('The AI generated a plan but it was not in the correct technical format.');
        }

    } catch (error) {
        console.error("[StudyPlan] GENERATE ERROR:", error.message);
        res.status(500).json({ 
            error: "Study Plan Generation Failed", 
            details: error.message,
            suggestion: "Try starting your local Ollama server, or try a simpler goal."
        });
    }
});

module.exports = router;
