const mongoose = require('mongoose');

const aiChatSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'New Chat Session'
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'model'],
            required: true
        },
        parts: [{
            text: { type: String, required: true }
        }],
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// P2: Indexes for session list queries (user's chat history, sorted by recency)
aiChatSessionSchema.index({ userId: 1, lastUpdated: -1 });

module.exports = mongoose.model('AiChatSession', aiChatSessionSchema);
