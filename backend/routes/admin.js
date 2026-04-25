const express = require('express');
const router = express.Router();
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const AdminLog = require('../models/AdminLog');
const ActivityLog = require('../models/ActivityLog');
const StudyRoom = require('../models/StudyRoom');
const Message = require('../models/Message');
const Report = require('../models/Report');
const Note = require('../models/Note');
const Curriculum = require('../models/Curriculum');
const SystemConfig = require('../models/SystemConfig');
const bcrypt = require('bcryptjs');

// Helper to log admin actions
const logAdminAction = async (adminId, action, targetType, targetId, metadata = {}) => {
  try {
    await AdminLog.create({ adminId, action, targetType, targetId, metadata });
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
};

// Apply both middlewares to all routes in this router
router.use(authMiddleware);
router.use(adminMiddleware);

// --- DASHBOARD & ANALYTICS ---
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsersToday = await User.countDocuments({
      lastActive: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    const bannedUsers = await User.countDocuments({ status: 'banned' });
    const flaggedUsers = await User.countDocuments({ status: 'flagged' });
    const roomCount = await StudyRoom.countDocuments({ active: true });
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsersToday,
        bannedUsers,
        flaggedUsers,
        activeRooms: roomCount,
        aiRequestsToday: 0 // Placeholder or aggregate from logs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching dashboard stats' });
  }
});

