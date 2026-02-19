const mongoose = require('mongoose');

const SectionBreakdownSchema = new mongoose.Schema({
    section: { type: String, required: true },
    total: { type: Number, default: 0 },
    attempted: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    coverageAccuracy: { type: Number, default: 0 },
}, { _id: false });

const PlacementAttemptSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    simulatorSlug: { type: String, required: true, index: true },
    simulatorName: { type: String, required: true },
    totalQuestions: { type: Number, required: true },
    attemptedQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    incorrectAnswers: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    pace: { type: String, enum: ['Fast', 'Balanced', 'Slow'], default: 'Balanced' },
    timeTakenSec: { type: Number, default: 0 },
    sectionBreakdown: [SectionBreakdownSchema],
    focusAreas: [{ type: String }],
    readinessBand: { type: String, default: 'Developing' },
    recommendation: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('PlacementAttempt', PlacementAttemptSchema);
