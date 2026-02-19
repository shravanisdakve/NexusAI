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

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeSemesterData = (semesterData, fallbackSemester) => {
    const subjects = Array.isArray(semesterData?.subjects) ? semesterData.subjects : [];
    return {
        semesterNumber: Number(semesterData?.semesterNumber) || fallbackSemester,
        subjects: subjects.map((subject) => ({
            subjectCode: subject?.subjectCode || '',
            name: subject?.name || 'Untitled Subject',
            credits: Number(subject?.credits) || 0,
            category: subject?.category || 'General',
            modules: Array.isArray(subject?.modules) ? subject.modules : [],
            tutorials: Array.isArray(subject?.tutorials) ? subject.tutorials : []
        }))
    };
};

// Get curriculum for a specific branch and semester
router.get('/:branch/:semester', async (req, res) => {
    try {
        const { branch, semester } = req.params;
        const decodedBranch = decodeURIComponent(branch);
        const parsedSemester = Number.parseInt(semester, 10);
        if (!Number.isInteger(parsedSemester) || parsedSemester < 1 || parsedSemester > 8) {
            return res.status(400).json({ success: false, message: 'Invalid semester value. Use a number between 1 and 8.' });
        }

        const escapedBranch = escapeRegex(decodedBranch.trim());
        let curriculum = await Curriculum.findOne({ branch: new RegExp(`^${escapedBranch}$`, 'i') });

        if (!curriculum) {
            curriculum = await Curriculum.findOne({ branch: new RegExp(escapedBranch, 'i') });
        }

        if (!curriculum) {
            curriculum = await Curriculum.findOne({ branch: /common/i });
        }

        // Use in-memory fallback if DB has no curriculum records.
        if (!curriculum) {
            curriculum = FALLBACK_CURRICULUM;
        }

        const currentSemData = (curriculum.semesters || []).find((s) => Number(s.semesterNumber) === parsedSemester);
        let semData = currentSemData;
        let fallbackApplied = false;

        if (!semData) {
            const commonCurriculum = await Curriculum.findOne({ branch: /common/i });
            const commonSemData = (commonCurriculum?.semesters || FALLBACK_CURRICULUM.semesters || [])
                .find((s) => Number(s.semesterNumber) === parsedSemester);

            if (commonSemData) {
                semData = commonSemData;
                fallbackApplied = true;
            }
        }

        if (!semData) {
            const firstAvailable = (curriculum.semesters || [])[0]
                || (FALLBACK_CURRICULUM.semesters || [])[0];
            if (!firstAvailable) {
                return res.status(404).json({ success: false, message: 'Curriculum not found' });
            }
            semData = firstAvailable;
            fallbackApplied = true;
        }

        res.json({
            success: true,
            curriculum: normalizeSemesterData(semData, parsedSemester),
            meta: {
                requestedBranch: decodedBranch,
                sourceBranch: curriculum.branch || FALLBACK_CURRICULUM.branch,
                fallbackApplied
            }
        });
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
