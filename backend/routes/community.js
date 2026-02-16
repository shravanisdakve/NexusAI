const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();
const StudyRoom = require('../models/StudyRoom');
const Message = require('../models/Message');
const Thread = require('../models/Thread');
const Post = require('../models/Post');
const User = require('../models/user');
const auth = require('../middleware/auth');

const roomResourceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join('uploads', 'room-resources');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    }
});

const uploadRoomResource = multer({
    storage: roomResourceStorage,
    limits: { fileSize: 15 * 1024 * 1024 }
});

const mapUsers = (room) => (
    room.participants
        .map((p) => ({
            email: p.user?.email || '',
            displayName: p.user?.displayName || 'Unknown'
        }))
);

const mapRoom = (room) => ({
    id: room._id,
    name: room.name,
    courseId: room.courseId,
    maxUsers: room.maxUsers,
    users: mapUsers(room),
    createdBy: room.createdBy?.displayName || 'Unknown',
    technique: room.technique,
    topic: room.topic
});

const emitRoomUpdate = (io, room) => {
    if (!io) return;
    io.to(room._id.toString()).emit('room-update', mapRoom(room));
};

const getCurrentUser = async (req) => {
    const user = await User.findById(req.user.id).select('displayName email');
    return {
        displayName: user?.displayName || req.user.email?.split('@')[0] || 'Student',
        email: user?.email || req.user.email || ''
    };
};

