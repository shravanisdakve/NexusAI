const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const auth = require('../middleware/auth');
const User = require('../models/user');
const UniversityCircular = require('../models/UniversityCircular');
const UniversitySchedule = require('../models/UniversitySchedule');
const UniversityLink = require('../models/UniversityLink');
const { computeDaysRemaining, predictResultWindow, formatDateISO } = require('../utils/universityLogic');

const DEFAULT_CIRCULARS = [
    {
        title: 'NEP 2024-25: Revised Progression Criteria for FE/SE',
        category: 'Academic',
        urgent: true,
        publishedAt: '2026-02-02T10:30:00.000Z',
        link: 'https://mu.ac.in/circulars',
        source: 'seed',
    },
    {
        title: 'Summer 2026 Examination: Form Filling Notice',
        category: 'Exams',
        urgent: false,
        publishedAt: '2026-01-28T09:00:00.000Z',
        link: 'https://mu.ac.in/exams-and-results',
        source: 'seed',
    },
    {
        title: "Inter-University Research Convention 'Avishkar'",
        category: 'Events',
        urgent: false,
        publishedAt: '2026-01-25T12:30:00.000Z',
        link: 'https://mu.ac.in/events',
        source: 'seed',
    },
    {
        title: 'Result Revaluation Window: Deadline Extension',
        category: 'Results',
        urgent: true,
        publishedAt: '2026-02-10T13:15:00.000Z',
        link: 'https://mu.ac.in/exams-and-results',
        source: 'seed',
    },
];

const DEFAULT_SCHEDULE = [
    {
        subject: 'Engineering Mechanics',
        date: '2026-05-12T05:00:00.000Z',
        time: '10:30 AM',
        status: 'Confirmed',
        source: 'seed',
    },
    {
        subject: 'Applied Mathematics II',
        date: '2026-05-15T05:00:00.000Z',
        time: '10:30 AM',
        status: 'Tentative',
        source: 'seed',
    },
    {
        subject: 'Basic Electrical Engineering',
        date: '2026-05-19T05:00:00.000Z',
        time: '10:30 AM',
        status: 'Tentative',
        source: 'seed',
    },
];

const DEFAULT_LINKS = [
    { name: 'MU Official Circulars', href: 'https://mu.ac.in/circulars', kind: 'official' },
    { name: 'MU Exam Portal', href: 'https://mu.ac.in/exams-and-results', kind: 'exam' },
    { name: 'SAMARTH HEI Portal', href: 'https://mu.samarth.edu.in/', kind: 'portal' },
    { name: 'Transcript Application', href: 'https://mu.ac.in/student-corner', kind: 'service' },
];

const DEFAULT_SOURCE_URLS = [
    'https://mu.ac.in/circulars',
    'https://mu.ac.in/exams-and-results',
];

const stripHtml = (value = '') =>
    value
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/\s+/g, ' ')
        .trim();

const parseDateFromText = (value) => {
    if (!value) return null;

    const monthDate = value.match(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},\s*\d{4}\b/i);
    if (monthDate) {
        const parsed = new Date(monthDate[0]);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    const ddmmyyyy = value.match(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/);
    if (ddmmyyyy) {
        const normalized = ddmmyyyy[0].replace(/-/g, '/');
        const parts = normalized.split('/');
        if (parts.length === 3) {
            const [dd, mm, yyyyRaw] = parts;
            const yyyy = yyyyRaw.length === 2 ? `20${yyyyRaw}` : yyyyRaw;
            const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
            const parsed = new Date(iso);
            if (!Number.isNaN(parsed.getTime())) return parsed;
        }
    }

    return null;
};

const detectCategory = (title) => {
    const lower = title.toLowerCase();
    if (/(exam|result|revaluation|timetable|semester|atkt)/i.test(lower)) return 'Exams';
    if (/(event|workshop|convention|seminar|festival)/i.test(lower)) return 'Events';
    if (/(admission|application|enrollment|convocation)/i.test(lower)) return 'Administration';
    return 'Academic';
};

const isUrgent = (title) => /(urgent|important|deadline|last date|final)/i.test(title.toLowerCase());

const normalizeHref = (href, baseUrl) => {
    if (!href) return baseUrl;
    try {
        return new URL(href, baseUrl).toString();
    } catch {
        return baseUrl;
    }
};

const hashCircularCandidate = (title, link) => {
    const normalizedTitle = String(title || '').trim().toLowerCase();
    const normalizedLink = String(link || '').trim().toLowerCase();
    return crypto.createHash('sha1').update(`${normalizedTitle}|${normalizedLink}`).digest('hex');
};

const fetchWithTimeout = async (url, timeoutMs = 12000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timeout);
    }
};

