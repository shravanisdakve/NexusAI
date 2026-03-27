const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const auth = require('../middleware/auth');
const User = require('../models/user');
const UniversityCircular = require('../models/UniversityCircular');
const UniversitySchedule = require('../models/UniversitySchedule');
const UniversityLink = require('../models/UniversityLink');
const { computeDaysRemaining, predictResultWindow, formatDateISO } = require('../utils/universityLogic');
const { runUniversityScraper } = require('../services/scraperService');


// Helper to get ISO date with offset in days
const getRelativeDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
};

const getSeedCirculars = () => [
    {
        title: 'NEP 2024-25: Revised Progression Criteria for FE/SE',
        category: 'Academic',
        urgent: true,
        publishedAt: getRelativeDate(-2), // 2 days ago
        link: 'https://mu.ac.in/circulars',
        source: 'seed',
    },
    {
        title: 'Summer Session Examination: Form Filling Notice',
        category: 'Exams',
        urgent: false,
        publishedAt: getRelativeDate(-7), // 1 week ago
        link: 'https://mu.ac.in/exams-and-results',
        source: 'seed',
    },
    {
        title: "Inter-University Research Convention 'Avishkar'",
        category: 'Events',
        urgent: false,
        publishedAt: getRelativeDate(-10), // 10 days ago
        link: 'https://mu.ac.in/events',
        source: 'seed',
    },
    {
        title: 'Result Revaluation Window: Deadline Extension',
        category: 'Results',
        urgent: true,
        publishedAt: getRelativeDate(-1), // Yesterday
        link: 'https://mu.ac.in/exams-and-results',
        source: 'seed',
    },
];

const getSeedSchedule = () => [
    {
        subject: 'Engineering Mechanics',
        date: getRelativeDate(45), // 45 days in future
        time: '10:30 AM',
        status: 'Confirmed',
        source: 'seed',
    },
    {
        subject: 'Applied Mathematics II',
        date: getRelativeDate(48), // 48 days in future
        time: '10:30 AM',
        status: 'Tentative',
        source: 'seed',
    },
    {
        subject: 'Basic Electrical Engineering',
        date: getRelativeDate(51), // 51 days in future
        time: '10:30 AM',
        status: 'Tentative',
        source: 'seed',
    },
];

const DEFAULT_LINKS = [
    { name: 'MU Official Circulars', href: 'https://mu.ac.in/circulars', kind: 'official' },
    { name: 'MU Exam Portal', href: 'https://mu.ac.in/exams-and-results', kind: 'exam' },
    { name: 'MU Results Portal', href: 'https://www.mumresults.in/', kind: 'result' },
    { name: 'SAMARTH HEI Portal', href: 'https://mum.samarth.ac.in/', kind: 'portal' },
    { name: 'Transcript Application', href: 'https://mu.ac.in/e-transcript-portal', kind: 'service' },
];

const DEFAULT_SOURCE_URLS = [
    'https://mu.ac.in/circular',
    'https://www.mumresults.in/'
];

const hashCircularCandidate = (title, link) => {
    const normalizedTitle = String(title || '').trim().toLowerCase();
    const normalizedLink = String(link || '').trim().toLowerCase();
    return crypto.createHash('sha1').update(`${normalizedTitle}|${normalizedLink}`).digest('hex');
};

const ensureBaseUniversityData = async () => {
    const [circularCount, scheduleCount, linkCount] = await Promise.all([
        UniversityCircular.countDocuments(),
        UniversitySchedule.countDocuments(),
        UniversityLink.countDocuments(),
    ]);

    // CRITICAL: Always reset the seed data to guarantee relative dates (e.g., "2 days ago")
    // are correct for every demo run.
    console.log("[University] Refreshing dynamic seed data...");
    await Promise.all([
        UniversityCircular.deleteMany({ source: 'seed' }),
        UniversitySchedule.deleteMany({ source: 'seed' }),
        UniversityLink.deleteMany({}), // Always refresh links to ensure latest URLs match DEFAULT_LINKS
    ]);

    await Promise.all([
        UniversityCircular.insertMany(
            getSeedCirculars().map((item) => ({
                ...item,
                sourceHash: hashCircularCandidate(item.title, item.link),
            }))
        ),
        UniversitySchedule.insertMany(getSeedSchedule()),
    ]);

    await UniversityLink.insertMany(DEFAULT_LINKS);
};

