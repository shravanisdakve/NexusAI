const express = require('express');
const router = express.Router();
const Curriculum = require('../models/Curriculum');

// Fallback data for common branches (Mumbai University NEP 2024-25 Pattern)
const FALLBACK_CURRICULUM = {
    branch: "Common for All Branches",
    semesters: [
        {
            semesterNumber: 1,
            subjects: [
                { subjectCode: "BSC101", name: "Applied Mathematics-I", credits: 4, category: "Basic Science" },
                { subjectCode: "BSC102", name: "Applied Physics-I", credits: 3, category: "Basic Science" },
                { subjectCode: "ESC101", name: "Engineering Mechanics", credits: 3, category: "Engineering Science" }
            ]
        }
    ]
};

// Get curriculum for a specific branch and semester
router.get('/:branch/:semester', async (req, res) => {
    try {
        const { branch, semester } = req.params;
        const decodedBranch = decodeURIComponent(branch);
        let curriculum = await Curriculum.findOne({ branch: new RegExp(decodedBranch, 'i') });

        // Use fallback if not found in DB
        if (!curriculum && decodedBranch.toLowerCase().includes('common')) {
            curriculum = FALLBACK_CURRICULUM;
        }

        if (!curriculum) return res.status(404).json({ message: 'Curriculum not found' });

        const semData = curriculum.semesters.find(s => s.semesterNumber === parseInt(semester));

        if (!semData) {
            return res.status(404).json({ success: false, message: 'Semester not found' });
        }

        res.json({ success: true, curriculum: semData });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Search subjects
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        const subjects = await Curriculum.aggregate([
            { $unwind: "$semesters" },
            { $unwind: "$semesters.subjects" },
            { $match: { "semesters.subjects.name": new RegExp(query, 'i') } },
            { $project: { _id: 0, subject: "$semesters.subjects" } },
            { $limit: 10 }
        ]);
        res.json({ success: true, subjects: subjects.map(s => s.subject) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
