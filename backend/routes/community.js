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
            id: p.user?._id?.toString() || '',
            email: p.user?.email || '',
            displayName: p.user?.displayName || 'Unknown'
        }))
);

const mapRoom = (room) => {
    const users = mapUsers(room);
    const mutedUserIdSet = new Set((room.chatMutedUserIds || []).map((id) => id.toString()));
    const mutedUserEmails = users
        .filter((user) => user.id && mutedUserIdSet.has(user.id))
        .map((user) => user.email)
        .filter(Boolean);

    return {
        id: room._id,
        name: room.name,
        courseId: room.courseId,
        maxUsers: room.maxUsers,
        users,
        createdBy: room.createdBy?.displayName || 'Unknown',
        createdById: room.createdBy?._id?.toString() || '',
        createdByEmail: room.createdBy?.email || '',
        mutedUserIds: Array.from(mutedUserIdSet),
        mutedUserEmails,
        technique: room.technique,
        topic: room.topic,
        techniqueState: room.techniqueState || null
    };
};

const emitRoomUpdate = (io, room) => {
    if (!io) return;
    io.to(room._id.toString()).emit('room-update', mapRoom(room));
};

const emitTechniqueUpdate = (io, room) => {
    if (!io) return;
    io.to(room._id.toString()).emit('room-technique-updated', {
        roomId: room._id.toString(),
        technique: room.technique,
        techniqueState: room.techniqueState || null
    });
};

const getCurrentUser = async (req) => {
    const user = await User.findById(req.user.id).select('displayName email');
    return {
        displayName: user?.displayName || req.user.email?.split('@')[0] || 'Student',
        email: user?.email || req.user.email || ''
    };
};

const TECHNIQUE_DEFINITIONS = {
    pomodoro: {
        key: 'pomodoro',
        name: 'Pomodoro Technique',
        focusSec: 25 * 60,
        shortBreakSec: 5 * 60,
        longBreakSec: 15 * 60,
        longBreakEvery: 4,
        prompts: {
            focus: 'Focus deeply on a single target task until this sprint ends.',
            short_break: 'Take a short reset: hydrate, stretch, and avoid doom-scrolling.',
            long_break: 'Long break: step away, reset mentally, then return refreshed.'
        }
    },
    feynman: {
        key: 'feynman',
        name: 'Feynman Technique',
        phases: [
            { key: 'study', label: 'Learn', durationSec: 12 * 60, prompt: 'Review the concept and collect key points in plain language.' },
            { key: 'explain', label: 'Explain Simply', durationSec: 10 * 60, prompt: 'Explain the idea as if teaching a beginner with no jargon.' },
            { key: 'identify_gaps', label: 'Find Gaps', durationSec: 8 * 60, prompt: 'List confusing parts and verify them using notes/resources.' },
            { key: 'simplify', label: 'Refine Explanation', durationSec: 10 * 60, prompt: 'Rewrite your explanation using simpler terms and examples.' },
            { key: 'reflect_break', label: 'Reflect Break', durationSec: 5 * 60, prompt: 'Short reset. Decide the one thing to improve next round.' }
        ]
    },
    spaced_repetition: {
        key: 'spaced_repetition',
        name: 'Spaced Repetition',
        phases: [
            { key: 'recall_round_1', label: 'Recall Round 1', durationSec: 8 * 60, prompt: 'Recall answers from memory before checking notes.' },
            { key: 'spacing_break_1', label: 'Spacing Break', durationSec: 2 * 60, prompt: 'Brief pause to create retrieval spacing.' },
            { key: 'recall_round_2', label: 'Recall Round 2', durationSec: 8 * 60, prompt: 'Re-answer the same prompts. Mark weak cards/concepts.' },
            { key: 'spacing_break_2', label: 'Longer Spacing Break', durationSec: 5 * 60, prompt: 'Longer spacing interval before the final recall pass.' },
            { key: 'recall_round_3', label: 'Recall Round 3', durationSec: 8 * 60, prompt: 'Final recall pass. Keep only stubborn errors for review.' },
            { key: 'consolidation', label: 'Consolidate', durationSec: 6 * 60, prompt: 'Summarize mistakes and schedule next review window.' }
        ]
    }
};

