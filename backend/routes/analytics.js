const express = require('express');
const router = express.Router();
const UserProgress = require('../models/UserProgress');
const User = require('../models/user');
console.log('--- ANALYTICS ROUTE MODULE LOADED ---');

const auth = require('../middleware/auth');

// Get User Progress for the authenticated user
router.get('/', auth, async (req, res) => {
    console.log('--- HIT GET / api/analytics ---');
    try {
        let progress = await UserProgress.findOne({ userId: req.user.id });
        if (!progress) {
            // If no progress found, create a new document
            progress = new UserProgress({ userId: req.user.id });
            await progress.save();
        }
        // Return the full progress data object
        res.json({ success: true, data: progress });
    } catch (err) {
        console.error("Error fetching user progress:", err);
        res.status(500).json({ success: false, message: 'Server error while fetching progress' });
    }
});

// Update Study Time & Pomodoro
router.post('/session', auth, async (req, res) => {
    const { type, duration, description } = req.body;
    try {
        let progress = await UserProgress.findOne({ userId: req.user.id });
        if (!progress) progress = new UserProgress({ userId: req.user.id });

        if (type === 'pomodoro') {
            progress.pomodoroSessions += 1;
        }

        if (duration) {
            progress.totalStudyTime += duration;
        }

        progress.recentActivity.push({
            activityType: type === 'pomodoro' ? 'pomodoro' : 'study_session',
            description,
            duration,
            timestamp: new Date()
        });

        // Keep recent activity limited to last 50
        if (progress.recentActivity.length > 50) {
            progress.recentActivity = progress.recentActivity.slice(-50);
        }

        await progress.save();

        // Award XP for study session completion
        const user = await User.findById(req.user.id);
        if (user) await user.addXP(50); // Fixed XP for session completion

        res.json(progress);
    } catch (err) {

        res.status(500).json({ message: err.message });
    }
});

// Update Quiz Result & Topic Mastery
router.post('/quiz', auth, async (req, res) => {
    const { topic, score, isCorrect } = req.body;
    try {
        let progress = await UserProgress.findOne({ userId: req.user.id });
        if (!progress) progress = new UserProgress({ userId: req.user.id });

        progress.quizzesTaken += 1;

        // Update Topic Mastery
        const existingTopic = progress.topicMastery.find(t => t.topic === topic);
        if (existingTopic) {
            // Simple moving average for accuracy
            existingTopic.attempts += 1;
            const weight = 0.3; // Weight for new score
            const newAccuracy = (existingTopic.accuracy * (1 - weight)) + ((isCorrect ? 100 : 0) * weight);
            existingTopic.accuracy = Math.round(newAccuracy);
            existingTopic.lastStudied = new Date();
        } else {
            progress.topicMastery.push({
                topic,
                accuracy: isCorrect ? 100 : 0,
                attempts: 1,
                lastStudied: new Date()
            });
        }

        progress.recentActivity.push({
            activityType: 'quiz',
            description: `Quiz on ${topic}`,
            score: isCorrect ? 100 : 0,
            timestamp: new Date()
        });

        await progress.save();

        // Award XP for quiz attempt/success
        const user = await User.findById(req.user.id);
        if (user) {
            const xpAwarded = isCorrect ? 50 : 10;
            await user.addXP(xpAwarded);
        }

        res.json(progress);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
