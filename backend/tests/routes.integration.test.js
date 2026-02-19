const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');

const placementRouter = require('../routes/placement');
const universityRouter = require('../routes/university');
const personalizationRouter = require('../routes/personalization');
const authRouter = require('../routes/auth');
const resourcesRouter = require('../routes/resources');

const PlacementData = require('../models/PlacementData');
const PlacementAttempt = require('../models/PlacementAttempt');
const PersonalizationEvent = require('../models/PersonalizationEvent');
const User = require('../models/user');
const UserProgress = require('../models/UserProgress');
const UniversityCircular = require('../models/UniversityCircular');
const UniversitySchedule = require('../models/UniversitySchedule');
const UniversityLink = require('../models/UniversityLink');
const Resource = require('../models/Resource');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'nexus-test-secret';

const toServer = async (app) =>
    new Promise((resolve) => {
        const server = app.listen(0, '127.0.0.1', () => resolve(server));
    });

const requestJson = async (server, path, options = {}) => {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
    const body = await response.json();
    return { status: response.status, body };
};

const authHeaders = () => {
    const token = jwt.sign({ userId: 'user-1', email: 'test@nexus.ai' }, process.env.JWT_SECRET);
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

const chainWithLean = (docs) => ({
    sort: () => ({
        limit: () => ({
            lean: async () => docs,
        }),
        lean: async () => docs,
    }),
});

const chainSortLimit = (docs) => ({
    sort: () => ({
        limit: async () => docs,
    }),
});

const stub = (target, key, value) => {
    const original = target[key];
    target[key] = value;
    return () => {
        target[key] = original;
    };
};

test('placement dashboard endpoint returns structured payload', async () => {
    const restores = [];
    const app = express();
    app.use(express.json());
    app.use('/api/placement', placementRouter);

    restores.push(stub(PlacementData, 'aggregate', async () => []));

    const server = await toServer(app);
    try {
        const { status, body } = await requestJson(server, '/api/placement/dashboard');
        assert.equal(status, 200);
        assert.equal(body.success, true);
        assert.equal(Array.isArray(body.data.simulators), true);
        assert.ok(body.data.simulators.length >= 2);
        assert.equal(Array.isArray(body.data.stats), true);
    } finally {
        server.close();
        restores.reverse().forEach((restore) => restore());
    }
});

test('auth signup endpoint validates required fields', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);

    const server = await toServer(app);
    try {
        const { status, body } = await requestJson(server, '/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'student@nexus.ai' }),
        });

        assert.equal(status, 400);
        assert.equal(body.success, false);
        assert.match(body.message, /All fields are required/);
    } finally {
        server.close();
    }
});

test('auth login endpoint validates missing credentials', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);

    const server = await toServer(app);
    try {
        const { status, body } = await requestJson(server, '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'student@nexus.ai' }),
        });

        assert.equal(status, 400);
        assert.equal(body.success, false);
        assert.match(body.message, /Email and password are required/);
    } finally {
        server.close();
    }
});

test('resources listing endpoint applies filters and returns resources', async () => {
    const restores = [];
    const app = express();
    app.use(express.json());
    app.use('/api/resources', resourcesRouter);

    let capturedFilter;
    restores.push(stub(Resource, 'find', (filter) => {
        capturedFilter = filter;
        return {
            populate: () => ({
                sort: async () => ([{
                    _id: 'res-1',
                    title: 'Engineering Mathematics PYQ',
                    branch: 'CSE',
                    year: 2,
                    subject: 'Applied Mathematics',
                    type: 'Paper',
                    link: 'https://example.com/math.pdf',
                }]),
            }),
        };
    }));

    const server = await toServer(app);
    try {
        const { status, body } = await requestJson(server, '/api/resources?branch=CSE&year=2&subject=math');
        assert.equal(status, 200);
        assert.equal(Array.isArray(body), true);
        assert.equal(body.length, 1);
        assert.equal(body[0].title, 'Engineering Mathematics PYQ');
        assert.equal(Array.isArray(capturedFilter.branch.$in), true);
        assert.equal(capturedFilter.branch.$in.includes('CSE'), true);
        assert.equal(capturedFilter.year, '2');
        assert.equal(Array.isArray(capturedFilter.$or), true);
    } finally {
        server.close();
        restores.reverse().forEach((restore) => restore());
    }
});

