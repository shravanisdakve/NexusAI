const express = require('express');
const router = express.Router();

const PlacementData = require('../models/PlacementData');
const PlacementAttempt = require('../models/PlacementAttempt');
const PersonalizationEvent = require('../models/PersonalizationEvent');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { evaluatePlacementAttempt } = require('../utils/placementLogic');

const SIMULATOR_CONFIG = [
    {
        slug: 'tcs-nqt',
        name: 'TCS NQT 2025 Simulator',
        description: 'Foundation style aptitude + reasoning drill based on current campus hiring patterns.',
        durationMin: 75,
        sections: ['Numerical', 'Verbal', 'Reasoning'],
    },
    {
        slug: 'capgemini',
        name: 'Capgemini Exceller Drive',
        description: 'Game-based aptitude and technical screening style challenge for exceller hiring track.',
        durationMin: 70,
        sections: ['Quant', 'Logical', 'Technical'],
    },
];

const SIMULATOR_QUESTIONS = {
    'tcs-nqt': [
        {
            id: 1,
            section: 'Numerical',
            text: 'A train covers 360 km in 4 hours. What is its average speed?',
            options: ['80 km/h', '85 km/h', '90 km/h', '95 km/h'],
            correctIndex: 2,
        },
        {
            id: 2,
            section: 'Numerical',
            text: 'If 20% of a number is 84, what is the number?',
            options: ['360', '400', '420', '480'],
            correctIndex: 2,
        },
        {
            id: 3,
            section: 'Verbal',
            text: 'Choose the correct sentence.',
            options: [
                'Each of the students were present.',
                'Each of the students was present.',
                'Each students was present.',
                'Each students were present.',
            ],
            correctIndex: 1,
        },
        {
            id: 4,
            section: 'Reasoning',
            text: 'If all coders are problem solvers and some problem solvers are musicians, which statement is true?',
            options: [
                'All coders are musicians.',
                'Some coders are musicians.',
                'No coder is a musician.',
                'No definite conclusion about coders being musicians.',
            ],
            correctIndex: 3,
        },
        {
            id: 5,
            section: 'Reasoning',
            text: 'In a certain code, MUMBAI is written as NVNCBJ. How is DELHI written?',
            options: ['EFMIJ', 'EFMII', 'EFMHI', 'DEMIJ'],
            correctIndex: 0,
        },
        {
            id: 6,
            section: 'Numerical',
            text: 'The average of first 10 natural numbers is:',
            options: ['5', '5.5', '6', '6.5'],
            correctIndex: 1,
        },
    ],
    capgemini: [
        {
            id: 1,
            section: 'Quant',
            text: 'A and B complete a task in 12 days and 18 days respectively. Working together, they finish in:',
            options: ['6.8 days', '7.2 days', '7.5 days', '8 days'],
            correctIndex: 1,
        },
        {
            id: 2,
            section: 'Quant',
            text: 'What is the simple interest on Rs. 15,000 at 8% p.a. for 2 years?',
            options: ['Rs. 2,000', 'Rs. 2,200', 'Rs. 2,400', 'Rs. 2,600'],
            correctIndex: 2,
        },
        {
            id: 3,
            section: 'Logical',
            text: 'Find the odd one out: 3, 5, 11, 14, 17',
            options: ['3', '5', '11', '14'],
            correctIndex: 3,
        },
        {
            id: 4,
            section: 'Logical',
            text: 'If SOUTH is coded as 71328 and NORTH as 46528, what is the code for SOUTHNORTH?',
            options: ['7132846528', '4652871328', '7132846582', '7132465288'],
            correctIndex: 0,
        },
        {
            id: 5,
            section: 'Technical',
            text: 'Which data structure is best suited for implementing recursion call stack?',
            options: ['Queue', 'Stack', 'Linked List', 'Tree'],
            correctIndex: 1,
        },
        {
            id: 6,
            section: 'Technical',
            text: 'Which SQL clause is used to filter grouped rows?',
            options: ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY'],
            correctIndex: 2,
        },
    ],
};

