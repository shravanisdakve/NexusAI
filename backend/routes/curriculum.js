const express = require('express');
const router = express.Router();
const Curriculum = require('../models/Curriculum');

// Get curriculum for a specific branch and semester
router.get('/:branch/:semester', async (req, res) => {
    try {
        const { branch, semester } = req.params;
        const curriculum = await Curriculum.findOne({ branch: new RegExp(branch, 'i') });
        if (!curriculum) return res.status(404).json({ message: 'Curriculum not found' });

        const semData = curriculum.semesters.find(s => s.semesterNumber === parseInt(semester));
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
