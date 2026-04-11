const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['quiz_result', 'pomodoro_complete', 'resource_upload', 'note_created', 'flashcard_review']
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        default: null
    },
    details: {
        type: Object, // Flexible field for specific activity data (e.g., quiz score, topic)
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for getting recent activities
ActivityLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