const normalizeCircular = (item) => ({
    id: String(item._id),
    title: item.title,
    category: item.category,
    urgent: Boolean(item.urgent),
    publishedAt: new Date(item.publishedAt).toISOString(),
    dateLabel: formatDateISO(item.publishedAt),
    link: item.link,
    source: item.source,
});

const normalizeScheduleItem = (item) => ({
    subject: item.subject,
    date: new Date(item.date).toISOString(),
    dateLabel: formatDateISO(item.date),
    time: item.time,
    status: item.status,
    source: item.source,
    daysRemaining: computeDaysRemaining(item.date),
});

const buildUniversityPayload = ({ user, circulars, schedule, links }) => {
    const normalizedCirculars = circulars.map(normalizeCircular);
    const normalizedSchedule = schedule.map(normalizeScheduleItem);

    const nextExam = normalizedSchedule.find((item) => item.daysRemaining !== null && item.daysRemaining >= 0)
        || normalizedSchedule[0];

    const forecast = nextExam
        ? predictResultWindow(nextExam.date, [25, 31, 37, 42])
        : null;

    const samarthStatus = {
        sessionActive: Boolean(user?.lastSamarthSyncAt),
        lastSyncedAt: user?.lastSamarthSyncAt ? new Date(user.lastSamarthSyncAt).toISOString() : null,
    };

    return {
        circulars: normalizedCirculars,
        schedule: normalizedSchedule,
        forecast,
        samarthStatus,
        links: links.map((item) => ({ name: item.name, href: item.href, kind: item.kind })),
    };
};

const loadDashboardData = async ({ query, category }) => {
    const circularQuery = {};

    if (query) {
        circularQuery.title = { $regex: query, $options: 'i' };
    }
    if (category) {
        circularQuery.category = { $regex: `^${category}$`, $options: 'i' };
    }

    const [circulars, schedule, links] = await Promise.all([
        UniversityCircular.find(circularQuery).sort({ publishedAt: -1 }).limit(30).lean(),
        UniversitySchedule.find({}).sort({ date: 1 }).limit(40).lean(),
        UniversityLink.find({}).sort({ name: 1 }).lean(),
    ]);

    return { circulars, schedule, links };
};

const upsertManualSchedule = async (manualSchedule) => {
    if (!Array.isArray(manualSchedule)) return 0;
    let upserted = 0;

    for (const item of manualSchedule) {
        if (!item?.subject || !item?.date) continue;

        const date = new Date(item.date);
        if (Number.isNaN(date.getTime())) continue;

        const result = await UniversitySchedule.updateOne(
            { subject: item.subject, date },
            {
                $set: {
                    time: item.time || '10:30 AM',
                    status: item.status || 'Tentative',
                    source: 'manual-sync',
                },
            },
            { upsert: true }
        );

        if (result.upsertedCount > 0) {
            upserted += 1;
        }
    }

    return upserted;
};


router.get('/dashboard', auth, async (req, res) => {
    try {
        await ensureBaseUniversityData();

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const data = await loadDashboardData({
            query: req.query.query || '',
            category: req.query.category || '',
        });

        const payload = buildUniversityPayload({
            user,
            circulars: data.circulars,
            schedule: data.schedule,
            links: data.links,
        });

        return res.json({ success: true, data: payload });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/sync', auth, async (req, res) => {
    try {
        await ensureBaseUniversityData();

        const sourceUrls = Array.isArray(req.body?.sources) && req.body.sources.length > 0
            ? req.body.sources.filter((url) => typeof url === 'string')
            : DEFAULT_SOURCE_URLS;

        const circularSync = await runUniversityScraper(sourceUrls);
        const scheduleUpserts = await upsertManualSchedule(req.body?.manualSchedule);

        const now = new Date();
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { lastSamarthSyncAt: now } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const data = await loadDashboardData({
            query: req.query.query || '',
            category: req.query.category || '',
        });

        const payload = buildUniversityPayload({
            user,
            circulars: data.circulars,
            schedule: data.schedule,
            links: data.links,
        });

        return res.json({
            success: true,
            message: 'University data synchronized via Live Scraper.',
            sync: {
                sourceCount: sourceUrls.length,
                upsertedCirculars: circularSync.upsertedCount || 0,
                upsertedScheduleItems: scheduleUpserts,
                newCirculars: circularSync.newCirculars || []
            },
            data: payload,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
