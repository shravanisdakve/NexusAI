const TOOL_KEYS = [
    'tutor',
    'summaries',
    'quizzes',
    'gpa',
    'project',
    'curriculum',
    'placement',
    'kt',
    'paper',
    'viva',
    'study-plan',
    'math',
];

const SCORE_RULES_BY_TARGET = {
    Placements: { placement: 5, math: 4, quizzes: 2, tutor: 2 },
    GATE: { paper: 4, tutor: 3, quizzes: 2, 'study-plan': 2 },
    'Semester Exams': { curriculum: 4, summaries: 3, 'study-plan': 3, tutor: 2 },
};

const SCORE_RULES_BY_STYLE = {
    visual: { summaries: 2, curriculum: 2, project: 1 },
    text: { summaries: 3, paper: 2, tutor: 1 },
    interactive: { quizzes: 3, project: 2, placement: 1 },
};

const ensureToolScoreMap = () => TOOL_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});

const toPlainUsage = (usageSource) => {
    if (!usageSource) return {};

    if (typeof usageSource.toObject === 'function') {
        return usageSource.toObject();
    }

    if (usageSource instanceof Map) {
        return Object.fromEntries(usageSource.entries());
    }

    return { ...usageSource };
};

const getMostUsedTool = (usageSource) => {
    const usage = toPlainUsage(usageSource);
    const entries = Object.entries(usage).filter(([, count]) => Number(count) > 0);
    if (entries.length === 0) return null;
    entries.sort((a, b) => Number(b[1]) - Number(a[1]));
    return entries[0][0];
};

const applyScoreRule = (scoreMap, rule = {}) => {
    Object.entries(rule).forEach(([tool, weight]) => {
        if (scoreMap[tool] !== undefined) {
            scoreMap[tool] += Number(weight) || 0;
        }
    });
};

const getWeakTopicCount = (analytics = {}) => {
    const topics = Array.isArray(analytics.topicMastery) ? analytics.topicMastery : [];
    return topics.filter((topic) => Number(topic.accuracy || 0) < 65).length;
};

const getPlacementRisk = (placementAttempts = []) => {
    if (!Array.isArray(placementAttempts) || placementAttempts.length === 0) return 0;
    const latest = placementAttempts[0];
    const accuracy = Number(latest.accuracy || latest.scorePercent || 0);
    if (accuracy >= 75) return 0;
    if (accuracy >= 60) return 1;
    return 2;
};

const buildRecommendedTools = ({
    userProfile = {},
    analytics = {},
    usageCounts = {},
    placementAttempts = [],
}) => {
    const scoreMap = ensureToolScoreMap();
    const usage = toPlainUsage(usageCounts);

    applyScoreRule(scoreMap, SCORE_RULES_BY_TARGET[userProfile.targetExam]);
    applyScoreRule(scoreMap, SCORE_RULES_BY_STYLE[(userProfile.learningStyle || '').toLowerCase()]);

    const weakTopicCount = getWeakTopicCount(analytics);
    if (weakTopicCount > 0) {
        scoreMap.tutor += 1 + Math.min(2, weakTopicCount);
        scoreMap.quizzes += 1 + Math.min(2, weakTopicCount);
        scoreMap['study-plan'] += 1;
    }

    const placementRisk = getPlacementRisk(placementAttempts);
    if (placementRisk > 0) {
        scoreMap.placement += placementRisk * 2;
        scoreMap.math += placementRisk;
    }

    Object.entries(usage).forEach(([tool, count]) => {
        if (scoreMap[tool] === undefined) return;
        scoreMap[tool] += Math.min(4, Number(count) * 0.2);
    });

    return Object.entries(scoreMap)
        .sort((a, b) => b[1] - a[1])
        .map(([tool]) => tool)
        .slice(0, 5);
};

module.exports = {
    TOOL_KEYS,
    toPlainUsage,
    getMostUsedTool,
    buildRecommendedTools,
};
