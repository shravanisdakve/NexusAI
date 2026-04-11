const express = require('express');
const router = express.Router();
const AiChatSession = require('../models/AiChatSession');
const auth = require('../middleware/auth');

// @route   GET /api/ai-chat/history
// @desc    Get user's chat history (summarized or list of sessions)
// @access  Private
router.get('/history', auth, async (req, res) => {
    try {
        const sessions = await AiChatSession.find({ userId: req.user.id })
            .sort({ lastUpdated: -1 })
            .select('title lastUpdated createdAt');
        res.json({ success: true, sessions });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/ai-chat/session/:id
// @desc    Get a specific chat session
// @access  Private
router.get('/session/:id', auth, async (req, res) => {
    try {
        const session = await AiChatSession.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        res.json({ success: true, session });
    } catch (error) {
        console.error('Error fetching chat session:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/ai-chat/session
// @desc    Create a new chat session
// @access  Private
router.post('/session', auth, async (req, res) => {
    try {
        const { title, initialMessages } = req.body;
        const session = new AiChatSession({
            userId: req.user.id,
            title: title || 'New Study Session',
            messages: initialMessages || []
        });
        await session.save();
        res.json({ success: true, session });
    } catch (error) {
        console.error('Error creating chat session:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/ai-chat/session/:id/message
// @desc    Add a message (or messages) to a session
// @access  Private
router.post('/session/:id/message', auth, async (req, res) => {
    try {
        const { messages } = req.body; // Array of { role, parts: [{text}] }

        const session = await AiChatSession.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        session.messages.push(...messages);
        session.lastUpdated = Date.now();

        // Auto-generate title if it's the first user message
        if (session.messages.length <= 3 && messages.some(m => m.role === 'user')) {
            const userMsg = messages.find(m => m.role === 'user');
            if (userMsg && userMsg.parts[0]?.text) {
                const text = userMsg.parts[0].text;
                session.title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
            }
        }

        await session.save();
        res.json({ success: true, session });
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
