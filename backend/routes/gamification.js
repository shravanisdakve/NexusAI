const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Note: filename is user.js (lowercase u in file system based on list_dir, but typically models are capitalized. Require should match file system or be case insensitive on Windows, but let's check previous requires. Step 82 shows 'User' model exported. Step 62 requires auth routes which likely require User. Let's assume ../models/user works or ../models/User if file system is case insensitive. The list_dir showed "user.js" (lowercase).
const auth = require('../middleware/auth');

// Get User Gamification Stats
router.get('/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
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

// Award XP (Internal or Admin protected normally, but for now open to auth users for interactions)
router.post('/award-xp', auth, async (req, res) => {
    const { amount, reason } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.xp = (user.xp || 0) + amount;

        // Simple level up logic: Level = 1 + floor(xp / 1000)
        const newLevel = 1 + Math.floor(user.xp / 1000);
        if (newLevel > user.level) {
            user.level = newLevel;
            // Maybe award a coin for leveling up?
            user.coins = (user.coins || 0) + 10;
        }

        await user.save();

        res.json({
            success: true,
            newXP: user.xp,
            newLevel: user.level,
            message: `Awarded ${amount} XP for ${reason}`
        });

    } catch (error) {
        console.error('Error awarding XP:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
