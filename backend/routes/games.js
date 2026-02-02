const express = require('express');
const router = express.Router();
const GameScore = require('../models/GameScore');
const auth = require('../middleware/auth');

// @route   POST /api/games/score
// @desc    Submit a game score
// @access  Private
router.post('/score', auth, async (req, res) => {
    try {
        const { gameId, score, level, duration } = req.body;

        const newScore = new GameScore({
            userId: req.user.id,
            gameId,
            score,
            level: level || 1,
            duration
        });

        await newScore.save();

        res.status(201).json({ success: true, newScore });
    } catch (error) {
        console.error('Error saving game score:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/games/leaderboard/:gameId
// @desc    Get leaderboard for a specific game
// @access  Private
router.get('/leaderboard/:gameId', auth, async (req, res) => {
    try {
        const { limit } = req.query;
        const scores = await GameScore.find({ gameId: req.params.gameId })
            .sort({ score: -1 })
            .limit(parseInt(limit) || 10)
            .populate('userId', 'displayName');

        // Transform for frontend
        const leaderboard = scores.map(s => ({
            id: s._id,
            displayName: s.userId.displayName,
            score: s.score,
            date: s.playedAt
        }));

        res.json({ success: true, leaderboard });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
