const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
    content: { type: String, required: true },
    author: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        displayName: String,
        email: String
    },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isBestAnswer: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
