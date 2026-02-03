const express = require('express');
const router = express.Router();
const StudyPlan = require('../models/StudyPlan');
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, { apiVersion: 'v1beta' });

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
                startDate,
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

// AI Generation Route
router.post('/generate', auth, async (req, res) => {
    console.log(`[StudyPlan] GENERATE request received`);
    try {
        const { goal, durationDays, notesContext } = req.body;

        // Use gemini-1.5-flash for broader free-tier availability
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        const prompt = `You are an expert personalized academic advisor. 
        A student wants to achieve the following goal: "${goal}" in ${durationDays} days.
        They have provided the following notes context for their course:
        ---
        ${notesContext.substring(0, 10000)}
        ---
        Based on this, generate a structured, day-by-day study plan.
        Each day should have 2-3 specific tasks. 
        Task types should be one of: 'note' (reviewing notes), 'quiz' (taking a practice quiz), 'study-room' (collaborative session), or 'review' (general review).
        Make the plan realistic and progressive.
        
        The response MUST be a JSON array of daily plans. 
        IMPORTANT: Return ONLY the raw JSON array. Do not include markdown formatting like \`\`\`json.
        
        JSON Structure:
        [
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
        ]`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().replace(/```json|```/g, '').trim();

        console.log(`[StudyPlan] AI generated plan successfully`);
        res.json({ planJson: responseText });
    } catch (error) {
        console.error("[StudyPlan] GENERATE Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
