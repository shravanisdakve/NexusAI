const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['text', 'file'],
        default: 'text'
    },
    tags: [{
        type: String,
        trim: true
    }],
    isPinned: {
        type: Boolean,
        default: false
    },
    // File-related fields
    fileUrl: {
        type: String,
        default: null
    },
    fileName: {
        type: String,
        default: null
    },
    fileExtension: {
        type: String,
        default: null
    },
    fileSize: {
        type: Number,
        default: null
    },
    // References
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    }
}, {
    timestamps: true
});

// Compound index for faster queries
noteSchema.index({ courseId: 1, userId: 1, createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
