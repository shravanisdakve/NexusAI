const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['In Progress', 'Completed'],
        default: 'In Progress'
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
goalSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Goal', goalSchema);