router.get('/analytics/summary', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeToday = await User.countDocuments({ lastActive: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
    
    const activityStats = await ActivityLog.aggregate([
      { $match: { createdAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const collegeStats = await User.aggregate([
      { $group: { _id: '$college', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({ 
      success: true, 
      stats: {
        totalUsers,
        activeToday,
        activities: activityStats,
        topColleges: collegeStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching analytics summary' });
  }
});

// --- USER MANAGEMENT ---
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) query.role = role;
    if (status) query.status = status;

    const users = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password')
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalUsers: count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { email, password, displayName, branch, year, college, role } = req.body;
    
    if (!email || !password || !displayName || !branch || !year || !college) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      displayName,
      branch,
      year,
      college,
      role: role || 'user',
      lastActive: Date.now()
    });

    await newUser.save();
    
    await logAdminAction(req.user.id, 'CREATE_USER', 'User', newUser._id, { email: newUser.email });
    
    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating user' });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { role, status, bannedReason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'superadmin' && req.admin.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot modify a superadmin' });
    }

    if (role) user.role = role;
    if (status) user.status = status;
    if (bannedReason !== undefined) user.bannedReason = bannedReason;
    
    // Allow updating other profile fields
    const fields = ['displayName', 'email', 'branch', 'year', 'college'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    await user.save();
    await logAdminAction(req.user.id, 'UPDATE_USER', 'User', user._id, req.body);

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot delete a superadmin' });
    }

    await User.findByIdAndDelete(req.params.id);
    await logAdminAction(req.user.id, 'DELETE_USER', 'User', req.params.id, { email: user.email });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

// --- STUDY ROOMS ---
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await StudyRoom.find()
      .populate('createdBy', 'displayName email')
      .sort({ createdAt: -1 });
    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching rooms' });
  }
});

router.delete('/rooms/:id', async (req, res) => {
  try {
    const room = await StudyRoom.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    
    await logAdminAction(req.user.id, 'DELETE_ROOM', 'StudyRoom', req.params.id, { name: room.name });
    
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting room' });
  }
});

// --- SETTINGS ---
router.get('/settings', async (req, res) => {
  try {
    let settings = await SystemConfig.findOne({ key: 'global_settings' });
    if (!settings) {
      settings = new SystemConfig({
        key: 'global_settings',
        value: {
          maintenanceMode: false,
          announcement: '',
          activeAIProvider: 'gemini'
        }
      });
      await settings.save();
    }
    res.json({ success: true, settings: settings.value });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching settings' });
  }
});

router.post('/settings', async (req, res) => {
  try {
    let settings = await SystemConfig.findOne({ key: 'global_settings' });
    if (!settings) {
      settings = new SystemConfig({ key: 'global_settings' });
    }
    
    settings.value = { ...settings.value, ...req.body };
    settings.updatedBy = req.user.id;
    await settings.save();
    
    await logAdminAction(req.user.id, 'UPDATE_SETTINGS', 'SystemConfig', settings._id, req.body);
    
    res.json({ success: true, settings: settings.value });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating settings' });
  }
});

// --- AI CONFIG ---
router.get('/ai/config', async (req, res) => {
  try {
    let aiConfig = await SystemConfig.findOne({ key: 'ai_config' });
    if (!aiConfig) {
      aiConfig = {
        value: {
          primaryProvider: 'gemini',
          fallbackChain: ['gemini', 'groq', 'nvidia'],
          maxTokens: 2048,
          temperature: 0.7
        }
      };
    }
    res.json({ success: true, config: aiConfig.value });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching AI config' });
  }
});

router.post('/ai/config', async (req, res) => {
  try {
    let aiConfig = await SystemConfig.findOne({ key: 'ai_config' });
    if (!aiConfig) {
      aiConfig = new SystemConfig({ key: 'ai_config' });
    }
    
    aiConfig.value = { ...aiConfig.value, ...req.body };
    aiConfig.updatedBy = req.user.id;
    await aiConfig.save();
    
    await logAdminAction(req.user.id, 'UPDATE_AI_CONFIG', 'SystemConfig', aiConfig._id, req.body);
    
    res.json({ success: true, message: 'AI configuration updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating AI config' });
  }
});

// --- FEATURE FLAGS ---
router.get('/features', async (req, res) => {
  try {
    let featureFlags = await SystemConfig.findOne({ key: 'feature_flags' });
    if (!featureFlags) {
      featureFlags = new SystemConfig({
        key: 'feature_flags',
        value: {
          ai_tutor: true,
          study_rooms: true,
          whiteboard: true,
          quizzes: true,
          resume_builder: false
        }
      });
      await featureFlags.save();
    }
    
    // Transform to array for frontend
    const features = [
      { key: 'ai_tutor', name: 'AI Tutor', enabled: featureFlags.value.ai_tutor },
      { key: 'study_rooms', name: 'Study Rooms', enabled: featureFlags.value.study_rooms },
      { key: 'whiteboard', name: 'Whiteboard', enabled: featureFlags.value.whiteboard },
      { key: 'quizzes', name: 'Quiz Generator', enabled: featureFlags.value.quizzes },
      { key: 'resume_builder', name: 'Resume Builder', enabled: featureFlags.value.resume_builder }
    ];
    
    res.json({ success: true, features });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching feature flags' });
  }
});

router.post('/features', async (req, res) => {
  try {
    let featureFlags = await SystemConfig.findOne({ key: 'feature_flags' });
    if (!featureFlags) {
      featureFlags = new SystemConfig({ key: 'feature_flags' });
    }
    
    featureFlags.value = { ...featureFlags.value, ...req.body };
    featureFlags.updatedBy = req.user.id;
    await featureFlags.save();
    
    await logAdminAction(req.user.id, 'UPDATE_FEATURES', 'SystemConfig', featureFlags._id, req.body);
    
    res.json({ success: true, message: 'Feature flags updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating feature flags' });
  }
});

// --- CONTENT MODERATION ---
router.get('/content/notes', async (req, res) => {
  try {
    const notes = await Note.find()
      .populate('userId', 'displayName email')
      .populate('courseId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching notes' });
  }
});

router.delete('/content/notes/:id', async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    await logAdminAction(req.user.id, 'DELETE_NOTE', 'Note', req.params.id);
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting note' });
  }
});

