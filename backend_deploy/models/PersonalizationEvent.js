const mongoose = require('mongoose');

const PersonalizationEventSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    eventType: {
        type: String,
        required: true,
        enum: ['tool_usage', 'mood', 'quick_access', 'language_change', 'placement_attempt'],
    },
    toolKey: { type: String },
    moodLabel: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('PersonalizationEvent', PersonalizationEventSchema);
