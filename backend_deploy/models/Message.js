const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyRoom',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderName: {
        type: String, // Snapshot of name to avoid lookup
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'system'],
        default: 'text'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for quick retrieval of messages in a room
MessageSchema.index({ roomId: 1, timestamp: 1 });

module.exports = mongoose.model('Message', MessageSchema);
