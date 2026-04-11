const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DECLARATION_DELAYS_DAYS = [28, 34, 41];

const parseDate = (value) => {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const computeDaysRemaining = (targetDate, now = new Date()) => {
    const parsedTarget = parseDate(targetDate);
    const parsedNow = parseDate(now);
    if (!parsedTarget || !parsedNow) return null;

    const diff = parsedTarget.getTime() - parsedNow.getTime();
    return Math.ceil(diff / DAY_IN_MS);
};

const formatDateISO = (value) => {
    const parsed = parseDate(value);
    return parsed ? parsed.toISOString().split('T')[0] : null;
};

const predictResultWindow = (examDate, historicalDelays = DEFAULT_DECLARATION_DELAYS_DAYS) => {
    const parsedExamDate = parseDate(examDate);
    if (!parsedExamDate) return null;

    const validDelays = (Array.isArray(historicalDelays) ? historicalDelays : [])
        .map((delay) => Number(delay))
        .filter((delay) => Number.isFinite(delay) && delay > 0);

    const delays = validDelays.length > 0 ? validDelays : DEFAULT_DECLARATION_DELAYS_DAYS;
    const minDelay = Math.min(...delays);
    const maxDelay = Math.max(...delays);

    const startDate = new Date(parsedExamDate.getTime() + (minDelay * DAY_IN_MS));
    const endDate = new Date(parsedExamDate.getTime() + (maxDelay * DAY_IN_MS));
    const spread = Math.max(1, maxDelay - minDelay);
    const confidencePercent = Math.max(55, Math.min(95, Math.round(100 - (spread * 1.25))));

    return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startDateLabel: formatDateISO(startDate),
        endDateLabel: formatDateISO(endDate),
        confidencePercent,
        basedOnDelays: delays,
    };
};

module.exports = {
    DAY_IN_MS,
    DEFAULT_DECLARATION_DELAYS_DAYS,
    computeDaysRemaining,
    predictResultWindow,
    formatDateISO,
};
