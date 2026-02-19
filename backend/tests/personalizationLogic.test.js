const test = require('node:test');
const assert = require('node:assert/strict');

const { getMostUsedTool, buildRecommendedTools } = require('../utils/personalizationLogic');

test('getMostUsedTool returns top usage entry', () => {
    const mostUsed = getMostUsedTool({
        tutor: 2,
        placement: 7,
        quizzes: 4,
    });

    assert.equal(mostUsed, 'placement');
});

test('buildRecommendedTools prioritizes placement tools for placement users', () => {
    const recommended = buildRecommendedTools({
        userProfile: {
            targetExam: 'Placements',
            learningStyle: 'interactive',
        },
        analytics: {
            topicMastery: [{ topic: 'Probability', accuracy: 52 }],
        },
        usageCounts: {
            placement: 3,
            quizzes: 2,
        },
        placementAttempts: [{ accuracy: 58 }],
    });

    assert.equal(Array.isArray(recommended), true);
    assert.ok(recommended.includes('placement'));
    assert.ok(recommended.includes('quizzes'));
});
