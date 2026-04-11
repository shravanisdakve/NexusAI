const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    topic: { type: String, required: true },
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true },
    explanation: { type: String }
});

const QuizSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    questions: [QuestionSchema],
    score: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    dateTaken: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', QuizSchema);