test('placement simulator questions endpoint returns client-safe payload', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/placement', placementRouter);

    const server = await toServer(app);
    try {
        const { status, body } = await requestJson(server, '/api/placement/simulators/tcs-nqt/questions');
        assert.equal(status, 200);
        assert.equal(body.success, true);
        assert.ok(Array.isArray(body.questions));
        assert.ok(body.questions.length > 0);
        assert.equal(Object.prototype.hasOwnProperty.call(body.questions[0], 'correctIndex'), false);
    } finally {
        server.close();
    }
});

test('placement submit endpoint evaluates and persists attempt', async () => {
    const restores = [];
    const app = express();
    app.use(express.json());
    app.use('/api/placement', placementRouter);

    const mockUser = {
        toolUsageCounters: new Map(),
        addXP: async () => ({ leveledUp: false, level: 1, xp: 50 }),
        save: async () => {},
    };

    restores.push(stub(User, 'findById', async () => mockUser));
    restores.push(stub(PlacementAttempt, 'create', async (payload) => ({ ...payload, _id: 'attempt-123' })));
    restores.push(stub(PersonalizationEvent, 'create', async () => ({ _id: 'evt-1' })));

    const server = await toServer(app);
    try {
        const { status, body } = await requestJson(server, '/api/placement/simulators/tcs-nqt/submit', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                answers: { 1: 2, 2: 2, 3: 1, 4: 3, 5: 0, 6: 1 },
                timeTakenSec: 1300,
            }),
        });

        assert.equal(status, 200);
        assert.equal(body.success, true);
        assert.ok(typeof body.result.scorePercent === 'number');
        assert.ok(body.result.scorePercent >= 0 && body.result.scorePercent <= 100);
        assert.ok(body.result.readinessBand);
    } finally {
        server.close();
        restores.reverse().forEach((restore) => restore());
    }
});

test('placement recent attempts endpoint returns user attempts list', async () => {
    const restores = [];
    const app = express();
    app.use(express.json());
    app.use('/api/placement', placementRouter);

    restores.push(stub(PlacementAttempt, 'find', () => chainSortLimit([
        {
            _id: 'attempt-1',
            simulatorSlug: 'tcs-nqt',
            simulatorName: 'TCS NQT 2025 Simulator',
            accuracy: 76,
            pace: 'Balanced',
            readinessBand: 'Medium',
        },
    ])));

    const server = await toServer(app);
    try {
        const { status, body } = await requestJson(server, '/api/placement/attempts/recent', {
            headers: authHeaders(),
        });

        assert.equal(status, 200);
        assert.equal(body.success, true);
        assert.ok(Array.isArray(body.attempts));
        assert.equal(body.attempts.length, 1);
        assert.equal(body.attempts[0].simulatorSlug, 'tcs-nqt');
    } finally {
        server.close();
        restores.reverse().forEach((restore) => restore());
    }
});

test('university sync endpoint performs live-source ingestion flow', async () => {
    const restores = [];
    const app = express();
    app.use(express.json());
    app.use('/api/university', universityRouter);

    restores.push(stub(UniversityCircular, 'countDocuments', async () => 1));
    restores.push(stub(UniversitySchedule, 'countDocuments', async () => 1));
    restores.push(stub(UniversityLink, 'countDocuments', async () => 1));
    restores.push(stub(UniversityCircular, 'updateOne', async () => ({ upsertedCount: 1 })));
    restores.push(stub(UniversitySchedule, 'updateOne', async () => ({ upsertedCount: 0 })));
    restores.push(stub(User, 'findByIdAndUpdate', async () => ({ _id: 'user-1', lastSamarthSyncAt: new Date() })));
    restores.push(stub(UniversityCircular, 'find', () => chainWithLean([
        {
            _id: 'c-1',
            title: 'Exam Form Notice',
            category: 'Exams',
            urgent: true,
            publishedAt: new Date('2026-02-10T00:00:00.000Z'),
            link: 'https://mu.ac.in/exams-and-results',
            source: 'https://mu.ac.in/exams-and-results',
        },
    ])));
    restores.push(stub(UniversitySchedule, 'find', () => chainWithLean([
        {
            subject: 'Engineering Mechanics',
            date: new Date('2026-05-12T05:00:00.000Z'),
            time: '10:30 AM',
            status: 'Confirmed',
            source: 'seed',
        },
    ])));
    restores.push(stub(UniversityLink, 'find', () => ({
        sort: () => ({
            lean: async () => [{ name: 'MU Official Circulars', href: 'https://mu.ac.in/circulars', kind: 'official' }],
        }),
    })));

    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
        const normalizedUrl = String(url);
        if (normalizedUrl.startsWith('http://127.0.0.1:')) {
            return originalFetch(url, options);
        }

        return {
            ok: true,
            status: 200,
            text: async () => `
                <html><body>
                <a href="/exams-and-results">Important Exam Notice 18/02/2026</a>
                <a href="/circulars">Academic Circular on progression rule</a>
                </body></html>
            `,
        };
    };

    const server = await toServer(app);
    try {
        const { status, body } = await requestJson(server, '/api/university/sync', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({}),
        });

        assert.equal(status, 200);
        assert.equal(body.success, true);
        assert.ok(body.sync.fetchedCircularCandidates > 0);
        assert.ok(body.sync.upsertedCirculars >= 1);
        assert.equal(Array.isArray(body.data.circulars), true);
    } finally {
        server.close();
        global.fetch = originalFetch;
        restores.reverse().forEach((restore) => restore());
    }
});