const parseCircularCandidates = (html, sourceUrl) => {
    const seen = new Set();
    const candidates = [];
    const anchorRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

    let match;
    while ((match = anchorRegex.exec(html)) !== null) {
        const href = match[1];
        const rawTitle = stripHtml(match[2]);
        if (rawTitle.length < 24 || rawTitle.length > 220) continue;
        if (/^(home|read more|view|click here|next|previous)$/i.test(rawTitle)) continue;

        const key = rawTitle.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const contextStart = Math.max(0, match.index - 140);
        const contextEnd = Math.min(html.length, match.index + 340);
        const context = stripHtml(html.slice(contextStart, contextEnd));
        const parsedDate = parseDateFromText(context);
        const fallbackDate = new Date();
        fallbackDate.setUTCHours(0, 0, 0, 0);
        const publishedAt = parsedDate || fallbackDate;
        const link = normalizeHref(href, sourceUrl);

        candidates.push({
            title: rawTitle,
            category: detectCategory(rawTitle),
            urgent: isUrgent(rawTitle),
            publishedAt,
            link,
            source: sourceUrl,
            sourceHash: hashCircularCandidate(rawTitle, link),
        });

        if (candidates.length >= 14) break;
    }

    return candidates;
};

const ensureBaseUniversityData = async () => {
    const [circularCount, scheduleCount, linkCount] = await Promise.all([
        UniversityCircular.countDocuments(),
        UniversitySchedule.countDocuments(),
        UniversityLink.countDocuments(),
    ]);

    if (circularCount === 0) {
        await UniversityCircular.insertMany(
            DEFAULT_CIRCULARS.map((item) => ({
                ...item,
                sourceHash: hashCircularCandidate(item.title, item.link),
            }))
        );
    }
    if (scheduleCount === 0) {
        await UniversitySchedule.insertMany(DEFAULT_SCHEDULE);
    }
    if (linkCount === 0) {
        await UniversityLink.insertMany(DEFAULT_LINKS);
    }
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
        sessionActive: Boolean(user.lastSamarthSyncAt),
        lastSyncedAt: user.lastSamarthSyncAt ? new Date(user.lastSamarthSyncAt).toISOString() : null,
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

const syncCircularsFromSources = async (sources) => {
    let fetchedCount = 0;
    let upsertedCount = 0;
    let updatedCount = 0;
    const errors = [];
    const sourceBreakdown = [];

    for (const sourceUrl of sources) {
        const sourceMetrics = {
            sourceUrl,
            fetchedCandidates: 0,
            upserted: 0,
            updated: 0,
            status: 'ok',
        };

        try {
            const response = await fetchWithTimeout(sourceUrl);
            if (!response.ok) {
                sourceMetrics.status = `http-${response.status}`;
                errors.push(`Failed ${sourceUrl}: HTTP ${response.status}`);
                sourceBreakdown.push(sourceMetrics);
                continue;
            }

            const html = await response.text();
            const candidates = parseCircularCandidates(html, sourceUrl);
            fetchedCount += candidates.length;
            sourceMetrics.fetchedCandidates = candidates.length;

            for (const candidate of candidates) {
                const result = await UniversityCircular.updateOne(
                    candidate.sourceHash
                        ? { sourceHash: candidate.sourceHash }
                        : { title: candidate.title, link: candidate.link },
                    {
                        $setOnInsert: {
                            title: candidate.title,
                            publishedAt: candidate.publishedAt,
                            sourceHash: candidate.sourceHash || '',
                        },
                        $set: {
                            title: candidate.title,
                            category: candidate.category,
                            urgent: candidate.urgent,
                            publishedAt: candidate.publishedAt,
                            link: candidate.link,
                            source: candidate.source,
                            sourceHash: candidate.sourceHash || '',
                        },
                    },
                    { upsert: true }
                );

                if (result.upsertedCount > 0) {
                    upsertedCount += 1;
                    sourceMetrics.upserted += 1;
                } else if ((result.modifiedCount || 0) > 0) {
                    updatedCount += 1;
                    sourceMetrics.updated += 1;
                }
            }
        } catch (error) {
            sourceMetrics.status = 'error';
            errors.push(`Failed ${sourceUrl}: ${error.message}`);
        }

        sourceBreakdown.push(sourceMetrics);
    }

    return { fetchedCount, upsertedCount, updatedCount, errors, sourceBreakdown };
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

        const circularSync = await syncCircularsFromSources(sourceUrls);
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
            message: 'University data synchronized.',
            sync: {
                sourceCount: sourceUrls.length,
                fetchedCircularCandidates: circularSync.fetchedCount,
                upsertedCirculars: circularSync.upsertedCount,
                updatedCirculars: circularSync.updatedCount,
                upsertedScheduleItems: scheduleUpserts,
                warnings: circularSync.errors,
                sources: circularSync.sourceBreakdown,
            },
            data: payload,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
