const express = require('express');
const router = express.Router();
const StudyRoom = require('../models/StudyRoom');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const User = require('../models/User');


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

const Thread = require('../models/Thread');
const Post = require('../models/Post');

// --- Q&A FORUM ROUTES ---

// @route   GET /api/community/courses/:courseId/threads
// @desc    Get all threads for a course
router.get('/courses/:courseId/threads', auth, async (req, res) => {
    try {
        const threads = await Thread.find({ courseId: req.params.courseId })
            .sort({ createdAt: -1 });
        res.json({ success: true, threads });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/community/threads
// @desc    Create a new thread
router.post('/threads', auth, async (req, res) => {
    try {
        const { courseId, title, content, category, pyqTag } = req.body;
        const thread = new Thread({
            courseId,
            title,
            content,
            category,
            pyqTag,
            author: {
                id: req.user.id,
                displayName: req.user.displayName,
                email: req.user.email
            }
        });
        await thread.save();
        res.status(201).json({ success: true, thread });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/community/threads/:threadId/posts
// @desc    Get all posts (replies) for a thread
router.get('/threads/:threadId/posts', auth, async (req, res) => {
    try {
        const posts = await Post.find({ threadId: req.params.threadId })
            .sort({ upvotes: -1, createdAt: 1 });
        res.json({ success: true, posts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/community/threads/:threadId/posts
// @desc    Post a reply to a thread
router.post('/threads/:threadId/posts', auth, async (req, res) => {
    try {
        const { content } = req.body;
        const post = new Post({
            threadId: req.params.threadId,
            content,
            author: {
                id: req.user.id,
                displayName: req.user.displayName,
                email: req.user.email
            }
        });
        await post.save();

        // Update replies count in thread
        await Thread.findByIdAndUpdate(req.params.threadId, { $inc: { repliesCount: 1 } });

        res.status(201).json({ success: true, post });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   PATCH /api/community/posts/:postId/best-answer
// @desc    Mark a post as the best answer
router.patch('/posts/:postId/best-answer', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        const thread = await Thread.findById(post.threadId);
        if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

        // Only thread author can mark best answer
        if (thread.author.id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Unmark previous best answer if any
        await Post.updateMany({ threadId: thread._id }, { isBestAnswer: false });

        post.isBestAnswer = true;
        await post.save();

        thread.isVerified = true;
        await thread.save();

        // REWARD: Author of the best answer gets 50 points
        await User.findByIdAndUpdate(post.author.id, {
            $inc: { points: 50, contributions: 1 }
        });

        res.json({ success: true, post, thread });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   PATCH /api/community/threads/:threadId/upvote
// @desc    Upvote a thread
router.patch('/threads/:threadId/upvote', auth, async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.threadId);
        if (!thread) return res.status(404).json({ success: false, message: 'Thread not found' });

        const userId = req.user.id;
        const upvoteIndex = thread.upvotedBy.indexOf(userId);

        if (upvoteIndex === -1) {
            // Add upvote
            thread.upvotedBy.push(userId);
            thread.upvotes += 1;
            // Reward author
            await User.findByIdAndUpdate(thread.author.id, { $inc: { points: 5 } });
        } else {
            // Remove upvote (toggle)
            thread.upvotedBy.splice(upvoteIndex, 1);
            thread.upvotes -= 1;
            // Remove reward
            await User.findByIdAndUpdate(thread.author.id, { $inc: { points: -5 } });
        }

        await thread.save();
        res.json({ success: true, upvotes: thread.upvotes, hasUpvoted: upvoteIndex === -1 });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   PATCH /api/community/posts/:postId/upvote
// @desc    Upvote a post (reply)
router.patch('/posts/:postId/upvote', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        const userId = req.user.id;
        const upvoteIndex = post.upvotedBy.indexOf(userId);

        if (upvoteIndex === -1) {
            post.upvotedBy.push(userId);
            post.upvotes += 1;
            await User.findByIdAndUpdate(post.author.id, { $inc: { points: 2 } });
        } else {
            post.upvotedBy.splice(upvoteIndex, 1);
            post.upvotes -= 1;
            await User.findByIdAndUpdate(post.author.id, { $inc: { points: -2 } });
        }

        await post.save();
        res.json({ success: true, upvotes: post.upvotes, hasUpvoted: upvoteIndex === -1 });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
