const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
    front: {
        type: String,
        required: true
    },
    back: {
        type: String,
        required: true
    },
    bucket: {
        type: Number,
        default: 1,
        min: 1,
        max: 5
    },
    lastReview: {
        type: Date,
        default: Date.now
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
flashcardSchema.index({ courseId: 1, userId: 1, bucket: 1 });

module.exports = mongoose.model('Flashcard', flashcardSchema);