// @route   GET /api/community/rooms
// @desc    Get all active study rooms
// @access  Private
router.get('/rooms', auth, async (req, res) => {
    try {
        const rooms = await StudyRoom.find({ active: true })
            .populate('createdBy', 'displayName')
            .populate('participants.user', 'displayName email')
            .sort({ createdAt: -1 });

        res.json({ success: true, rooms: rooms.map(mapRoom) });
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
        await room.populate('createdBy', 'displayName');
        await room.populate('participants.user', 'displayName email');

        res.status(201).json({ success: true, room: mapRoom(room) });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/community/rooms/:roomId/leave
// @desc    Leave a room and update participants
// @access  Private
router.post('/rooms/:roomId/leave', auth, async (req, res) => {
    try {
        const room = await StudyRoom.findById(req.params.roomId)
            .populate('createdBy', 'displayName')
            .populate('participants.user', 'displayName email');

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        room.participants = room.participants.filter((p) => p.user?._id?.toString() !== req.user.id);
        await room.save();
        await room.populate('participants.user', 'displayName email');

        emitRoomUpdate(req.app.get('io'), room);

        res.json({ success: true, room: mapRoom(room) });
    } catch (error) {
        console.error('Error leaving room:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/community/rooms/:roomId
// @desc    Get a specific room's details with participants
// @access  Private
router.get('/rooms/:roomId', auth, async (req, res) => {
    try {
        const room = await StudyRoom.findById(req.params.roomId)
            .populate('createdBy', 'displayName')
            .populate('participants.user', 'displayName email');

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        res.json({ success: true, room: mapRoom(room) });
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/community/rooms/:roomId/messages
// @desc    Get chat history for a room
// @access  Private
router.get('/rooms/:roomId/messages', auth, async (req, res) => {
    try {
        const messages = await Message.find({ roomId: req.params.roomId })
            .populate('userId', 'email')
            .sort({ timestamp: 1 })
            .limit(100);

        res.json({
            success: true,
            messages: messages.map((msg) => ({
                id: msg._id,
                text: msg.content,
                sender: msg.senderName,
                email: msg.userId?.email || '',
                isUser: msg.userId?._id?.toString() === req.user.id,
                timestamp: msg.timestamp
            }))
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/community/rooms/:roomId/notes
// @desc    Get shared room notes
// @access  Private
router.get('/rooms/:roomId/notes', auth, async (req, res) => {
    try {
        const room = await StudyRoom.findById(req.params.roomId).select('sharedNotes');
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        res.json({ success: true, notes: room.sharedNotes || '' });
    } catch (error) {
        console.error('Error fetching room notes:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   PUT /api/community/rooms/:roomId/notes
// @desc    Update shared room notes
// @access  Private
router.put('/rooms/:roomId/notes', auth, async (req, res) => {
    try {
        const content = typeof req.body.content === 'string' ? req.body.content : '';
        const room = await StudyRoom.findById(req.params.roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        room.sharedNotes = content;
        await room.save();

        const io = req.app.get('io');
        if (io) {
            io.to(req.params.roomId).emit('room-notes-updated', {
                roomId: req.params.roomId,
                content: room.sharedNotes
            });
        }

        res.json({ success: true, notes: room.sharedNotes });
    } catch (error) {
        console.error('Error saving room notes:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/community/rooms/:roomId/user-notes/:userId
// @desc    Get private notes for a user in a room
// @access  Private
router.get('/rooms/:roomId/user-notes/:userId', auth, async (req, res) => {
    try {
        const room = await StudyRoom.findById(req.params.roomId).select('userNotes');
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const note = room.userNotes.find((entry) => entry.userId.toString() === req.params.userId);
        res.json({ success: true, content: note?.content || '' });
    } catch (error) {
        console.error('Error fetching user notes:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   PUT /api/community/rooms/:roomId/user-notes
// @desc    Save private notes for a user in a room
// @access  Private
router.put('/rooms/:roomId/user-notes', auth, async (req, res) => {
    try {
        const { userId, content } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId is required' });
        }

        const room = await StudyRoom.findById(req.params.roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const existing = room.userNotes.find((entry) => entry.userId.toString() === userId);
        if (existing) {
            existing.content = typeof content === 'string' ? content : '';
            existing.updatedAt = new Date();
        } else {
            room.userNotes.push({
                userId,
                content: typeof content === 'string' ? content : '',
                updatedAt: new Date()
            });
        }

        await room.save();

        const io = req.app.get('io');
        if (io) {
            io.to(req.params.roomId).emit('room-user-notes-updated', {
                roomId: req.params.roomId,
                userId,
                content: typeof content === 'string' ? content : ''
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving user notes:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/community/rooms/:roomId/resources
// @desc    Get room-specific resources
// @access  Private
router.get('/rooms/:roomId/resources', auth, async (req, res) => {
    try {
        const room = await StudyRoom.findById(req.params.roomId).select('resources');
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        const resources = [...(room.resources || [])].sort((a, b) => new Date(b.timeCreated) - new Date(a.timeCreated));
        res.json({ success: true, resources });
    } catch (error) {
        console.error('Error fetching room resources:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/community/rooms/:roomId/resources
// @desc    Upload a room-specific resource file
// @access  Private
router.post('/rooms/:roomId/resources', [auth, uploadRoomResource.single('file')], async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File is required' });
        }

        const room = await StudyRoom.findById(req.params.roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const fallbackUser = await getCurrentUser(req);
        const uploader = req.body.displayName || fallbackUser.displayName;
        const protocol = req.protocol;
        const host = req.get('host');
        const baseUrl = process.env.API_BASE_URL || `${protocol}://${host}`;

        const resource = {
            name: req.file.originalname,
            url: `${baseUrl}/uploads/room-resources/${req.file.filename}`,
            mimeType: req.file.mimetype || 'application/octet-stream',
            uploader,
            userId: req.user.id,
            timeCreated: new Date()
        };

        room.resources.push(resource);
        await room.save();

        const io = req.app.get('io');
        if (io) {
            io.to(req.params.roomId).emit('room-resources-updated', {
                roomId: req.params.roomId,
                resources: room.resources
            });
        }

        res.status(201).json({ success: true, resource, resources: room.resources });
    } catch (error) {
        console.error('Error uploading room resource:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   DELETE /api/community/rooms/:roomId/resources/:fileName
// @desc    Delete a room-specific resource
// @access  Private
router.delete('/rooms/:roomId/resources/:fileName', auth, async (req, res) => {
    try {
        const room = await StudyRoom.findById(req.params.roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const fileName = decodeURIComponent(req.params.fileName);
        const resourceIndex = room.resources.findIndex((r) => r.name === fileName);
        if (resourceIndex === -1) {
            return res.status(404).json({ success: false, message: 'Resource not found' });
        }

        const [removedResource] = room.resources.splice(resourceIndex, 1);
        await room.save();

        if (removedResource?.url) {
            const uploadedFile = path.basename(removedResource.url);
            const localPath = path.join(process.cwd(), 'uploads', 'room-resources', uploadedFile);
            if (fs.existsSync(localPath)) {
                fs.unlinkSync(localPath);
            }
        }

        const io = req.app.get('io');
        if (io) {
            io.to(req.params.roomId).emit('room-resources-updated', {
                roomId: req.params.roomId,
                resources: room.resources
            });
        }

        res.json({ success: true, resources: room.resources });
    } catch (error) {
        console.error('Error deleting room resource:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/community/rooms/:roomId/quiz
// @desc    Get active room quiz
// @access  Private
router.get('/rooms/:roomId/quiz', auth, async (req, res) => {
    try {
        const room = await StudyRoom.findById(req.params.roomId).select('quiz');
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }
        res.json({ success: true, quiz: room.quiz || null });
    } catch (error) {
        console.error('Error fetching room quiz:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   PUT /api/community/rooms/:roomId/quiz
// @desc    Set active room quiz
// @access  Private
router.put('/rooms/:roomId/quiz', auth, async (req, res) => {
    try {
        const { quiz } = req.body;
        if (!quiz || typeof quiz !== 'object') {
            return res.status(400).json({ success: false, message: 'quiz payload is required' });
        }

        const room = await StudyRoom.findById(req.params.roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        room.quiz = {
            ...quiz,
            answers: Array.isArray(quiz.answers) ? quiz.answers : []
        };
        await room.save();

        const io = req.app.get('io');
        if (io) {
            io.to(req.params.roomId).emit('room-quiz-updated', {
                roomId: req.params.roomId,
                quiz: room.quiz
            });
        }

        res.json({ success: true, quiz: room.quiz });
    } catch (error) {
        console.error('Error saving room quiz:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/community/rooms/:roomId/quiz/answer
// @desc    Submit or update a room quiz answer
// @access  Private
router.post('/rooms/:roomId/quiz/answer', auth, async (req, res) => {
    try {
        const { userId, userName, index } = req.body;
        if (!userId || typeof index !== 'number') {
            return res.status(400).json({ success: false, message: 'userId and numeric index are required' });
        }

        const room = await StudyRoom.findById(req.params.roomId);
        if (!room || !room.quiz) {
            return res.status(404).json({ success: false, message: 'Active quiz not found' });
        }

        const answers = Array.isArray(room.quiz.answers) ? room.quiz.answers : [];
        const existingIndex = answers.findIndex((answer) => answer.userId === userId);
        const nextAnswer = {
            userId,
            displayName: userName || 'Student',
            answerIndex: index
        };

        if (existingIndex === -1) {
            answers.push(nextAnswer);
        } else {
            answers[existingIndex] = nextAnswer;
        }

        room.quiz.answers = answers;
        room.markModified('quiz');
        await room.save();

        const io = req.app.get('io');
        if (io) {
            io.to(req.params.roomId).emit('room-quiz-updated', {
                roomId: req.params.roomId,
                quiz: room.quiz
            });
        }

        res.json({ success: true, quiz: room.quiz });
    } catch (error) {
        console.error('Error saving quiz answer:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   DELETE /api/community/rooms/:roomId/quiz
// @desc    Clear active room quiz
// @access  Private
router.delete('/rooms/:roomId/quiz', auth, async (req, res) => {
    try {
        const room = await StudyRoom.findById(req.params.roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        room.quiz = null;
        await room.save();

        const io = req.app.get('io');
        if (io) {
            io.to(req.params.roomId).emit('room-quiz-updated', {
                roomId: req.params.roomId,
                quiz: null
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing room quiz:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

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
        const currentUser = await getCurrentUser(req);
        const thread = new Thread({
            courseId,
            title,
            content,
            category,
            pyqTag,
            author: {
                id: req.user.id,
                displayName: currentUser.displayName,
                email: currentUser.email
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
        const currentUser = await getCurrentUser(req);
        const post = new Post({
            threadId: req.params.threadId,
            content,
            author: {
                id: req.user.id,
                displayName: currentUser.displayName,
                email: currentUser.email
            }
        });
        await post.save();

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

        if (thread.author.id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await Post.updateMany({ threadId: thread._id }, { isBestAnswer: false });

        post.isBestAnswer = true;
        await post.save();

        thread.isVerified = true;
        await thread.save();

        const bestAuthor = await User.findById(post.author.id);
        if (bestAuthor) {
            bestAuthor.contributions = (bestAuthor.contributions || 0) + 1;
            await bestAuthor.addXP(50);
        }

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
        const upvoteIndex = thread.upvotedBy.findIndex((id) => id.toString() === userId);

        if (upvoteIndex === -1) {
            thread.upvotedBy.push(userId);
            thread.upvotes += 1;
            const author = await User.findById(thread.author.id);
            if (author) await author.addXP(5);
        } else {
            thread.upvotedBy.splice(upvoteIndex, 1);
            thread.upvotes = Math.max(0, thread.upvotes - 1);
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
        const upvoteIndex = post.upvotedBy.findIndex((id) => id.toString() === userId);

        if (upvoteIndex === -1) {
            post.upvotedBy.push(userId);
            post.upvotes += 1;
            const author = await User.findById(post.author.id);
            if (author) await author.addXP(2);
        } else {
            post.upvotedBy.splice(upvoteIndex, 1);
            post.upvotes = Math.max(0, post.upvotes - 1);
        }

        await post.save();
        res.json({ success: true, upvotes: post.upvotes, hasUpvoted: upvoteIndex === -1 });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
