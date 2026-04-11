const mongoose = require('mongoose');

const GameScoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gameId: {
        type: String,
        required: true // e.g., 'word-scramble', 'memory-match'
    },
    score: {
        type: Number,
        required: true
    },
    level: {
        type: Number,
        default: 1
    },
    duration: {
        type: Number // Time taken in seconds
    },
    playedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for leaderboards: descending score for each game
GameScoreSchema.index({ gameId: 1, score: -1 });

module.exports = mongoose.model('GameScore', GameScoreSchema);
