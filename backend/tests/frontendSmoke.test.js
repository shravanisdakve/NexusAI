const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

const readSource = (...segments) => {
    const filePath = path.join(repoRoot, ...segments);
    return fs.readFileSync(filePath, 'utf8');
};

test('frontend routes expose placement and university hubs', () => {
    const appSource = readSource('App.tsx');
    assert.match(appSource, /path="\/placement"/);
    assert.match(appSource, /path="\/placement\/:simulatorSlug"/);
    assert.match(appSource, /path="\/university-status"/);
});

test('placement arena is wired to backend placement APIs', () => {
    const pageSource = readSource('pages', 'PlacementArena.tsx');
    assert.match(pageSource, /getPlacementDashboard/);
    assert.match(pageSource, /getRecentPlacementAttempts/);
    assert.match(pageSource, /trackToolUsage\('placement'\)/);
});

test('university status page is wired to dashboard and sync endpoints', () => {
    const pageSource = readSource('pages', 'UniversityStatus.tsx');
    assert.match(pageSource, /getUniversityDashboard/);
    assert.match(pageSource, /syncUniversityPortal/);
    assert.match(pageSource, /handleSync/);
});

test('simulator page fetches question payload and submits attempt results', () => {
    const pageSource = readSource('pages', 'TCSNQTSimulator.tsx');
    assert.match(pageSource, /getSimulatorQuestions/);
    assert.match(pageSource, /submitSimulator/);
    assert.match(pageSource, /trackToolUsage\('placement'\)/);
});

test('dashboard and university i18n dictionaries include new completion keys in all languages', () => {
    const i18nSource = readSource('contexts', 'i18n.ts');
    const mustExistInAllLanguages = [
        'dashboard.weeklySnapshotTitle',
        'dashboard.readyToFocus',
        'dashboard.aiToolkitTitle',
        'university.predictedWindow',
    ];

    mustExistInAllLanguages.forEach((key) => {
        const matches = i18nSource.match(new RegExp(`'${key.replace('.', '\\.')}'\\s*:`, 'g')) || [];
        assert.equal(
            matches.length >= 3,
            true,
            `Expected key "${key}" to be present in en/mr/hi dictionaries`
        );
    });
});

test('auth and legal pages are wired to language context translation keys', () => {
    const loginSource = readSource('pages', 'Login.tsx');
    const signupSource = readSource('pages', 'Signup.tsx');
    const forgotSource = readSource('pages', 'ForgotPassword.tsx');
    const resetSource = readSource('pages', 'ResetPassword.tsx');
    const termsSource = readSource('pages', 'Terms.tsx');
    const privacySource = readSource('pages', 'Privacy.tsx');

    [loginSource, signupSource, forgotSource, resetSource, termsSource, privacySource].forEach((source) => {
        assert.match(source, /useLanguage/);
        assert.match(source, /t\('/);
    });
});

test('quiz, insights and study lobby pages use i18n keys for user-facing headings', () => {
    const quizSource = readSource('pages', 'QuizPractice.tsx');
    const insightsSource = readSource('pages', 'Insights.tsx');
    const lobbySource = readSource('pages', 'StudyLobby.tsx');

    assert.match(quizSource, /t\('quiz\.title'\)/);
    assert.match(insightsSource, /t\('insights\.title'\)/);
    assert.match(lobbySource, /t\('studyLobby\.title'\)/);
});

test('new auth, legal and learning i18n keys exist in en/mr/hi dictionaries', () => {
    const i18nSource = readSource('contexts', 'i18n.ts');
    const mustExistInAllLanguages = [
        'login.welcomeBack',
        'signup.title',
        'forgot.title',
        'reset.title',
        'terms.title',
        'privacy.title',
        'studyLobby.title',
        'quiz.title',
        'insights.title',
    ];

    mustExistInAllLanguages.forEach((key) => {
        const matches = i18nSource.match(new RegExp(`'${key.replace('.', '\\.')}'\\s*:`, 'g')) || [];
        assert.equal(
            matches.length >= 3,
            true,
            `Expected key "${key}" to be present in en/mr/hi dictionaries`
        );
    });
});

test('remaining calculator and game pages are wired to language context', () => {
    const i18nPages = [
        'ATKTCalculator.tsx',
        'CourseCommunity.tsx',
        'CurriculumExplorer.tsx',
        'GPACalculator.tsx',
        'InterviewQuiz.tsx',
        'KTCalculator.tsx',
        'PersonalizationQuiz.tsx',
        'ResourceLibrary.tsx',
        'SpeedMathGame.tsx',
        'SudokuGame.tsx',
        'ZipGame.tsx',
    ];

    i18nPages.forEach((pageName) => {
        const source = readSource('pages', pageName);
        assert.match(source, /useLanguage/);
        assert.match(source, /t\('/);
    });
});