const normalizeTechniqueKey = (technique) => {
    const raw = String(technique || '').toLowerCase();
    if (raw.includes('feynman')) return 'feynman';
    if (raw.includes('spaced')) return 'spaced_repetition';
    return 'pomodoro';
};

const buildInitialTechniqueState = (technique) => {
    const now = new Date();
    const key = normalizeTechniqueKey(technique);

    if (key === 'pomodoro') {
        const config = TECHNIQUE_DEFINITIONS.pomodoro;
        return {
            techniqueKey: key,
            isRunning: true,
            phaseKey: 'focus',
            phaseLabel: 'Focus Sprint',
            phasePrompt: config.prompts.focus,
            phaseDurationSec: config.focusSec,
            phaseIndex: 0,
            cycleCount: 1,
            focusRoundsCompleted: 0,
            phaseStartedAt: now,
            phaseEndsAt: new Date(now.getTime() + config.focusSec * 1000),
            remainingSec: config.focusSec,
            version: 1,
            updatedAt: now
        };
    }

    const def = TECHNIQUE_DEFINITIONS[key];
    const first = def.phases[0];
    return {
        techniqueKey: key,
        isRunning: true,
        phaseKey: first.key,
        phaseLabel: first.label,
        phasePrompt: first.prompt,
        phaseDurationSec: first.durationSec,
        phaseIndex: 0,
        cycleCount: 1,
        focusRoundsCompleted: 0,
        phaseStartedAt: now,
        phaseEndsAt: new Date(now.getTime() + first.durationSec * 1000),
        remainingSec: first.durationSec,
        version: 1,
        updatedAt: now
    };
};

const ensureTechniqueState = (room) => {
    if (!room.techniqueState || !room.techniqueState.techniqueKey) {
        room.techniqueState = buildInitialTechniqueState(room.technique);
    } else {
        const targetKey = normalizeTechniqueKey(room.technique);
        if (room.techniqueState.techniqueKey !== targetKey) {
            room.techniqueState = buildInitialTechniqueState(room.technique);
        }
    }
    return room.techniqueState;
};

const applyPhase = (state, phase, now, phaseIndex = 0) => {
    state.phaseKey = phase.key;
    state.phaseLabel = phase.label;
    state.phasePrompt = phase.prompt;
    state.phaseDurationSec = phase.durationSec;
    state.phaseIndex = phaseIndex;
    state.phaseStartedAt = now;
    state.phaseEndsAt = new Date(now.getTime() + phase.durationSec * 1000);
    state.remainingSec = phase.durationSec;
};

const advanceTechniqueState = (state) => {
    const now = new Date();

    if (state.techniqueKey === 'pomodoro') {
        const config = TECHNIQUE_DEFINITIONS.pomodoro;
        if (state.phaseKey === 'focus') {
            state.focusRoundsCompleted = (state.focusRoundsCompleted || 0) + 1;
            const isLongBreak = state.focusRoundsCompleted % config.longBreakEvery === 0;
            const nextPhase = isLongBreak
                ? { key: 'long_break', label: 'Long Break', durationSec: config.longBreakSec, prompt: config.prompts.long_break }
                : { key: 'short_break', label: 'Short Break', durationSec: config.shortBreakSec, prompt: config.prompts.short_break };
            applyPhase(state, nextPhase, now);
        } else {
            const focusPhase = { key: 'focus', label: 'Focus Sprint', durationSec: config.focusSec, prompt: config.prompts.focus };
            applyPhase(state, focusPhase, now);
            state.cycleCount = (state.cycleCount || 1) + 1;
        }
    } else {
        const def = TECHNIQUE_DEFINITIONS[state.techniqueKey] || TECHNIQUE_DEFINITIONS.spaced_repetition;
        const currentIndex = Number.isInteger(state.phaseIndex) ? state.phaseIndex : 0;
        const nextIndex = (currentIndex + 1) % def.phases.length;
        if (nextIndex === 0) {
            state.cycleCount = (state.cycleCount || 1) + 1;
        }
        const nextPhase = def.phases[nextIndex];
        applyPhase(state, nextPhase, now, nextIndex);
    }

    state.isRunning = true;
    state.version = (state.version || 1) + 1;
    state.updatedAt = now;
};