test('university sync endpoint captures source warnings when a source fails', async () => {
    const restores = [];
    const app = express();
    app.use(express.json());
    app.use('/api/university', universityRouter);

    restores.push(stub(UniversityCircular, 'countDocuments', async () => 1));
    restores.push(stub(UniversitySchedule, 'countDocuments', async () => 1));
    restores.push(stub(UniversityLink, 'countDocuments', async () => 1));
    restores.push(stub(UniversityCircular, 'updateOne', async () => ({ upsertedCount: 0, modifiedCount: 0 })));
    restores.push(stub(UniversitySchedule, 'updateOne', async () => ({ upsertedCount: 0 })));
    restores.push(stub(User, 'findByIdAndUpdate', async () => ({ _id: 'user-1', lastSamarthSyncAt: new Date() })));
    restores.push(stub(UniversityCircular, 'find', () => chainWithLean([])));
    restores.push(stub(UniversitySchedule, 'find', () => chainWithLean([])));
    restores.push(stub(UniversityLink, 'find', () => ({
        sort: () => ({
            lean: async () => [{ name: 'MU Official Circulars', href: 'https://mu.ac.in/circulars', kind: 'official' }],
        }),
    })));

    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
        const normalizedUrl = String(url);
        if (normalizedUrl.startsWith('http://127.0.0.1:')) {
            return originalFetch(url, options);
        }
        return {
            ok: false,
            status: 503,
            text: async () => '',
        };
    };

    const server = await toServer(app);
    try {
        const { status, body } = await requestJson(server, '/api/university/sync', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                sources: ['https://mu.ac.in/circulars'],
            }),
        });

        assert.equal(status, 200);
        assert.equal(body.success, true);
        assert.equal(body.sync.sourceCount, 1);
        assert.ok(Array.isArray(body.sync.warnings));
        assert.ok(body.sync.warnings.length >= 1);
        assert.equal(Array.isArray(body.sync.sources), true);
        assert.equal(body.sync.sources[0].status, 'http-503');
    } finally {
        server.close();
        global.fetch = originalFetch;
        restores.reverse().forEach((restore) => restore());
    }
});

test('personalization recommendations endpoint returns adaptive payload', async () => {
    const restores = [];
    const app = express();
    app.use(express.json());
    app.use('/api/personalization', personalizationRouter);

    restores.push(stub(User, 'findById', async () => ({
        _id: 'user-1',
        preferredLanguage: 'en',
        quickAccessTools: ['tutor'],
        toolUsageCounters: new Map([['placement', 4], ['quizzes', 2]]),
        targetExam: 'Placements',
        learningStyle: 'interactive',
    })));
    restores.push(stub(UserProgress, 'findOne', async () => ({
        topicMastery: [{ topic: 'Probability', accuracy: 52 }],
    })));
    restores.push(stub(PlacementAttempt, 'find', () => chainSortLimit([
        {
            simulatorSlug: 'tcs-nqt',
            accuracy: 58,
            readinessBand: 'Developing',
            focusAreas: ['Numerical'],
            createdAt: new Date('2026-02-17T00:00:00.000Z'),
        },
    ])));

    const server = await toServer(app);
    try {
        const { status, body } = await requestJson(server, '/api/personalization/recommendations', {
            headers: authHeaders(),
        });

        assert.equal(status, 200);
        assert.equal(body.success, true);
        assert.equal(Array.isArray(body.data.recommendedTools), true);
        assert.ok(body.data.recommendedTools.includes('placement'));
        assert.ok(Array.isArray(body.data.weakTopics));
    } finally {
        server.close();
        restores.reverse().forEach((restore) => restore());
    }
});

