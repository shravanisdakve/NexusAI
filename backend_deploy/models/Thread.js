const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
    courseId: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    author: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        displayName: String,
        email: String
    },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    repliesCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    pyqTag: { type: String }, // e.g. "MU-DEC-2023-Q4b"
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Thread', threadSchema);
