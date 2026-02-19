const mongoose = require('mongoose');

const StudyRoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    courseId: {
        type: String, // Can be 'general' or specific course ID
        default: 'general'
    },
    topic: {
        type: String
    },
    technique: {
        type: String
    },
    maxUsers: {
        type: Number,
        default: 10
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    },
    // We can track current participants here if we want, but Socket.io usually handles presence
    // For persistence, we can just track who 'joined'
    participants: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date, default: Date.now }
    }],
    chatMutedUserIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    sharedNotes: {
        type: String,
        default: ''
    },
    userNotes: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, default: '' },
        updatedAt: { type: Date, default: Date.now }
    }],
    resources: [{
        name: { type: String, required: true },
        url: { type: String, required: true },
        mimeType: { type: String, default: 'application/octet-stream' },
        uploader: { type: String, default: 'Unknown' },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timeCreated: { type: Date, default: Date.now }
    }],
    quiz: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    techniqueState: {
        techniqueKey: { type: String, default: 'pomodoro' },
        isRunning: { type: Boolean, default: true },
        phaseKey: { type: String, default: 'focus' },
        phaseLabel: { type: String, default: 'Focus Sprint' },
        phasePrompt: { type: String, default: 'Work on one clearly defined problem with zero context switching.' },
        phaseDurationSec: { type: Number, default: 25 * 60 },
        phaseIndex: { type: Number, default: 0 },
        cycleCount: { type: Number, default: 1 },
        focusRoundsCompleted: { type: Number, default: 0 },
        phaseStartedAt: { type: Date, default: Date.now },
        phaseEndsAt: { type: Date, default: () => new Date(Date.now() + 25 * 60 * 1000) },
        remainingSec: { type: Number, default: 25 * 60 },
        version: { type: Number, default: 1 },
        updatedAt: { type: Date, default: Date.now }
    }
});

module.exports = mongoose.model('StudyRoom', StudyRoomSchema);
