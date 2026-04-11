const cheerio = require('cheerio');
const crypto = require('crypto');
const UniversityCircular = require('../models/UniversityCircular');

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const detectCategory = (title) => {
    const lower = title.toLowerCase();
    if (/(exam|result|revaluation|timetable|semester|atkt)/i.test(lower)) return 'Exams';
    if (/(event|workshop|convention|seminar|festival)/i.test(lower)) return 'Events';
    if (/(admission|application|enrollment|convocation|fee)/i.test(lower)) return 'Administration';
    return 'Academic';
};

const isUrgent = (title) => /(urgent|important|deadline|last date|final)/i.test(title.toLowerCase());

const hashCircularCandidate = (title, link) => {
    const normalizedTitle = String(title || '').trim().toLowerCase();
    const normalizedLink = String(link || '').trim().toLowerCase();
    return crypto.createHash('sha1').update(`${normalizedTitle}|${normalizedLink}`).digest('hex');
};

const fetchWithAgent = async (url) => {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
    } catch (error) {
        console.error(`Scraper error on ${url}:`, error.message);
        return null;
    }
};

const parseDate = (text) => {
    if (!text) return null;
    const ddmmyyyy = text.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
    if (ddmmyyyy) {
        let [_, d, m, y] = ddmmyyyy;
        if (y.length === 2) y = `20${y}`;
        const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
        if (!isNaN(date.getTime())) return date;
    }
    return null;
};

const scrapeMuCirculars = async () => {
    const url = 'https://mu.ac.in/circular';
    const html = await fetchWithAgent(url);
    if (!html) return [];

    const $ = cheerio.load(html);
    const results = [];
    
    $('.entry-content table tr').each((i, el) => {
        if (i === 0) return; // Skip header
        const tds = $(el).find('td');
        if (tds.length < 3) return;

        const titleAnchor = $(tds[2]).find('a');
        const title = titleAnchor.text().trim();
        const href = titleAnchor.attr('href');
        const dateText = $(tds[3]).text().trim();

        if (!title || !href) return;

        let finalHref = href;
        if (finalHref.startsWith('/')) {
            finalHref = `https://mu.ac.in${finalHref}`;
        }

        const publishedAt = parseDate(dateText) || new Date();

        results.push({
            title,
            category: detectCategory(title),
            urgent: isUrgent(title),
            publishedAt,
            link: finalHref,
            source: url,
            sourceHash: hashCircularCandidate(title, finalHref)
        });
    });
    return results;
};

const scrapeMuResults = async () => {
    const url = 'https://www.mumresults.in/';
    const html = await fetchWithAgent(url);
    if (!html) return [];

    const $ = cheerio.load(html);
    const results = [];
    
    // Target the first major results table
    $('table.counterone').first().find('tr').each((i, el) => {
        if (i === 0) return; // Skip header
        const tds = $(el).find('td');
        if (tds.length < 3) return;

        const titleAnchor = $(tds[2]).find('a');
        const title = titleAnchor.text().trim();
        const href = titleAnchor.attr('href');
        const dateText = $(tds[3]).text().trim();

        if (!title || !href) return;

        let finalHref = href;
        if (finalHref.startsWith('http') === false) {
            finalHref = `https://www.mumresults.in/${finalHref}`;
        }

        const publishedAt = parseDate(dateText) || new Date();

        results.push({
            title: `Result: ${title}`,
            category: 'Results',
            urgent: false,
            publishedAt,
            link: finalHref,
            source: url,
            sourceHash: hashCircularCandidate(title, finalHref)
        });
    });
    return results;
};

const scrapeMuExams = async () => {
    const url = 'https://mu.ac.in/examination';
    const html = await fetchWithAgent(url);
    if (!html) return [];

    const $ = cheerio.load(html);
    const results = [];
    
    $('.entry-content table tr').each((i, el) => {
        if (i === 0) return; // Skip header
        const tds = $(el).find('td');
        if (tds.length < 3) return;

        const titleAnchor = $(tds[2]).find('a');
        const title = titleAnchor.text().trim();
        const href = titleAnchor.attr('href');
        const dateText = $(tds[3]).text().trim();

        if (!title || !href) return;

        let finalHref = href;
        if (finalHref.startsWith('/')) {
            finalHref = `https://mu.ac.in${finalHref}`;
        }

        const publishedAt = parseDate(dateText) || new Date();

        results.push({
            title,
            category: 'Exams',
            urgent: isUrgent(title),
            publishedAt,
            link: finalHref,
            source: url,
            sourceHash: hashCircularCandidate(title, finalHref)
        });
    });
    return results;
};

const runUniversityScraper = async () => {
    let upsertedCount = 0;
    let newCirculars = [];

    const circulars = await scrapeMuCirculars();
    const results = await scrapeMuResults();
    const exams = await scrapeMuExams();
    const allCandidates = [...circulars, ...results, ...exams];

    for (const candidate of allCandidates) {

        try {
            const result = await UniversityCircular.updateOne(
                { sourceHash: candidate.sourceHash },
                {
                    $setOnInsert: {
                        title: candidate.title,
                        publishedAt: candidate.publishedAt,
                        sourceHash: candidate.sourceHash,
                    },
                    $set: {
                        category: candidate.category,
                        urgent: candidate.urgent,
                        link: candidate.link,
                        source: candidate.source
                    }
                },
                { upsert: true }
            );

            if (result.upsertedCount > 0) {
                upsertedCount++;
                newCirculars.push(candidate);
            }
        } catch (err) {
            if (err.code !== 11000) {
                console.error("Scraper DB error:", err.message);
            }
        }
    }

    return { success: true, upsertedCount, newCirculars };
};

module.exports = {
    runUniversityScraper,
    scrapeMuCirculars,
    scrapeMuExams,
    scrapeMuResults
};


