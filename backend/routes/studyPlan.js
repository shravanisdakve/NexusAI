const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/generate', async (req, res) => {
    try {
        const { goal, timeframe, currentLevel, subjects } = req.body;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `Generate a highly structured, day-by-day study plan for a student.
        Goal: ${goal}
        Timeframe: ${timeframe}
        Current Student Level: ${currentLevel}
        Subjects/Topics: ${subjects.join(', ')}

        The response MUST be a JSON object following this schema:
        {
            "title": "Short Descriptive Title",
            "overview": "Brief summary of the strategy",
            "schedule": [
                {
                    "day": 1,
                    "focus": "Topic of the day",
                    "tasks": [
                        { "task": "Task description", "duration": "e.g. 45 mins", "technique": "e.g. Pomodoro" }
                    ],
                    "resources": ["Suggested resource type like 'Review personal notes on Topic X'"]
                }
            ],
            "tips": ["Tip 1", "Tip 2"]
        }`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        res.json(JSON.parse(responseText));
    } catch (error) {
        console.error("Error generating study plan:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
