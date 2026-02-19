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
    const base = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
    const extracted = extractJsonPayload(base);
    const attempts = [
        extracted,
        repairJsonText(extracted),
        repairJsonText(stripCodeFences(base)),
    ];

    for (const attempt of attempts) {
        if (!attempt) continue;
        try {
            return JSON.parse(attempt);
        } catch {
            // Try next repaired variant.
        }
    }

    throw new Error('AI returned invalid study plan JSON');
};

// Test route to verify router is loaded
router.get('/test', (req, res) => {
    res.json({ message: "Study Plan router is working" });
});

// Get study plan for a course
router.get('/:courseId', auth, async (req, res) => {
    console.log(`[StudyPlan] GET request for courseId: ${req.params.courseId}`);
    try {
        const plan = await StudyPlan.findOne({ user: req.user.id, courseId: req.params.courseId });
        if (!plan) {
            console.log(`[StudyPlan] No plan found for courseId: ${req.params.courseId}`);
            return res.json(null);
        }
        res.json(plan);
    } catch (err) {
        console.error(`[StudyPlan] GET Error:`, err);
        res.status(500).send('Server Error');
    }
});

// Create or update study plan
router.post('/', auth, async (req, res) => {
    console.log(`[StudyPlan] POST request for courseId: ${req.body.courseId}`);
    const { courseId, goal, durationDays, startDate, days } = req.body;
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
        res.status(500).send('Server Error');
    }
});

// Update task completion
router.patch('/task', auth, async (req, res) => {
    const { courseId, dayIndex, taskId, completed } = req.body;
    try {
        const plan = await StudyPlan.findOne({ user: req.user.id, courseId });
        if (!plan) return res.status(404).json({ msg: 'Plan not found' });

        const task = plan.days[dayIndex].tasks.id(taskId);
        if (task) {
            task.completed = completed;
            await plan.save();
        }
        res.json(plan);
    } catch (err) {
        console.error(`[StudyPlan] PATCH Error:`, err);
        res.status(500).send('Server Error');
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
        ${notesContext.substring(0, 8000)}
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
                    "tasks": [
                        {
                            "title": "string",
                            "description": "string",
                            "type": "note" | "quiz" | "study-room" | "review"
                        }
                    ]
                }
            ]
        }`;

        const result = await aiProvider.generate(prompt, {
            feature: 'studyPlan',
            json: true
        });

        // Some providers might return an object already if they are configured with json: true.
        let responseText = result;
        if (typeof result !== 'string') {
            responseText = JSON.stringify(result);
        } else {
            responseText = result.replace(/```json|```/g, '').trim();
        }

        const parsedPlan = parseStudyPlanJson(responseText);
        const normalizedPlanJson = JSON.stringify(parsedPlan);

        console.log(`[StudyPlan] AI generated plan successfully. Length: ${normalizedPlanJson.length}`);
        res.json({ planJson: normalizedPlanJson });
    } catch (error) {
        console.error("[StudyPlan] GENERATE Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

