const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
    isMaintenanceMode: {
        type: Boolean,
        default: false
    },
    maintenanceMessage: {
        type: String,
        default: "NexusAI is currently undergoing scheduled maintenance. Please check back later."
    },
    activeAIProvider: {
        type: String,
        enum: ['gemini', 'groq', 'openai'],
        default: 'gemini'
    },
    globalAnnouncement: {
        type: String,
        default: ""
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
