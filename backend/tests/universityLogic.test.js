const test = require('node:test');
const assert = require('node:assert/strict');

const { computeDaysRemaining, predictResultWindow } = require('../utils/universityLogic');

test('computeDaysRemaining returns a non-negative countdown for future date', () => {
    const now = new Date('2026-02-17T00:00:00.000Z');
    const target = '2026-02-20T00:00:00.000Z';
    const days = computeDaysRemaining(target, now);
    assert.equal(days, 3);
});

test('predictResultWindow builds a valid date window with confidence', () => {
    const forecast = predictResultWindow('2026-05-10T00:00:00.000Z', [25, 31, 37]);

    assert.ok(forecast);
    assert.equal(typeof forecast.startDate, 'string');
    assert.equal(typeof forecast.endDate, 'string');
    assert.equal(Array.isArray(forecast.basedOnDelays), true);
    assert.equal(forecast.basedOnDelays.length, 3);
    assert.ok(forecast.confidencePercent >= 55 && forecast.confidencePercent <= 95);
    assert.ok(new Date(forecast.endDate).getTime() > new Date(forecast.startDate).getTime());
});