const FALLBACK_TRENDS = [
    { collegeName: 'SPIT', avgPackage: 10.2, highestPackage: 38.5, year: 2025 },
    { collegeName: 'VJTI', avgPackage: 8.5, highestPackage: 27.0, year: 2025 },
    { collegeName: 'DJSCE', avgPackage: 8.1, highestPackage: 25.0, year: 2025 },
    { collegeName: 'TSEC', avgPackage: 7.5, highestPackage: 19.0, year: 2025 },
];

const FALLBACK_STARTUPS = [
    { name: 'Jupiter', sector: 'FinTech', stack: 'Java, Security, Node.js' },
    { name: 'Truemeds', sector: 'HealthTech', stack: 'Backend, Mobile, Data' },
    { name: 'Haptik', sector: 'AI/NLP', stack: 'ML, Data Engineering' },
    { name: 'Zepto', sector: 'Commerce', stack: 'System Design, SRE' },
];

const mapQuestionForClient = (question) => ({
    id: question.id,
    section: question.section,
    text: question.text,
    options: question.options,
});

const getSimulatorBySlug = (slug) => SIMULATOR_CONFIG.find((item) => item.slug === slug);

const buildStatsFromTrends = (trends) => {
    if (!Array.isArray(trends) || trends.length === 0) {
        return [
            { label: 'Highest Package', value: 'Rs 38.5 LPA', college: 'SPIT' },
            { label: 'VJTI Avg', value: 'Rs 8.5 LPA', color: 'text-emerald-400' },
            { label: 'SPIT Avg', value: 'Rs 10.2 LPA', color: 'text-blue-400' },
            { label: 'Mass Recruiters', value: 'Rs 3.6 - 7 LPA' },
        ];
    }

    const bestCollege = trends[0];
    const highestPackage = Math.max(...trends.map((item) => Number(item.highestPackage || 0)));

    return [
        { label: 'Highest Package', value: `Rs ${highestPackage.toFixed(1)} LPA`, college: bestCollege.collegeName },
        { label: `${bestCollege.collegeName} Avg`, value: `Rs ${Number(bestCollege.avgPackage || 0).toFixed(1)} LPA`, color: 'text-emerald-400' },
        { label: 'Top 4 Avg', value: `Rs ${(trends.slice(0, 4).reduce((acc, item) => acc + Number(item.avgPackage || 0), 0) / Math.min(4, trends.length)).toFixed(1)} LPA`, color: 'text-blue-400' },
        { label: 'Mass Recruiters', value: 'Rs 3.5 - 7.5 LPA' },
    ];
};

