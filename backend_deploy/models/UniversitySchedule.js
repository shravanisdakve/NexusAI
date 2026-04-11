const mongoose = require('mongoose');

const UniversityScheduleSchema = new mongoose.Schema({
    subject: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    time: { type: String, default: '10:30 AM' },
    status: { type: String, default: 'Tentative' },
    source: { type: String, default: 'seed' },
}, { timestamps: true });

UniversityScheduleSchema.index({ subject: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('UniversitySchedule', UniversityScheduleSchema);
