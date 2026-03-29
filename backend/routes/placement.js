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
        description: 'Foundation style aptitude + reasoning + verbal + psychometric drill based on current campus hiring patterns.',
        durationMin: 25,
        sections: ['Numerical', 'Verbal', 'Reasoning', 'Technical', 'Psychometric'],
    },
    {
        slug: 'capgemini',
        name: 'Capgemini Exceller Drive',
        description: 'Comprehensive challenge including Game-based logic, English, and Pseudo-code for exceller hiring track.',
        durationMin: 20,
        sections: ['Quant', 'Logical', 'Verbal', 'Technical', 'Behavioral'],
    },
];

const SIMULATOR_QUESTIONS = {
    'tcs-nqt': [
        // Numerical (1-5)
        { id: 1, section: 'Numerical', text: 'A train covers 360 km in 4 hours. What is its average speed?', options: ['80 km/h', '85 km/h', '90 km/h', '95 km/h'], correctIndex: 2 },
        { id: 2, section: 'Numerical', text: 'If 20% of a number is 84, what is the number?', options: ['360', '400', '420', '480'], correctIndex: 2 },
        { id: 7, section: 'Numerical', text: 'A shopkeeper offers a 10% discount and still makes a 20% profit. If the cost price is Rs. 900, what is the marked price?', options: ['Rs. 1000', 'Rs. 1100', 'Rs. 1200', 'Rs. 1300'], correctIndex: 2 },
        { id: 10, section: 'Numerical', text: 'If the radius of a circle is increased by 50%, by what percentage does the area increase?', options: ['100%', '125%', '150%', '225%'], correctIndex: 1 },
        { id: 13, section: 'Numerical', text: 'The ratio of ages of A and B is 3:4. After 5 years, the ratio becomes 4:5. What is the current age of A?', options: ['10', '12', '15', '18'], correctIndex: 2 },
        
        // Verbal (6-10)
        { id: 3, section: 'Verbal', text: 'Choose the correct sentence.', options: ['Each of the students were present.', 'Each of the students was present.', 'Each students was present.', 'Each students were present.'], correctIndex: 1 },
        { id: 8, section: 'Verbal', text: 'Identify the synonym for "DILIGENT".', options: ['Lazy', 'Hardworking', 'Smart', 'Quick'], correctIndex: 1 },
        { id: 11, section: 'Verbal', text: 'Choose the antonym for "OBSCURE".', options: ['Hidden', 'Clear', 'Dark', 'Vague'], correctIndex: 1 },
        { id: 14, section: 'Verbal', text: 'Fill in: The CEO ______ the invitation to speak at the summit.', options: ['declined', 'rejects', 'refused to', 'was declined'], correctIndex: 0 },
        { id: 19, section: 'Verbal', text: 'Identify the part of speech for "ELEGANTLY" in: "She danced elegantly during the gala."', options: ['Adjective', 'Adverb', 'Noun', 'Verb'], correctIndex: 1 },
        
        // Reasoning (11-15)
        { id: 4, section: 'Reasoning', text: 'If all coders are problem solvers and some problem solvers are musicians, which statement is true?', options: ['All coders are musicians.', 'Some coders are musicians.', 'No coder is a musician.', 'No definite conclusion about coders being musicians.'], correctIndex: 3 },
        { id: 5, section: 'Reasoning', text: 'In a certain code, MUMBAI is written as NVNCBJ. How is DELHI written?', options: ['EFMIJ', 'EFMII', 'EFMHI', 'DEMIJ'], correctIndex: 0 },
        { id: 9, section: 'Reasoning', text: 'Complete the series: 2, 6, 12, 20, 30, ?', options: ['36', '40', '42', '48'], correctIndex: 2 },
        { id: 12, section: 'Reasoning', text: 'Pointing to a man, a woman says: "He is the only son of my mother\'s father." How is the man related to the woman?', options: ['Brother', 'Father', 'Uncle', 'Grandfather'], correctIndex: 2 },
        { id: 20, section: 'Reasoning', text: 'Statement: All mangoes are golden-colored. No golden-colored things are cheap. Conclusion: I. All mangoes are cheap. II. Golden-colored mangoes are not cheap.', options: ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows'], correctIndex: 1 },
        
        // Technical (16-18)
        { id: 15, section: 'Technical', text: 'In C++, which of the following is used for dynamic memory allocation?', options: ['malloc', 'new', 'alloc', 'create'], correctIndex: 1 },
        { id: 16, section: 'Technical', text: 'What is the primary role of a Load Balancer in system design?', options: ['Database backup', 'Traffic distribution', 'Encryption', 'Cache management'], correctIndex: 1 },
        { id: 21, section: 'Technical', text: 'Which of the following sorting algorithms has the best worst-case time complexity?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Quick Sort'], correctIndex: 2 },
        
        // Psychometric (19-20)
        { id: 17, section: 'Psychometric', text: 'You are leading a project and a teammate consistently misses deadlines. Your first action is:', options: ['Report to Manager', 'Publicly warn them', 'Private discussion to understand root cause', 'Assign their work to someone else'], correctIndex: 2 },
        { id: 18, section: 'Psychometric', text: 'If a client asks for a feature that would slightly compromise security but vastly improve speed, you:', options: ['Say yes immediately', 'Say no bluntly', 'Explain risks and suggest a balanced alternative', 'Ignore the request'], correctIndex: 2 }
    ],
    'capgemini': [
        // Quant & Logic (1-8)
        { id: 1, section: 'Quant', text: 'A and B complete a task in 12 days and 18 days respectively. Working together, they finish in:', options: ['6.8 days', '7.2 days', '7.5 days', '8 days'], correctIndex: 1 },
        { id: 2, section: 'Quant', text: 'What is the simple interest on Rs. 15,000 at 8% p.a. for 2 years?', options: ['Rs. 2,000', 'Rs. 2,200', 'Rs. 2,400', 'Rs. 2,600'], correctIndex: 2 },
        { id: 7, section: 'Quant', text: 'A motorboat whose speed is 15 km/hr in still water goes 30 km downstream and comes back in a total of 4.5 hours. What is the speed of the stream?', options: ['4 km/hr', '5 km/hr', '6 km/hr', '10 km/hr'], correctIndex: 1 },
        { id: 19, section: 'Quant', text: 'The length of a rectangle is twice its breadth. If its perimeter is 60 cm, what is its area?', options: ['150 sq cm', '200 sq cm', '225 sq cm', '300 sq cm'], correctIndex: 1 },
        { id: 3, section: 'Logical', text: 'Find the odd one out: 3, 5, 11, 14, 17', options: ['3', '5', '11', '14'], correctIndex: 3 },
        { id: 4, section: 'Logical', text: 'If SOUTH is coded as 71328 and NORTH as 46528, what is the code for SOUTHNORTH?', options: ['7132846528', '4652871328', '7132846582', '7132465288'], correctIndex: 0 },
        { id: 8, section: 'Logical', text: 'Look at this series: 7, 10, 8, 11, 9, 12, ... What number should come next?', options: ['7', '10', '12', '13'], correctIndex: 1 },
        { id: 20, section: 'Logical', text: 'Six people (A, B, C, D, E, F) are sitting in a circle. A is facing B, B is to the right of E and left of C. C is to the left of D. F is to the right of A. Who is to the left of F?', options: ['E', 'D', 'C', 'B'], correctIndex: 1 },
        
        // Verbal (9-12)
        { id: 13, section: 'Verbal', text: 'Find the correctly spelled word.', options: ['Necessary', 'Neccessary', 'Nessessary', 'Necesary'], correctIndex: 0 },
        { id: 14, section: 'Verbal', text: 'Convert to Passive: "The chef prepared a delicious meal."', options: ['A delicious meal prepares the chef.', 'A delicious meal was prepared by the chef.', 'Meal was delicious and prepared.', 'Chef has prepared the meal.'], correctIndex: 1 },
        { id: 15, section: 'Verbal', text: 'Identify the error: "He don\'t know the answer to the question."', options: ['He', "don't", 'the answer', 'no error'], correctIndex: 1 },
        { id: 21, section: 'Verbal', text: 'Fill in: Neither the teacher nor the students ______ aware of the schedule change.', options: ['was', 'were', 'is', 'has been'], correctIndex: 1 },
        
        // Technical (13-17)
        { id: 5, section: 'Technical', text: 'Which data structure is best suited for implementing recursion call stack?', options: ['Queue', 'Stack', 'Linked List', 'Tree'], correctIndex: 1 },
        { id: 6, section: 'Technical', text: 'Which SQL clause is used to filter grouped rows?', options: ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY'], correctIndex: 2 },
        { id: 9, section: 'Technical', text: 'Which of the following is not a pillar of OOPS?', options: ['Encapsulation', 'Polymorphism', 'Compilation', 'Abstraction'], correctIndex: 2 },
        { id: 16, section: 'Technical', text: 'What is the output of: x = 5; y = x++; print y;?', options: ['4', '5', '6', 'Error'], correctIndex: 1 },
        { id: 22, section: 'Technical', text: 'Which protocol is used for sending emails?', options: ['HTTP', 'FTP', 'SMTP', 'SSH'], correctIndex: 2 },
        
        // Behavioral (18-20)
        { id: 17, section: 'Behavioral', text: 'When faced with a complex task you\'ve never done before, you:', options: ['Panic', 'Wait for instructions', 'Research, break it down, and start learning', 'Ask someone else to do it'], correctIndex: 2 },
        { id: 18, section: 'Behavioral', text: 'Teammates are arguing over a design choice. You:', options: ['Pick a side', 'Leave them to it', 'Listen to both and facilitate a consensus', 'Complain to HR'], correctIndex: 2 },
        { id: 23, section: 'Behavioral', text: 'You notice a colleague taking office supplies for personal use. What do you do?', options: ['Join them', 'Ignore it', 'Informally talk to them about ethics', 'Report them to the police'], correctIndex: 2 }
    ],
};

const FALLBACK_TRENDS = [
    { collegeName: 'SPIT', avgPackage: 10.2, highestPackage: 38.5, year: 2025, source: 'SPIT Placement Portal (Projected)' },
    { collegeName: 'VJTI', avgPackage: 8.5, highestPackage: 27.0, year: 2025, source: 'VJTI Official Stats 2024' },
    { collegeName: 'DJSCE', avgPackage: 8.1, highestPackage: 25.0, year: 2025, source: 'DJSCE TPO Report' },
    { collegeName: 'TSEC', avgPackage: 7.5, highestPackage: 19.0, year: 2025, source: 'TSEC Placement Cell' },
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

// Predict placement probability
router.post('/predict', auth, async (req, res) => {
    try {
        const { college, branch, cgpa, skills, targetCompany } = req.body;
        
        let baseProb = 50;
        const breakdown = [];

        // College Tier adjustments (MU Specific)
        const collegeName = String(college || '').toUpperCase();
        if (['SPIT', 'VJTI'].includes(collegeName)) {
            baseProb += 15;
            breakdown.push({ label: 'Top-Tier College Bonus', impact: 15, type: 'positive' });
        } else if (['DJSCE', 'NMIMS', 'KJSCE'].includes(collegeName)) {
            baseProb += 10;
            breakdown.push({ label: 'Tier-1 College Bonus', impact: 10, type: 'positive' });
        } else if (['TSEC', 'VESIT', 'FR AGNEL'].includes(collegeName)) {
            baseProb += 5;
            breakdown.push({ label: 'Reputed College Bonus', impact: 5, type: 'positive' });
        } else {
            baseProb -= 5;
            breakdown.push({ label: 'Lower Tier College Adjustment', impact: -5, type: 'negative' });
        }

        // CGPA adjustments
        const gpa = Number(cgpa) || 0;
        if (gpa >= 9) {
            baseProb += 15;
            breakdown.push({ label: 'Outstanding CGPA (9+)', impact: 15, type: 'positive' });
        } else if (gpa >= 8) {
            baseProb += 10;
            breakdown.push({ label: 'Strong CGPA (8+)', impact: 10, type: 'positive' });
        } else if (gpa < 7 && gpa >= 6.5) {
            baseProb -= 10;
            breakdown.push({ label: 'CGPA Filter Risk (< 7)', impact: -10, type: 'negative' });
        } else if (gpa < 6.5) {
            baseProb -= 25;
            breakdown.push({ label: 'Critical CGPA Filter (< 6.5)', impact: -25, type: 'negative' });
        }

        // Target Company specific expectations
        const company = String(targetCompany || '').toUpperCase();
        let expectedSkills = [];
        let difficultyPenalty = 0;
        let ctcEstimate = '';
        
        if (company.includes('TCS') && company.includes('DIGITAL')) {
            expectedSkills = ['JAVA', 'PYTHON', 'DSA', 'SQL'];
            difficultyPenalty = 10;
            ctcEstimate = '7.0 LPA';
        } else if (company.includes('TCS')) {
            expectedSkills = ['C', 'JAVA', 'SQL'];
            difficultyPenalty = 0;
            ctcEstimate = '3.36 LPA';
        } else if (company.includes('INFOSYS') && company.includes('DSE')) {
            expectedSkills = ['DSA', 'SYSTEM DESIGN', 'JAVA', 'PYTHON', 'NODE'];
            difficultyPenalty = 15;
            ctcEstimate = '6.25 - 9.5 LPA';
        } else if (company.includes('INFOSYS')) {
            expectedSkills = ['OOP', 'SQL', 'JAVA'];
            difficultyPenalty = 0;
            ctcEstimate = '3.6 LPA';
        } else if (['JP MORGAN', 'MORGAN STANLEY', 'BARCLAYS'].includes(company)) {
            expectedSkills = ['DSA', 'SYSTEM DESIGN', 'SPRING BOOT', 'REACT', 'CLOUD'];
            difficultyPenalty = 25;
            ctcEstimate = '14.0 - 20.0 LPA';
        } else if (company.includes('JIO')) {
            expectedSkills = ['JAVA', 'SPRING BOOT', 'REACT', 'DSA'];
            difficultyPenalty = 5;
            ctcEstimate = '6.0 - 8.0 LPA';
        } else {
            expectedSkills = ['HTML', 'CSS', 'JS', 'SQL'];
            difficultyPenalty = 5;
            ctcEstimate = '4.0 - 6.0 LPA';
        }

        if (difficultyPenalty > 0) {
            baseProb -= difficultyPenalty;
            breakdown.push({ label: `High Entry Bar for ${targetCompany}`, impact: -difficultyPenalty, type: 'negative' });
        }

        // Skills Match
        const userSkills = Array.isArray(skills) ? skills.map(s => String(s).toUpperCase()) : [];
        let matchedSkillsCount = 0;
        expectedSkills.forEach(reqSkill => {
            if (userSkills.some(us => us.includes(reqSkill) || reqSkill.includes(us))) {
                matchedSkillsCount++;
            }
        });

        if (expectedSkills.length > 0) {
            const skillMatchRatio = matchedSkillsCount / expectedSkills.length;
            const skillPointBonus = Math.round(skillMatchRatio * 20);
            baseProb += skillPointBonus;
            if (skillPointBonus > 0) {
                breakdown.push({ label: 'Technical Skill Match', impact: skillPointBonus, type: 'positive' });
            } else {
                breakdown.push({ label: 'Missing Key Tech Skills', impact: 0, type: 'negative' });
            }
        }

        // Branch adjustments
        const branchName = String(branch || '').toUpperCase();
        if (['COMPUTER', 'IT', 'DATA SCIENCE', 'AI'].some(b => branchName.includes(b))) {
            baseProb += 5;
            breakdown.push({ label: 'Branch Relevancy (Tech)', impact: 5, type: 'positive' });
        } else if (!['EXTC', 'ELECTRONICS'].some(b => branchName.includes(b))) {
            baseProb -= 10;
            breakdown.push({ label: 'Non-Tech Branch Factor', impact: -10, type: 'negative' });
        }

        // Clamp probability between 5 and 95
        const probability = Math.max(5, Math.min(95, Math.round(baseProb)));

        let message = '';
        if (probability > 80) message = 'Excellent chances. Maintain your CGPA and practice DSA.';
        else if (probability > 60) message = `Good chances. Focus on improving ${expectedSkills.filter(s => !userSkills.some(us => us.includes(s))).join(', ') || 'coding speed'}.`;
        else if (probability > 40) message = 'Fair chances. You need to boost your technical skills and aptitude preparation.';
        else message = 'Challenging. Work extensively on aptitude, foundational programming, and consider building standout projects.';

        // Comparisons (Quick benchmarks for other companies)
        const commonCompanies = ['TCS Ninja', 'TCS Digital', 'Infosys', 'Accenture', 'JPMC'];
        const comparisons = commonCompanies.map(comp => {
            let tempProb = 50;
            // Simplified logic for comparison
            if (['SPIT', 'VJTI'].includes(collegeName)) tempProb += 15;
            else if (['DJSCE', 'NMIMS'].includes(collegeName)) tempProb += 10;
            
            if (gpa >= 8.5) tempProb += 15;
            
            if (comp.includes('Digital') || comp.includes('JPMC')) tempProb -= 20;
            if (comp.includes('Ninja') || comp.includes('Infosys')) tempProb += 5;

            return {
                company: comp,
                probability: Math.max(5, Math.min(95, Math.round(tempProb + (matchedSkillsCount * 3))))
            };
        });

        res.json({
            success: true,
            prediction: {
                probability,
                message,
                ctcEstimate,
                matchedSkillsCount,
                expectedSkills,
                breakdown,
                comparisons
            }
        });
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
