const DEFAULT_TIME_PER_QUESTION_SEC = 90;

const READINESS_BANDS = [
    {
        minScore: 85,
        band: 'High',
        message: 'You are ready for Digital/Prime shortlisting rounds. Focus on consistency.',
    },
    {
        minScore: 70,
        band: 'Medium',
        message: 'You are close. Improve weaker sections and maintain timed practice.',
    },
    {
        minScore: 0,
        band: 'Developing',
        message: 'Build fundamentals first, then attempt timed mixed section sets.',
    },
];

const asNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toAnswerMap = (answers) => {
    if (!answers) return {};
    if (!Array.isArray(answers)) {
        return { ...answers };
    }

    return answers.reduce((acc, answer) => {
        if (answer && (answer.questionId || answer.questionId === 0)) {
            acc[answer.questionId] = answer.selectedIndex;
        }
        return acc;
    }, {});
};

const calculateSectionBreakdown = (questions, answers) => {
    const answerMap = toAnswerMap(answers);
    const sectionTotals = {};

    questions.forEach((question) => {
        const section = question.section || 'General';
        if (!sectionTotals[section]) {
            sectionTotals[section] = { section, total: 0, correct: 0, attempted: 0 };
        }

        const sectionRef = sectionTotals[section];
        sectionRef.total += 1;

        const selected = answerMap[question.id];
        if (selected !== undefined && selected !== null) {
            sectionRef.attempted += 1;
            if (selected === question.correctIndex) {
                sectionRef.correct += 1;
            }
        }
    });

    return Object.values(sectionTotals).map((item) => {
        const attemptedAccuracy = item.attempted > 0
            ? Math.round((item.correct / item.attempted) * 100)
            : 0;
        const totalCoverageAccuracy = item.total > 0
            ? Math.round((item.correct / item.total) * 100)
            : 0;

        return {
            ...item,
            accuracy: attemptedAccuracy,
            coverageAccuracy: totalCoverageAccuracy,
        };
    });
};

const buildFocusAreas = (sectionBreakdown, max = 3) =>
    [...sectionBreakdown]
        .sort((a, b) => a.coverageAccuracy - b.coverageAccuracy)
        .filter((item) => item.total > 0)
        .slice(0, max)
        .map((item) => item.section);

const getReadinessBand = (scorePercent) => {
    const score = asNumber(scorePercent);
    return READINESS_BANDS.find((entry) => score >= entry.minScore) || READINESS_BANDS[READINESS_BANDS.length - 1];
};

const evaluatePlacementAttempt = ({ questions, answers, timeTakenSec }) => {
    const safeQuestions = Array.isArray(questions) ? questions : [];
    const answerMap = toAnswerMap(answers);
    const totalQuestions = safeQuestions.length;

    let attemptedQuestions = 0;
    let correctAnswers = 0;

    safeQuestions.forEach((question) => {
        const selected = answerMap[question.id];
        if (selected === undefined || selected === null) return;

        attemptedQuestions += 1;
        if (selected === question.correctIndex) {
            correctAnswers += 1;
        }
    });

    const scorePercent = totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    const sectionBreakdown = calculateSectionBreakdown(safeQuestions, answerMap);
    const focusAreas = buildFocusAreas(sectionBreakdown);

    const safeTimeTaken = Math.max(0, asNumber(timeTakenSec, 0));
    const expectedTime = totalQuestions * DEFAULT_TIME_PER_QUESTION_SEC;
    const paceRatio = expectedTime > 0 ? safeTimeTaken / expectedTime : 1;
    const pace = paceRatio <= 0.85 ? 'Fast' : paceRatio <= 1.15 ? 'Balanced' : 'Slow';

    const readiness = getReadinessBand(scorePercent);

    return {
        totalQuestions,
        attemptedQuestions,
        correctAnswers,
        incorrectAnswers: Math.max(0, attemptedQuestions - correctAnswers),
        scorePercent,
        pace,
        timeTakenSec: safeTimeTaken,
        sectionBreakdown,
        focusAreas,
        readinessBand: readiness.band,
        recommendation: readiness.message,
    };
};

module.exports = {
    READINESS_BANDS,
    calculateSectionBreakdown,
    buildFocusAreas,
    getReadinessBand,
    evaluatePlacementAttempt,
};
