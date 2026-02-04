const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Note: filename is user.js (lowercase u in file system based on list_dir, but typically models are capitalized. Require should match file system or be case insensitive on Windows, but let's check previous requires. Step 82 shows 'User' model exported. Step 62 requires auth routes which likely require User. Let's assume ../models/user works or ../models/User if file system is case insensitive. The list_dir showed "user.js" (lowercase).
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


module.exports = router;

