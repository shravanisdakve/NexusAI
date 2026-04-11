const express = require('express');
const router = express.Router();
const Ordinance = require('../models/Ordinance');

// Calculate grace marks eligibility
router.post('/calculate-grace', async (req, res) => {
    try {
        const { subjects, totalAggregate, extracurriculars } = req.body;

        let report = {
            ordinance5042A: { eligible: false, marksRecommended: 0, details: "" },
            ordinance5044A: { eligible: false, marksRecommended: 0, details: "" },
            ordinance229A: { eligible: extracurriculars, marksRecommended: extracurriculars ? 10 : 0 },
            status: "Pass/Fail Prediction"
        };

        // Simplified logic for O.5042-A (Passing Grace)
        // 10 marks total, max 1% of aggregate
        const maxPassingGrace = Math.min(10, Math.floor(totalAggregate * 0.01));
        let failingSubjects = subjects.filter(s => s.status === 'Fail');
        let totalGraceNeeded = failingSubjects.reduce((acc, s) => acc + (s.passingMarks - s.obtainedMarks), 0);

        if (totalGraceNeeded > 0 && totalGraceNeeded <= maxPassingGrace) {
            report.ordinance5042A.eligible = true;
            report.ordinance5042A.marksRecommended = totalGraceNeeded;
            report.ordinance5042A.details = `Eligible for ${totalGraceNeeded} marks to pass ${failingSubjects.length} subject(s).`;
        }

        // Simplified logic for O.5044-A (Distinction Grace)
        let distinctionGapSubjects = subjects.filter(s => s.obtainedMarks >= s.distinctionMarks - 3 && s.obtainedMarks < s.distinctionMarks);
        if (distinctionGapSubjects.length > 0 && distinctionGapSubjects.length <= 2) {
            report.ordinance5044A.eligible = true;
            report.ordinance5044A.marksRecommended = distinctionGapSubjects.length * 3;
            report.ordinance5044A.details = `Eligible for up to 3 marks in ${distinctionGapSubjects.length} subject(s) to reach distinction.`;
        }

        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Progression check for NEP 2024-25
router.post('/progression-check', async (req, res) => {
    try {
        const { currentSemester, cumulativeCredits } = req.body;
        let result = { canPromote: false, message: "", threshold: 0 };

        if (currentSemester === 2) {
            result.threshold = 32;
            result.canPromote = cumulativeCredits >= 32;
            result.message = result.canPromote
                ? "Congratulations! You have met the 32-credit threshold for Semester III."
                : `You need ${32 - cumulativeCredits} more credits to progress to Semester III.`;
        } else if (currentSemester === 4) {
            result.threshold = 76;
            result.canPromote = cumulativeCredits >= 76;
            result.message = result.canPromote
                ? "Congratulations! You have met the 76-credit threshold for Semester V."
                : `You need ${76 - cumulativeCredits} more credits to progress to Semester V.`;
        } else {
            result.canPromote = true;
            result.message = "Regular promotion applies for this semester.";
        }

        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
