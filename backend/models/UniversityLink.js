const mongoose = require('mongoose');

const UniversityLinkSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    href: { type: String, required: true },
    kind: { type: String, default: 'official' },
}, { timestamps: true });

module.exports = mongoose.model('UniversityLink', UniversityLinkSchema);
