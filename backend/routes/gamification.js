const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');

// Get User Gamification Stats
router.get('/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id); // auth middleware uses id
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Return stats matching the frontend interface
        res.json({
            success: true,
            stats: {
                xp: user.xp || 0,
                level: user.level || 1,
                streak: user.streak || 0,
                badges: user.badges || [],
                coins: user.coins || 0
            }
        });
    } catch (error) {
        console.error('Error fetching gamification stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update Streak Logic
router.post('/update-streak', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const now = new Date();
        const lastActive = user.lastActive ? new Date(user.lastActive) : null;

        if (!lastActive) {
            user.streak = 1;
            user.xp = (user.xp || 0) + 10; // First checkin bonus
        } else {
            const diffTime = now.getTime() - lastActive.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            const isSameDay = now.toDateString() === lastActive.toDateString();
            const isYesterday = new Date(now.getTime() - 86400000).toDateString() === lastActive.toDateString();

            if (isSameDay) {
                // Already updated today
                return res.json({ success: true, streak: user.streak, message: 'Already updated today' });
            } else if (isYesterday) {
                // Streak continues
                user.streak = (user.streak || 0) + 1;
                user.xp = (user.xp || 0) + 50; // Streak bonus
                user.coins = (user.coins || 0) + 5;
            } else {
                // Streak broken
                user.streak = 1;
                user.xp = (user.xp || 0) + 10;
            }
        }

        user.lastActive = now;

        // --- Early Bird Achievement ---
        const hour = now.getHours();
        if (hour >= 5 && hour < 9) { // 5 AM to 9 AM
            if (!user.badges.includes('Early Bird')) {
                user.badges.push('Early Bird');
                user.xp += 100;
            }
        }
        // ------------------------------

        await user.save();

        res.json({
            success: true,
            streak: user.streak,
            xpEarned: user.xp,
            message: 'Streak updated successfully'
        });

    } catch (error) {
        console.error('Error updating streak:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Award XP
router.post('/award-xp', auth, async (req, res) => {
    const { amount, reason } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const result = await user.addXP(amount);

        res.json({
            success: true,
            newXP: result.xp,
            newLevel: result.level,
            leveledUp: result.leveledUp,
            message: `Awarded ${amount} XP for ${reason}`
        });

    } catch (error) {
        console.error('Error awarding XP:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Award Badge
router.post('/award-badge', auth, async (req, res) => {
    const { badgeName } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const result = await user.awardBadge(badgeName);

        res.json({
            success: result.success,
            badge: result.badge,
            xpEarned: result.xpEarned,
            message: result.message || (result.success ? `Congratulations! You've earned the ${badgeName} badge!` : 'Badge already earned')
        });

    } catch (error) {
        console.error('Error awarding badge:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Leaderboard Data
router.get('/leaderboard', auth, async (req, res) => {
    try {
        // Fetch top 10 users sorted by XP (descending)
        const topUsers = await User.find({})
            .sort({ xp: -1 })
            .limit(10)
            .select('displayName xp level avatar badges'); // Select only necessary fields

        const leaderboard = topUsers.map((user, index) => ({
            rank: index + 1,
            userId: user._id,
            name: user.displayName,
            xp: user.xp || 0,
            level: user.level || 1,
            avatar: user.avatar || '',
            badges: user.badges ? user.badges.length : 0
        }));

        res.json({
            success: true,
            leaderboard
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

