const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const muAnalysis = require('../services/muAnalysisService');
const MUPastQuestion = require('../models/MUPastQuestion');

// --- PAPER INGESTION ---
router.post('/ingestPaper', auth, async (req, res) => {
    try {
        const { text, subject, branch, semester, paperYear, paperType, year } = req.body;
        if (!text || !subject || !branch) {
            return res.status(400).json({ success: false, message: 'Missing required paper data or metadata.' });
        }

        const result = await muAnalysis.ingestPaper(text, {
            subject,
            branch,
            semester,
            paperYear,
            paperType,
            year,
            userId: req.user.id
        });

        res.json({ success: true, message: `Successfully ingested ${result.count} questions.`, details: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- TOPIC PREDICTION ---
router.get('/predictTopics', auth, async (req, res) => {
    try {
        const { subject } = req.query;
        if (!subject) return res.status(400).json({ success: false, message: 'Subject name required for prediction.' });

        const result = await muAnalysis.predictTopics(subject);
        res.json({ success: true, prediction: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- LIKELY QUESTIONS ---
router.get('/likelyQuestions', auth, async (req, res) => {
    try {
        const { subject, module } = req.query;
        if (!subject) return res.status(400).json({ success: false, message: 'Subject name required.' });

        const questions = await muAnalysis.getLikelyQuestions(subject, module);
        res.json({ success: true, questions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- GET UNIQUE SUBJECTS ---
router.get('/subjects', auth, async (req, res) => {
    try {
        const subjects = await MUPastQuestion.distinct('subject');
        res.json({ success: true, subjects: subjects.sort() });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- GET UNIQUE YEARS ---
router.get('/paper-years', auth, async (req, res) => {
    try {
        const years = await MUPastQuestion.distinct('paperYear');
        res.json({ success: true, years: years.sort((a, b) => b - a) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- GET ENTRIES BY SUBJECT OR YEAR ---
router.get('/browse', auth, async (req, res) => {
    try {
        const { subject, year } = req.query;
        let query = {};
        if (subject) query.subject = subject;
        if (year) query.paperYear = Number(year);

        const papers = await MUPastQuestion.find(query).sort({ paperYear: -1, frequency: -1 }).limit(100);
        res.json({ success: true, papers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