// @route   GET /api/community/rooms
// @desc    Get all active study rooms
// @access  Private
router.get('/rooms', auth, async (req, res) => {
    try {
        const rooms = await StudyRoom.find({ active: true })
            .populate('createdBy', 'displayName email')
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
            participants: [{ user: req.user.id }],
            techniqueState: buildInitialTechniqueState(technique)
        });

        await room.save();
        await room.populate('createdBy', 'displayName email');
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
            .populate('createdBy', 'displayName email')
            .populate('participants.user', 'displayName email');

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        room.participants = room.participants.filter((p) => p.user?._id?.toString() !== req.user.id);
        room.chatMutedUserIds = (room.chatMutedUserIds || []).filter((id) => id.toString() !== req.user.id);
        await room.save();
        await room.populate('participants.user', 'displayName email');

        emitRoomUpdate(req.app.get('io'), room);

        res.json({ success: true, room: mapRoom(room) });
    } catch (error) {
        console.error('Error leaving room:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   PATCH /api/community/rooms/:roomId
// @desc    Update room metadata (host only)
// @access  Private
router.patch('/rooms/:roomId', auth, async (req, res) => {
    try {
        const { name, topic, maxUsers } = req.body || {};

        const room = await StudyRoom.findById(req.params.roomId)
            .populate('createdBy', 'displayName email')
            .populate('participants.user', 'displayName email');

        if (!room || !room.active) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const hostId = room.createdBy?._id?.toString();
        if (!hostId || hostId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only the room host can update this room' });
        }

        if (typeof name === 'string') {
            const trimmed = name.trim();
            if (trimmed.length < 3 || trimmed.length > 120) {
                return res.status(400).json({ success: false, message: 'Room name must be between 3 and 120 characters' });
            }
            room.name = trimmed;
        }

        if (typeof topic === 'string') {
            room.topic = topic.trim().slice(0, 120);
        }

        if (maxUsers !== undefined) {
            const parsedMaxUsers = Number(maxUsers);
            if (!Number.isInteger(parsedMaxUsers) || parsedMaxUsers < 2 || parsedMaxUsers > 60) {
                return res.status(400).json({ success: false, message: 'Max users must be an integer between 2 and 60' });
            }
            if (parsedMaxUsers < room.participants.length) {
                return res.status(400).json({ success: false, message: 'Max users cannot be lower than current participant count' });
            }
            room.maxUsers = parsedMaxUsers;
        }

        await room.save();
        await room.populate('createdBy', 'displayName email');
        await room.populate('participants.user', 'displayName email');

        emitRoomUpdate(req.app.get('io'), room);

        res.json({ success: true, room: mapRoom(room) });
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   DELETE /api/community/rooms/:roomId
// @desc    Delete (deactivate) room (host only)
// @access  Private
router.delete('/rooms/:roomId', auth, async (req, res) => {
    try {
        const room = await StudyRoom.findById(req.params.roomId)
            .populate('createdBy', 'displayName email')
            .populate('participants.user', 'displayName email');

        if (!room || !room.active) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const hostId = room.createdBy?._id?.toString();
        if (!hostId || hostId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only the room host can delete this room' });
        }

        room.active = false;
        room.participants = [];
        room.chatMutedUserIds = [];
        await room.save();

        const io = req.app.get('io');
        if (io) {
            io.to(room._id.toString()).emit('room-update', null);
            io.to(room._id.toString()).emit('room-closed', {
                roomId: room._id.toString(),
                reason: 'deleted_by_host'
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/community/rooms/:roomId/members/moderate
// @desc    Host moderation actions on room members
// @access  Private (host only)
router.post('/rooms/:roomId/members/moderate', auth, async (req, res) => {
    try {
        const { action, targetUserId, targetUserEmail } = req.body || {};
        const allowedActions = new Set(['mute_chat', 'unmute_chat', 'remove', 'transfer_host']);

        if (!allowedActions.has(action)) {
            return res.status(400).json({ success: false, message: 'Unsupported moderation action' });
        }

        const room = await StudyRoom.findById(req.params.roomId)
            .populate('createdBy', 'displayName email')
            .populate('participants.user', 'displayName email');

        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const hostId = room.createdBy?._id?.toString();
        if (!hostId || hostId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Only the room host can perform this action' });
        }

        const normalizedEmail = String(targetUserEmail || '').trim().toLowerCase();
        const normalizedTargetId = String(targetUserId || '').trim();

        const targetParticipant = room.participants.find((participant) => {
            const participantId = participant.user?._id?.toString() || '';
            const participantEmail = String(participant.user?.email || '').trim().toLowerCase();
            if (normalizedTargetId && participantId === normalizedTargetId) return true;
            if (normalizedEmail && participantEmail === normalizedEmail) return true;
            return false;
        });

        if (!targetParticipant?.user?._id) {
            return res.status(404).json({ success: false, message: 'Target participant not found in this room' });
        }

        const targetId = targetParticipant.user._id.toString();
        const targetDisplayName = targetParticipant.user.displayName || 'Student';
        const targetEmail = targetParticipant.user.email || '';

        if (action === 'transfer_host' && targetId === hostId) {
            return res.status(400).json({ success: false, message: 'This user is already the host' });
        }

        if ((action === 'mute_chat' || action === 'remove') && targetId === hostId) {
            return res.status(400).json({ success: false, message: 'Host action on self is not allowed' });
        }

        let message = '';

        if (action === 'mute_chat') {
            const alreadyMuted = (room.chatMutedUserIds || []).some((id) => id.toString() === targetId);
            if (!alreadyMuted) {
                room.chatMutedUserIds = [...(room.chatMutedUserIds || []), targetId];
            }
            message = `${targetDisplayName} was muted in room chat.`;
        }

        if (action === 'unmute_chat') {
            room.chatMutedUserIds = (room.chatMutedUserIds || []).filter((id) => id.toString() !== targetId);
            message = `${targetDisplayName} was unmuted in room chat.`;
        }

        if (action === 'remove') {
            room.participants = room.participants.filter((participant) => participant.user?._id?.toString() !== targetId);
            room.chatMutedUserIds = (room.chatMutedUserIds || []).filter((id) => id.toString() !== targetId);
            message = `${targetDisplayName} was removed from the room.`;
        }

        if (action === 'transfer_host') {
            room.createdBy = targetId;
            message = `${targetDisplayName} is now the room host.`;
        }

        await room.save();
        await room.populate('createdBy', 'displayName email');
        await room.populate('participants.user', 'displayName email');

        emitRoomUpdate(req.app.get('io'), room);

        res.json({
            success: true,
            message,
            action,
            target: {
                id: targetId,
                email: targetEmail,
                displayName: targetDisplayName
            },
            room: mapRoom(room)
        });
    } catch (error) {
        console.error('Error moderating room member:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/community/rooms/:roomId
// @desc    Get a specific room's details with participants
// @access  Private
router.get('/rooms/:roomId', auth, async (req, res) => {
    try {
        const room = await StudyRoom.findById(req.params.roomId)
            .populate('createdBy', 'displayName email')
            .populate('participants.user', 'displayName email');

        if (!room || !room.active) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        res.json({ success: true, room: mapRoom(room) });
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/community/rooms/:roomId/technique-state
// @desc    Get technique automation state for a room
// @access  Private
router.get('/rooms/:roomId/technique-state', auth, async (req, res) => {
    try {
        const room = await StudyRoom.findById(req.params.roomId).select('technique techniqueState');
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const hadState = !!room.techniqueState?.techniqueKey;
        const state = ensureTechniqueState(room);
        if (!hadState) {
            room.markModified('techniqueState');
            await room.save();
        }

        res.json({
            success: true,
            technique: room.technique,
            techniqueState: state
        });
    } catch (error) {
        console.error('Error fetching technique state:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   PUT /api/community/rooms/:roomId/technique-state
// @desc    Start/pause/reset/change room technique automation state
// @access  Private
router.put('/rooms/:roomId/technique-state', auth, async (req, res) => {
    try {
        const { action, expectedVersion, techniqueKey } = req.body || {};
        const room = await StudyRoom.findById(req.params.roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const state = ensureTechniqueState(room);

        if (typeof expectedVersion === 'number' && expectedVersion !== state.version) {
            return res.status(200).json({
                success: true,
                stale: true,
                technique: room.technique,
                techniqueState: state
            });
        }

        const now = new Date();
        if (action === 'pause') {
            const endsAt = new Date(state.phaseEndsAt).getTime();
            const remaining = Math.max(0, Math.ceil((endsAt - now.getTime()) / 1000));
            state.isRunning = false;
            state.remainingSec = remaining;
            state.updatedAt = now;
            state.version = (state.version || 1) + 1;
        } else if (action === 'start') {
            const remaining = Math.max(1, state.remainingSec || state.phaseDurationSec || 1);
            state.isRunning = true;
            state.phaseStartedAt = now;
            state.phaseEndsAt = new Date(now.getTime() + remaining * 1000);
            state.remainingSec = remaining;
            state.updatedAt = now;
            state.version = (state.version || 1) + 1;
        } else if (action === 'reset') {
            room.techniqueState = buildInitialTechniqueState(room.technique);
        } else if (action === 'set_technique') {
            const nextKey = ['pomodoro', 'feynman', 'spaced_repetition'].includes(techniqueKey)
                ? techniqueKey
                : normalizeTechniqueKey(techniqueKey || room.technique);

            const humanName = TECHNIQUE_DEFINITIONS[nextKey]?.name || room.technique || 'Pomodoro Technique';
            room.technique = humanName;
            room.techniqueState = buildInitialTechniqueState(humanName);
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        room.markModified('techniqueState');
        await room.save();
        await room.populate('createdBy', 'displayName email');
        await room.populate('participants.user', 'displayName email');

        emitTechniqueUpdate(req.app.get('io'), room);
        emitRoomUpdate(req.app.get('io'), room);

        res.json({
            success: true,
            technique: room.technique,
            techniqueState: room.techniqueState
        });
    } catch (error) {
        console.error('Error updating technique state:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   POST /api/community/rooms/:roomId/technique-state/advance
// @desc    Advance room technique to the next phase
// @access  Private
router.post('/rooms/:roomId/technique-state/advance', auth, async (req, res) => {
    try {
        const { expectedVersion } = req.body || {};
        const room = await StudyRoom.findById(req.params.roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const state = ensureTechniqueState(room);
        if (typeof expectedVersion === 'number' && expectedVersion !== state.version) {
            return res.status(200).json({
                success: true,
                stale: true,
                technique: room.technique,
                techniqueState: state
            });
        }

        advanceTechniqueState(state);
        room.markModified('techniqueState');
        await room.save();
        await room.populate('createdBy', 'displayName email');
        await room.populate('participants.user', 'displayName email');

        emitTechniqueUpdate(req.app.get('io'), room);
        emitRoomUpdate(req.app.get('io'), room);

        res.json({
            success: true,
            technique: room.technique,
            techniqueState: room.techniqueState
        });
    } catch (error) {
        console.error('Error advancing technique state:', error);
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