test('personalization tool usage endpoint persists increment and returns most-used', async () => {
    const restores = [];
    const app = express();
    app.use(express.json());
    app.use('/api/personalization', personalizationRouter);

    const mockUser = {
        toolUsageCounters: new Map([['placement', 1]]),
        save: async () => {},
    };

    restores.push(stub(User, 'findById', async () => mockUser));
    restores.push(stub(PersonalizationEvent, 'create', async () => ({ _id: 'evt-2' })));

    const server = await toServer(app);
    try {
        const { status, body } = await requestJson(server, '/api/personalization/tool-usage', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ toolKey: 'placement' }),
        });

        assert.equal(status, 200);
        assert.equal(body.success, true);
        assert.equal(body.data.usageCount, 2);
        assert.equal(body.data.mostUsedTool, 'placement');
    } finally {
        server.close();
        restores.reverse().forEach((restore) => restore());
    }
});

test('university dashboard endpoint returns filtered payload and samarth state', async () => {
    const restores = [];
    const app = express();
    app.use(express.json());
    app.use('/api/university', universityRouter);

    restores.push(stub(UniversityCircular, 'countDocuments', async () => 1));
    restores.push(stub(UniversitySchedule, 'countDocuments', async () => 1));
    restores.push(stub(UniversityLink, 'countDocuments', async () => 1));
    restores.push(stub(User, 'findById', async () => ({
        _id: 'user-1',
        lastSamarthSyncAt: new Date('2026-02-17T00:00:00.000Z'),
    })));
    restores.push(stub(UniversityCircular, 'find', () => chainWithLean([
        {
            _id: 'c-1',
            title: 'Exam Time Table Notice',
            category: 'Exams',
            urgent: true,
            publishedAt: new Date('2026-02-14T00:00:00.000Z'),
            link: 'https://mu.ac.in/exams-and-results',
            source: 'https://mu.ac.in/exams-and-results',
        },
    ])));
    restores.push(stub(UniversitySchedule, 'find', () => chainWithLean([
        {
            subject: 'Applied Mathematics II',
            date: new Date('2026-05-15T05:00:00.000Z'),
            time: '10:30 AM',
            status: 'Tentative',
            source: 'seed',
        },
    ])));
    restores.push(stub(UniversityLink, 'find', () => ({
        sort: () => ({
            lean: async () => [{ name: 'MU Official Circulars', href: 'https://mu.ac.in/circulars', kind: 'official' }],
        }),
    })));

    const server = await toServer(app);
    try {
        const { status, body } = await requestJson(server, '/api/university/dashboard?query=Exam&category=Exams', {
            headers: authHeaders(),
        });

        assert.equal(status, 200);
        assert.equal(body.success, true);
        assert.equal(Array.isArray(body.data.circulars), true);
        assert.equal(body.data.circulars[0].category, 'Exams');
        assert.equal(body.data.samarthStatus.sessionActive, true);
    } finally {
        server.close();
        restores.reverse().forEach((restore) => restore());
    }
});

test('personalization preferences endpoint updates language and quick access', async () => {
    const restores = [];
    const app = express();
    app.use(express.json());
    app.use('/api/personalization', personalizationRouter);

    const createdEvents = [];
    restores.push(stub(User, 'findByIdAndUpdate', async () => ({
        _id: 'user-1',
        preferredLanguage: 'mr',
        quickAccessTools: ['placement', 'tutor'],
    })));
    restores.push(stub(PersonalizationEvent, 'create', async (payload) => {
        createdEvents.push(payload);
        return { _id: `evt-${createdEvents.length}` };
    }));

    const server = await toServer(app);
    try {
        const { status, body } = await requestJson(server, '/api/personalization/preferences', {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({
                preferredLanguage: 'mr',
                quickAccessTools: ['placement', 'tutor'],
            }),
        });

        assert.equal(status, 200);
        assert.equal(body.success, true);
        assert.equal(body.data.preferredLanguage, 'mr');
        assert.deepEqual(body.data.quickAccessTools, ['placement', 'tutor']);
        assert.equal(createdEvents.length, 2);
    } finally {
        server.close();
        restores.reverse().forEach((restore) => restore());
    }
});
