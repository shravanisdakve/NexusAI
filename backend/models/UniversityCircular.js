const mongoose = require('mongoose');

const UniversityCircularSchema = new mongoose.Schema({
    title: { type: String, required: true, index: true },
    category: { type: String, default: 'General', index: true },
    urgent: { type: Boolean, default: false },
    publishedAt: { type: Date, required: true, index: true },
    link: { type: String, required: true },
    source: { type: String, default: 'seed' },
    sourceHash: { type: String, default: '', index: true },
}, { timestamps: true });

UniversityCircularSchema.index({ title: 1, publishedAt: 1 }, { unique: true });

module.exports = mongoose.model('UniversityCircular', UniversityCircularSchema);