router.patch('/content/notes/:id/flag', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    
    note.isFlagged = !note.isFlagged;
    if (req.body.reason) note.flaggedReason = req.body.reason;
    
    await note.save();
    await logAdminAction(req.user.id, 'FLAG_NOTE', 'Note', req.params.id, { isFlagged: note.isFlagged });
    
    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error flagging note' });
  }
});

router.get('/content/chats', async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('userId', 'displayName email')
      .populate('roomId', 'name')
      .sort({ timestamp: -1 })
      .limit(100);
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching chats' });
  }
});

router.delete('/content/chats/:id', async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    await logAdminAction(req.user.id, 'DELETE_MESSAGE', 'Message', req.params.id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting message' });
  }
});

router.patch('/content/chats/:id/flag', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    
    message.isFlagged = !message.isFlagged;
    if (req.body.reason) message.flaggedReason = req.body.reason;
    
    await message.save();
    await logAdminAction(req.user.id, 'FLAG_MESSAGE', 'Message', req.params.id, { isFlagged: message.isFlagged });
    
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error flagging message' });
  }
});

router.get('/content/whiteboards', async (req, res) => {
  try {
    const rooms = await StudyRoom.find({ 'whiteboardSnapshot.0': { $exists: true } })
      .populate('createdBy', 'displayName')
      .select('name createdBy topic whiteboardSnapshot updatedAt')
      .sort({ updatedAt: -1 });
    res.json({ success: true, whiteboards: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching whiteboards' });
  }
});

router.delete('/content/whiteboards/:id', async (req, res) => {
  try {
    await StudyRoom.findByIdAndUpdate(req.params.id, { $set: { whiteboardSnapshot: [] } });
    await logAdminAction(req.user.id, 'CLEAR_WHITEBOARD', 'StudyRoom', req.params.id);
    res.json({ success: true, message: 'Whiteboard cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error clearing whiteboard' });
  }
});

// --- INCIDENT REPORTS ---
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporterId', 'displayName email')
      .populate('resolvedBy', 'displayName')
      .sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching reports' });
  }
});

router.patch('/reports/:id', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    if (status) {
      report.status = status;
      if (status === 'Resolved' || status === 'Dismissed') {
        report.resolvedBy = req.user.id;
      }
    }
    if (adminNotes !== undefined) report.adminNotes = adminNotes;

    await report.save();
    await logAdminAction(req.user.id, 'UPDATE_REPORT', 'Report', report._id, { status });
    
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating report' });
  }
});

router.delete('/reports/:id', async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    await logAdminAction(req.user.id, 'DELETE_REPORT', 'Report', req.params.id);
    res.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting report' });
  }
});

// --- AUDIT LOGS ---
router.get('/logs', async (req, res) => {
  try {
    const logs = await AdminLog.find()
      .populate('adminId', 'displayName email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching audit logs' });
  }
});

// --- CURRICULUM ---
router.get('/curriculum', async (req, res) => {
  try {
    const curriculum = await Curriculum.find().sort({ branch: 1 });
    res.json({ success: true, curriculum });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching curriculum' });
  }
});

router.post('/curriculum', async (req, res) => {
  try {
    const curriculum = new Curriculum(req.body);
    await curriculum.save();
    await logAdminAction(req.user.id, 'CREATE_CURRICULUM', 'Curriculum', curriculum._id, req.body);
    res.json({ success: true, curriculum });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating curriculum' });
  }
});

router.patch('/curriculum/:id', async (req, res) => {
  try {
    const curriculum = await Curriculum.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAdminAction(req.user.id, 'UPDATE_CURRICULUM', 'Curriculum', req.params.id, req.body);
    res.json({ success: true, curriculum });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating curriculum' });
  }
});

router.delete('/curriculum/:id', async (req, res) => {
  try {
    await Curriculum.findByIdAndDelete(req.params.id);
    await logAdminAction(req.user.id, 'DELETE_CURRICULUM', 'Curriculum', req.params.id);
    res.json({ success: true, message: 'Curriculum deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting curriculum' });
  }
});

module.exports = router;
