const mongoose = require('mongoose');

const OrdinanceSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true }, // e.g., O.5042-A
    name: String,
    category: { type: String, enum: ['Grace Marks', 'ATKT', 'Progression', 'Condonation'] },
    description: String,
    rules: {
        maxMarks: Number,
        aggregatePercentage: Number,
        conditions: [String],
        applicationCriteria: String
    },
    scheme: { type: String, default: 'Common' }
});

module.exports = mongoose.model('Ordinance', OrdinanceSchema);
