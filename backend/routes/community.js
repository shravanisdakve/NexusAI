const express = require('express');
const router = express.Router();
const StudyRoom = require('../models/StudyRoom');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// @route   GET /api/community/rooms
// @desc    Get all active study rooms
// @access  Private
router.get('/rooms', auth, async (req, res) => {
    try {
        const rooms = await StudyRoom.find({ active: true })
            .populate('createdBy', 'displayName')
            .sort({ createdAt: -1 });

        // Transform for frontend
        const roomsData = rooms.map(room => ({
            id: room._id,
            name: room.name,
            courseId: room.courseId,
            maxUsers: room.maxUsers,
            users: room.participants.length, // Just count for now
            createdBy: room.createdBy.displayName,
            technique: room.technique,
            topic: room.topic
        }));

        res.json({ success: true, rooms: roomsData });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/community/rooms
// @desc    Create a new study room
// @access  Private
router.post('/rooms', auth, async (req, res) => {
    try {
        const { name, courseId, maxUsers, technique, topic } = req.body;

        const room = new StudyRoom({
            name,
            courseId: courseId || 'general',
            maxUsers: maxUsers || 10,
            technique,
            topic,
            createdBy: req.user.id,
            participants: [{ user: req.user.id }]
        });

        await room.save();

        res.status(201).json({
            success: true,
            room: {
                id: room._id,
                name: room.name,
                courseId: room.courseId,
                // Return simplified object
            }
        });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/community/rooms/:roomId/messages
// @desc    Get chat history for a room
// @access  Private
router.get('/rooms/:roomId/messages', auth, async (req, res) => {
    try {
        const messages = await Message.find({ roomId: req.params.roomId })
            .sort({ timestamp: 1 })
            .limit(50); // Limit to last 50 messages

        res.json({
            success: true,
            messages: messages.map(msg => ({
                id: msg._id,
                text: msg.content,
                sender: msg.senderName,
                isUser: msg.userId.toString() === req.user.id,
                timestamp: msg.timestamp
            }))
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
