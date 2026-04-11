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

        const task = day.tasks.id(taskId);
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
        console.log(`[StudyPlan] Generate parameters - Language: ${language}, Goal: ${goal}, Duration: ${durationDays}`);
        let prompt = `You are an expert personalized academic advisor for engineering students. 
        A student wants to achieve the following goal: "${goal}" in ${durationDays} days.
        They have provided the following notes context for their course:
        ---
        ${(notesContext || '').substring(0, 8000)}
        ---
        Based on this, generate a structured, day-by-day study plan.
        Each day should have 2-3 specific tasks. 
        Task types MUST be one of: 'note' (reviewing notes), 'quiz' (taking a practice quiz), 'study-room' (collaborative session), or 'review' (general review).
        Make the plan realistic and progressive.`;

        if (language === 'mr') {
            prompt += ' IMPORTANT: All human-readable textual fields in the JSON (title, description) MUST be in MARATHI (मराठी).';
        } else if (language === 'hi') {
            prompt += ' IMPORTANT: All human-readable textual fields in the JSON (title, description) MUST be in HINDI (हिंदी).';
        }

        prompt += `
        
        Return ONLY a JSON object with a "days" key containing the array of daily plans.
        Do not include markdown formatting like \`\`\`json.
        
        JSON Structure:
        {
            "days": [
                {
                    "day": number,
                    "focus": "Brief focus for the day",
                    "tasks": [
                        {
                            "title": "string",
                            "description": "string",
                            "type": "note" | "quiz" | "study-room" | "review",
                            "duration": "e.g. 45 min",
                            "technique": "e.g. Pomodoro, Active Recall"
                        }
                    ],
                    "resources": ["Specific URL or book reference", "Another resource"]
                }
            ]
        }`;

        console.log(`[StudyPlan] Calling AI Provider...`);
        const result = await aiProvider.generate(prompt, {
            feature: 'studyPlan',
            json: true,
            temperature: 0.2
        });

        if (!result) throw new Error('AI Provider returned empty result');

        // Some providers might return an object already if they are configured with json: true.
        let responseText = result;
        if (typeof result !== 'string') {
            responseText = JSON.stringify(result);
        } else {
            responseText = result.replace(/```json|```/g, '').trim();
        }

        console.log(`[StudyPlan] Received AI response. Parsing...`);
        const parsedPlan = parseStudyPlanJson(responseText);
        
        // Normalize structure (AI might return raw array instead of {days: []})
        let finalPlan = parsedPlan;
        if (Array.isArray(parsedPlan)) {
            finalPlan = { days: parsedPlan };
        } else if (!parsedPlan.days && parsedPlan.schedule) {
            finalPlan = { days: parsedPlan.schedule };
        }

        const normalizedPlanJson = JSON.stringify(finalPlan);
        console.log(`[StudyPlan] Generation complete. Days: ${finalPlan.days?.length}`);
        
        res.json({ planJson: normalizedPlanJson });
    } catch (error) {
        console.error("[StudyPlan] GENERATE ERROR:", error.message);
        res.status(500).json({ 
            error: "Failed to generate study plan", 
            details: error.message,
            suggestion: "Try with a shorter goal or fewer days"
        });
    }
});

module.exports = router;
