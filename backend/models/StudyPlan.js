const mongoose = require('mongoose');

const StudyTaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['note', 'quiz', 'study-room', 'review'], default: 'note' },
    referenceId: { type: String },
    completed: { type: Boolean, default: false }
});

const StudyDaySchema = new mongoose.Schema({
    day: { type: Number, required: true },
    tasks: [StudyTaskSchema]
});

const StudyPlanSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: String, required: true },
    goal: { type: String, required: true },
    durationDays: { type: Number, required: true },
    startDate: { type: Number, required: true },
    days: [StudyDaySchema],
    createdAt: { type: Number, default: Date.now }
});

module.exports = mongoose.model('StudyPlan', StudyPlanSchema);
