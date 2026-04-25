const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluatePlacementAttempt, getReadinessBand } = require('../utils/placementLogic');

const questions = [
    { id: 1, section: 'Quant', correctIndex: 1 },
    { id: 2, section: 'Quant', correctIndex: 0 },
    { id: 3, section: 'Logical', correctIndex: 2 },
    { id: 4, section: 'Technical', correctIndex: 3 },
];

test('evaluatePlacementAttempt computes accuracy and section breakdown', () => {
    const result = evaluatePlacementAttempt({
        questions,
        answers: { 1: 1, 2: 0, 3: 1, 4: 3 },
        timeTakenSec: 320,
    });

    assert.equal(result.totalQuestions, 4);
    assert.equal(result.attemptedQuestions, 4);
    assert.equal(result.correctAnswers, 3);
    assert.equal(result.incorrectAnswers, 1);
    assert.equal(result.scorePercent, 75);
    assert.equal(Array.isArray(result.sectionBreakdown), true);
    assert.equal(result.sectionBreakdown.length, 3);
    assert.equal(result.readinessBand, 'Medium');
});

test('getReadinessBand assigns high band for strong scores', () => {
    const band = getReadinessBand(92);
    assert.equal(band.band, 'High');
});
