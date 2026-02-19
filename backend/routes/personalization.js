const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const User = require('../models/user');
const UserProgress = require('../models/UserProgress');
const PlacementAttempt = require('../models/PlacementAttempt');
const PersonalizationEvent = require('../models/PersonalizationEvent');
const {
    TOOL_KEYS,
    toPlainUsage,
    getMostUsedTool,
    buildRecommendedTools,
} = require('../utils/personalizationLogic');

const sanitizeToolList = (value) => {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((item) => typeof item === 'string' && TOOL_KEYS.includes(item)))].slice(0, 8);
};

const getPersonalizationSnapshot = async (userId) => {
    const [user, analytics, placementAttempts] = await Promise.all([
        User.findById(userId),
        UserProgress.findOne({ userId }),
        PlacementAttempt.find({ userId }).sort({ createdAt: -1 }).limit(5),
    ]);

    if (!user) return null;

    const usageCounts = toPlainUsage(user.toolUsageCounters || {});
    const recommendedTools = buildRecommendedTools({
        userProfile: user,
        analytics: analytics || {},
        usageCounts,
        placementAttempts,
    });

    return {
        user,
        analytics,
        placementAttempts,
        usageCounts,
        recommendedTools,
        mostUsedTool: getMostUsedTool(usageCounts),
    };
};

router.get('/profile', auth, async (req, res) => {
    try {
        const snapshot = await getPersonalizationSnapshot(req.user.id);
        if (!snapshot) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.json({
            success: true,
            data: {
                preferredLanguage: snapshot.user.preferredLanguage || 'en',
                quickAccessTools: snapshot.user.quickAccessTools || [],
                toolUsageCounters: snapshot.usageCounts,
                mostUsedTool: snapshot.mostUsedTool,
                recommendedTools: snapshot.recommendedTools,
                targetExam: snapshot.user.targetExam || null,
                learningStyle: snapshot.user.learningStyle || null,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.patch('/preferences', auth, async (req, res) => {
    try {
        const updates = {};

        if (typeof req.body.preferredLanguage === 'string' && ['en', 'mr', 'hi'].includes(req.body.preferredLanguage)) {
            updates.preferredLanguage = req.body.preferredLanguage;
        }

        if (req.body.quickAccessTools) {
            updates.quickAccessTools = sanitizeToolList(req.body.quickAccessTools);
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updates },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (updates.preferredLanguage) {
            await PersonalizationEvent.create({
                userId: req.user.id,
                eventType: 'language_change',
                metadata: { preferredLanguage: updates.preferredLanguage },
            });
        }

        if (updates.quickAccessTools) {
            await PersonalizationEvent.create({
                userId: req.user.id,
                eventType: 'quick_access',
                metadata: { tools: updates.quickAccessTools },
            });
        }

        return res.json({
            success: true,
            data: {
                preferredLanguage: user.preferredLanguage || 'en',
                quickAccessTools: user.quickAccessTools || [],
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/tool-usage', auth, async (req, res) => {
    try {
        const toolKey = req.body.toolKey;
        if (!toolKey || !TOOL_KEYS.includes(toolKey)) {
            return res.status(400).json({ success: false, message: 'Invalid tool key' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const currentCount = Number(user.toolUsageCounters?.get(toolKey) || 0);
        user.toolUsageCounters.set(toolKey, currentCount + 1);
        await user.save();

        await PersonalizationEvent.create({
            userId: req.user.id,
            eventType: 'tool_usage',
            toolKey,
            metadata: req.body.metadata || {},
        });

        return res.json({
            success: true,
            data: {
                toolKey,
                usageCount: currentCount + 1,
                mostUsedTool: getMostUsedTool(toPlainUsage(user.toolUsageCounters)),
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/mood', auth, async (req, res) => {
    try {
        const label = req.body.label;
        if (!label || typeof label !== 'string') {
            return res.status(400).json({ success: false, message: 'Mood label is required' });
        }

        await PersonalizationEvent.create({
            userId: req.user.id,
            eventType: 'mood',
            moodLabel: label,
            metadata: {
                emoji: req.body.emoji || null,
            },
        });

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/recommendations', auth, async (req, res) => {
    try {
        const snapshot = await getPersonalizationSnapshot(req.user.id);
        if (!snapshot) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const weakTopics = (snapshot.analytics?.topicMastery || [])
            .filter((topic) => Number(topic.accuracy || 0) < 65)
            .sort((a, b) => Number(a.accuracy || 0) - Number(b.accuracy || 0))
            .slice(0, 3)
            .map((topic) => ({ topic: topic.topic, accuracy: topic.accuracy }));

        const latestPlacement = snapshot.placementAttempts[0] || null;

        return res.json({
            success: true,
            data: {
                recommendedTools: snapshot.recommendedTools,
                weakTopics,
                latestPlacement: latestPlacement ? {
                    simulatorSlug: latestPlacement.simulatorSlug,
                    accuracy: latestPlacement.accuracy,
                    readinessBand: latestPlacement.readinessBand,
                    focusAreas: latestPlacement.focusAreas || [],
                    attemptedAt: latestPlacement.createdAt,
                } : null,
                mostUsedTool: snapshot.mostUsedTool,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
