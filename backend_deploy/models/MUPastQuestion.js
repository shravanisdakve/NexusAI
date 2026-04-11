const mongoose = require('mongoose');

const MUPastQuestionSchema = new mongoose.Schema({
    subject: { type: String, required: true, index: true },
    branch: { type: String, required: true, index: true },
    year: { type: String, enum: ['FE', 'SE', 'TE', 'BE'], required: true },
    semester: { type: Number, required: true },
    questionText: { type: String, required: true },
    marks: { type: Number, required: true },
    module: { type: Number, min: 1, max: 6, default: 1 }, // MU standard 6-module syllabus
    paperYear: { type: Number, required: true }, // e.g., 2023
    paperType: { type: String, enum: ['May', 'Dec', 'KT'], default: 'May' },
    tags: [String], // e.g., "numerical", "diagram", "theory"
    difficulty: { type: String, enum: ['Easy', 'Moderate', 'Hard'], default: 'Moderate' },
    frequency: { type: Number, default: 1 }, // How many times this EXACT or similar question appeared
    ingestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
});

// Compound index for finding similar questions quickly
MUPastQuestionSchema.index({ subject: 1, module: 1 });

module.exports = mongoose.model('MUPastQuestion', MUPastQuestionSchema);
