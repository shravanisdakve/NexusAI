const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    tool: {
        type: String, // e.g., 'tutor', 'quiz', 'notes'
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        default: null
    },
    startTime: {
        type: Date,
        default: Date.now,
    },
    endTime: {
        type: Date,
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'abandoned'],
        default: 'active'
    }
});

// Index for getting recent sessions for a user
SessionSchema.index({ userId: 1, startTime: -1 });

module.exports = mongoose.model('Session', SessionSchema);
