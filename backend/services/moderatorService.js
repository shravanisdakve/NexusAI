const Sentiment = require('sentiment');
const sentiment = new Sentiment();

// Tier 1: Reflex (Instant) - Zero tolerance keywords
const TIER1_KEYWORDS = [
    /\b(nazi|racist|slur1|slur2)\b/i,
    /\b(fuck|shit|asshole|bitch)\b/i,
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i // Spam links
];

// Tier 3 triggers: Academic confusion signals
const TIER3_TRIGGERS = [
    /@NexusAI/i,
    /\bstuck on\b/i,
    /\bdont understand\b/i,
    /\bcan someone explain\b/i,
    /\bmodule \d+\b/i,
    /\bproblem \d+\b/i,
    /\berror\b/i,
    /\bhow to solve\b/i
];

// Tier 2.5: Dispute Resolution logic
const DISPUTE_KEYWORDS = [
    /\b(stop lying|you're wrong|fake info|not true|don't agree)\b/i
];

/**
 * Tier 1 Check: Instant Keyword Match
 */
const checkTier1 = (text) => {
    for (const regex of TIER1_KEYWORDS) {
        if (regex.test(text)) {
            return {
                flagged: true,
                tier: 1,
                action: 'DELETE',
                message: '🚨 Warning: Your message was removed due to severe profanity or prohibited content.'
            };
        }
    }
    return null;
};

/**
 * Tier 2 Check: Sentiment Analysis (Vibe Check)
 */
const checkTier2 = (text) => {
    const analysis = sentiment.analyze(text);

    // Check for Disputes (Heated but potentially academic)
    const hasConflictWords = DISPUTE_KEYWORDS.some(regex => regex.test(text));
    if (analysis.score <= -3 && hasConflictWords) {
        return {
            flagged: true,
            tier: 2,
            action: 'DISPUTE_NUDGE',
            message: '⚖️ AI Moderator: Disagreement is part of learning, but let\'s keep it focused on the technical facts. Critique the code, not the person!'
        };
    }

    if (analysis.comparative <= -0.6) {
        return {
            flagged: true,
            tier: 2,
            action: 'WARN',
            message: '📢 Heads up: This conversation is getting a bit heated. Let\'s keep it respectful! ⚖️'
        };
    }
    return null;
};

/**
 * Tier 3 Check: Smart AI Intervention Trigger
 */
const checkTier3Trigger = (text) => {
    for (const regex of TIER3_TRIGGERS) {
        if (regex.test(text)) {
            return {
                flagged: false,
                tier: 3,
                action: 'INTERVENE',
                trigger: 'confusion'
            };
        }
    }
    return null;
};

/**
 * Main Moderation Logic
 */
const processModeration = async (content) => {
    const t1 = checkTier1(content);
    if (t1) return t1;

    const t2 = checkTier2(content);
    if (t2) return t2;

    const t3 = checkTier3Trigger(content);
    if (t3) return t3;

    return { flagged: false };
};

module.exports = {
    processModeration
};
