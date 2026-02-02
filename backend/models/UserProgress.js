const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    totalStudyTime: {
        type: Number,
        default: 0 // in seconds
    },
    pomodoroSessions: {
        type: Number,
        default: 0
    },
    quizzesTaken: {
        type: Number,
        default: 0
    },
    topicMastery: [{
        topic: String,
        accuracy: Number, // 0-100
        attempts: Number,
        lastStudied: Date
    }],
    recentActivity: [{
        activityType: { type: String, enum: ['quiz', 'pomodoro', 'study_session', 'game'] },
        description: String,
        timestamp: { type: Date, default: Date.now },
        duration: Number, // in seconds
        score: Number
    }]
}, { timestamps: true });

module.exports = mongoose.model('UserProgress', UserProgressSchema);
