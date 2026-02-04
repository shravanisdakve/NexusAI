const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
    moduleNumber: Number,
    title: String,
    topics: [String],
    technicalRequirements: String,
    pedagogyFocus: String,
    weightage: Number
});

const SubjectSchema = new mongoose.Schema({
    subjectCode: { type: String, required: true }, // e.g., BSC101
    name: { type: String, required: true },
    credits: { type: Number, required: true },
    modules: [ModuleSchema],
    category: String, // e.g., Engineering Mathematics, Mechanics
    tutorials: [{
        title: String,
        link: String,
        type: { type: String, enum: ['video', 'scilab', 'pdf', 'interactive'] }
    }]
});

const SemesterSchema = new mongoose.Schema({
    semesterNumber: { type: Number, required: true },
    subjects: [SubjectSchema]
});

const CurriculumSchema = new mongoose.Schema({
    branch: { type: String, required: true }, // e.g., Computer Engineering
    scheme: { type: String, default: 'NEP 2024-25' },
    semesters: [SemesterSchema],
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Curriculum', CurriculumSchema);
