const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        default: '#8b5cf6' // Default violet color
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    icon: {
        type: String, // Emoji or icon name
        default: '📚'
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'archived'],
        default: 'active'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for faster queries
courseSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Course', courseSchema);