// Get placement dashboard
router.get('/dashboard', async (req, res) => {
    try {
        let trends = await PlacementData.aggregate([
            {
                $group: {
                    _id: '$collegeName',
                    avgPackage: { $avg: '$averagePackage' },
                    highestPackage: { $max: '$highestPackage' },
                    year: { $max: '$year' },
                },
            },
            { $project: { _id: 0, collegeName: '$_id', avgPackage: 1, highestPackage: 1, year: 1 } },
            { $sort: { avgPackage: -1 } },
            { $limit: 8 },
        ]);

        if (!trends || trends.length === 0) {
            trends = FALLBACK_TRENDS;
        }

        const stats = buildStatsFromTrends(trends);
        const simulators = SIMULATOR_CONFIG.map((simulator) => {
            const questions = SIMULATOR_QUESTIONS[simulator.slug] || [];
            return {
                ...simulator,
                questionCount: questions.length,
                href: `/placement/${simulator.slug}`,
            };
        });

        res.json({
            success: true,
            data: {
                stats,
                trends,
                startups: FALLBACK_STARTUPS,
                simulators,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get simulator metadata list
router.get('/simulators', async (req, res) => {
    const simulators = SIMULATOR_CONFIG.map((simulator) => ({
        ...simulator,
        questionCount: (SIMULATOR_QUESTIONS[simulator.slug] || []).length,
        href: `/placement/${simulator.slug}`,
    }));
    res.json({ success: true, simulators });
});

// Get simulator payload
router.get('/simulators/:slug/questions', async (req, res) => {
    try {
        const slug = req.params.slug;
        const simulator = getSimulatorBySlug(slug);
        if (!simulator) {
            return res.status(404).json({ success: false, message: 'Simulator not found' });
        }

        const questions = (SIMULATOR_QUESTIONS[slug] || []).map(mapQuestionForClient);
        return res.json({
            success: true,
            simulator: {
                ...simulator,
                questionCount: questions.length,
            },
            questions,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// Submit simulator answers and store attempt
router.post('/simulators/:slug/submit', auth, async (req, res) => {
    try {
        const slug = req.params.slug;
        const simulator = getSimulatorBySlug(slug);
        if (!simulator) {
            return res.status(404).json({ success: false, message: 'Simulator not found' });
        }

        const answers = req.body.answers || {};
        const timeTakenSec = Number(req.body.timeTakenSec || 0);
        const fullQuestionSet = SIMULATOR_QUESTIONS[slug] || [];

        if (fullQuestionSet.length === 0) {
            return res.status(400).json({ success: false, message: 'Question set unavailable for simulator' });
        }

        const evaluation = evaluatePlacementAttempt({
            questions: fullQuestionSet,
            answers,
            timeTakenSec,
        });

        const savedAttempt = await PlacementAttempt.create({
            userId: req.user.id,
            simulatorSlug: slug,
            simulatorName: simulator.name,
            totalQuestions: evaluation.totalQuestions,
            attemptedQuestions: evaluation.attemptedQuestions,
            correctAnswers: evaluation.correctAnswers,
            incorrectAnswers: evaluation.incorrectAnswers,
            accuracy: evaluation.scorePercent,
            pace: evaluation.pace,
            timeTakenSec: evaluation.timeTakenSec,
            sectionBreakdown: evaluation.sectionBreakdown,
            focusAreas: evaluation.focusAreas,
            readinessBand: evaluation.readinessBand,
            recommendation: evaluation.recommendation,
        });

        const user = await User.findById(req.user.id);
        if (user) {
            const rewardXp = evaluation.scorePercent >= 75 ? 60 : 30;
            await user.addXP(rewardXp);
            const current = Number(user.toolUsageCounters?.get('placement') || 0);
            user.toolUsageCounters.set('placement', current + 1);
            await user.save();
        }

        await PersonalizationEvent.create({
            userId: req.user.id,
            eventType: 'placement_attempt',
            toolKey: 'placement',
            metadata: {
                simulatorSlug: slug,
                accuracy: evaluation.scorePercent,
                readinessBand: evaluation.readinessBand,
            },
        });

        return res.json({
            success: true,
            attemptId: savedAttempt._id,
            result: {
                ...evaluation,
                simulatorSlug: slug,
                simulatorName: simulator.name,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// Get recent attempts for logged-in user
router.get('/attempts/recent', auth, async (req, res) => {
    try {
        const attempts = await PlacementAttempt.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({ success: true, attempts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get overall placement trends
router.get('/trends/overall', async (req, res) => {
    try {
        let trends = await PlacementData.aggregate([
            {
                $group: {
                    _id: '$collegeName',
                    avgPackage: { $avg: '$averagePackage' },
                    highestPackage: { $max: '$highestPackage' },
                },
            },
            { $project: { _id: 0, collegeName: '$_id', avgPackage: 1, highestPackage: 1 } },
            { $sort: { avgPackage: -1 } },
        ]);

        if (!trends || trends.length === 0) {
            trends = FALLBACK_TRENDS;
        }

        res.json({ success: true, trends });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get placement stats for a specific college (kept last to avoid route conflicts)
router.get('/:college', async (req, res) => {
    try {
        const { college } = req.params;
        const stats = await PlacementData
            .find({ collegeName: new RegExp(college, 'i') })
            .sort({ year: -1 });

        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
