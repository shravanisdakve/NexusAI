const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const Resource = require('../models/Resource');
const User = require('../models/user');

dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'https://muquestionpapers.com';
const SOURCE_PAGES = [
  '/be/computer-engineering/semester-3',
  '/be/information-technology/semester-5',
  '/be/electronics-and-telecommunication/semester-6',
  '/be/mechanical-engineering/semester-4',
  '/be/civil-engineering/semester-7'
];

const monthNames = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

const toTitle = (value) => value
  .replace(/[-_]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b\w/g, (c) => c.toUpperCase());

const getYearFromSemester = (semester) => {
  if (!semester || Number.isNaN(semester)) return 1;
  return Math.min(4, Math.max(1, Math.ceil(semester / 2)));
};

const extractPdfLinks = (html, pageUrl) => {
  const matches = [...html.matchAll(/href\s*=\s*["']([^"']+\.pdf(?:\?[^"']*)?)["']/gi)];
  const links = new Set();

  for (const match of matches) {
    const href = match[1];
    try {
      const absolute = new URL(href, pageUrl).toString();
      if (absolute.startsWith(BASE_URL)) {
        links.add(absolute);
      }
    } catch {
      // Ignore malformed links.
    }
  }

  return [...links];
};

const parseMetaFromPdfUrl = (pdfUrl) => {
  const pathname = new URL(pdfUrl).pathname;
  const filename = path.basename(pathname, '.pdf');
  const parts = filename.split('_').filter(Boolean);

  const semesterToken = parts.find((part) => /^semester-\d+$/i.test(part)) || '';
  const semester = Number((semesterToken.match(/\d+/) || [0])[0]);
  const studyYear = getYearFromSemester(semester);

  const yearToken = parts.find((part) => /^\d{4}$/.test(part)) || '';
  const monthToken = parts.find((part) => monthNames.includes(String(part).toLowerCase())) || '';

  let subjectStart = 0;
  const monthIndex = parts.findIndex((part) => String(part).toLowerCase() === String(monthToken).toLowerCase());
  if (monthIndex >= 0) {
    subjectStart = monthIndex + 1;
  } else {
    const semIndex = parts.findIndex((part) => part === semesterToken);
    subjectStart = semIndex >= 0 ? semIndex + 1 : 0;
  }

  const subjectRaw = parts.slice(subjectStart).join(' ');
  let subject = toTitle(subjectRaw || 'Question Paper');
  subject = subject.replace(/\bRev[-\s]*\d{4}.*$/i, '').trim() || 'Question Paper';

  const examLabel = [monthToken ? toTitle(monthToken) : '', yearToken].filter(Boolean).join(' ');
  const title = `${subject}${examLabel ? ` (${examLabel})` : ''}${semester ? ` - Sem ${semester}` : ''}`;

  return {
    semester,
    studyYear,
    subject,
    title
  };
};

const run = async () => {
  const targetCount = Number(process.argv[2] || 10);
  if (!Number.isFinite(targetCount) || targetCount <= 0) {
    throw new Error('Target count must be a positive number.');
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('[seedMuPyqSamples] Connected to MongoDB');

  const user = await User.findOne({ email: 'admin@nexusai.com' }) || await User.findOne({});
  if (!user) {
    throw new Error('No user found. Create at least one user before seeding resources.');
  }
  console.log(`[seedMuPyqSamples] Using uploader: ${user.displayName || user.email}`);

  const pageBuckets = [];
  for (const pagePath of SOURCE_PAGES) {
    const pageUrl = new URL(pagePath, BASE_URL).toString();
    try {
      const response = await fetch(pageUrl);
      if (!response.ok) {
        console.warn(`[seedMuPyqSamples] Skipping page ${pageUrl}: HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();
      const pdfLinks = extractPdfLinks(html, pageUrl);
      pageBuckets.push(pdfLinks.map((pdfLink) => ({ pageUrl, pdfLink })));
      console.log(`[seedMuPyqSamples] ${pageUrl} -> ${pdfLinks.length} pdf links`);
    } catch (error) {
      console.warn(`[seedMuPyqSamples] Failed to fetch ${pageUrl}: ${error.message}`);
    }
  }

  const uniqueLinks = [];
  const seen = new Set();
  let progress = true;

  while (uniqueLinks.length < targetCount && progress) {
    progress = false;
    for (const bucket of pageBuckets) {
      while (bucket.length > 0) {
        const candidate = bucket.shift();
        if (!candidate || seen.has(candidate.pdfLink)) {
          continue;
        }
        seen.add(candidate.pdfLink);
        uniqueLinks.push(candidate);
        progress = true;
        break;
      }
      if (uniqueLinks.length >= targetCount) break;
    }
  }

  if (uniqueLinks.length === 0) {
    console.log('[seedMuPyqSamples] No PDF links discovered.');
    await mongoose.disconnect();
    return;
  }

  const candidateLinks = uniqueLinks.map((item) => item.pdfLink);
  const existing = await Resource.find({ link: { $in: candidateLinks } }).select('link').lean();
  const existingSet = new Set(existing.map((item) => item.link));

  const toInsert = uniqueLinks
    .filter((item) => !existingSet.has(item.pdfLink))
    .map((item) => {
      const meta = parseMetaFromPdfUrl(item.pdfLink);
      return {
        title: meta.title,
        description: `Mumbai University previous year question paper (source: muquestionpapers.com). Semester ${meta.semester || 'N/A'}.`,
        type: 'Paper',
        branch: 'Common',
        year: meta.studyYear,
        subject: meta.subject,
        link: item.pdfLink,
        uploadedBy: user._id
      };
    });

  if (toInsert.length > 0) {
    await Resource.insertMany(toInsert, { ordered: false });
  }

  console.log(`[seedMuPyqSamples] Added ${toInsert.length} new PDF resources. Skipped ${existingSet.size} existing links.`);
  await mongoose.disconnect();
  console.log('[seedMuPyqSamples] Done.');
};

run().catch(async (error) => {
  console.error('[seedMuPyqSamples] Failed:', error.message);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exit(1);
});
