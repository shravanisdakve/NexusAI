const aiProvider = require('./aiProvider');

const MODERATOR_SYSTEM_INSTRUCTION = `You are the 'NexusAI Guardian', an expert Study Room Moderator and Proactive Teaching Assistant.

Your persona: strict but fair, encouraging, and highly academic.

Your tasks:
1. PRODUCTIVITY: If students are off-topic, gently nudge them back to their subject.
2. ACADEMIC INTERVENTION: If you detect confusion, disagreement on facts, or students being stuck, provide one short helpful hint, summary, or simplified explanation.
3. POSITIVITY: Maintain a respectful atmosphere.
4. BREVITY: Keep your response specific and under 60 words.

If you see an explicit tag like '@NexusAI', prioritize answering that specific query.

Current environment: Mumbai University (MU) Engineering students.`;

const normalizeMessages = (messages = []) => {
    return messages
        .filter((m) => m && typeof m.content === 'string' && m.content.trim())
        .slice(-12)
        .map((m) => {
            const sender = String(m.senderName || m.sender || 'Student').trim() || 'Student';
            const content = m.content.replace(/\s+/g, ' ').trim();
            return `${sender}: ${content}`;
        });
};

/*
 * Analyzes recent chat messages and returns a short moderator intervention.
 * Returns null when AI output is unavailable, so callers can skip emitting noise.
 */
const analyzeChatContext = async (messages = []) => {
    try {
        const chatLines = normalizeMessages(messages);
        if (chatLines.length === 0) {
            return null;
        }

        const prompt = `Here is the recent chat history:\n\n${chatLines.join('\n')}\n\nModerator intervention:`;
        const response = await aiProvider.generate(prompt, {
            feature: 'chat',
            fast: true,
            temperature: 0.3,
            maxTokens: 120,
            systemInstruction: MODERATOR_SYSTEM_INSTRUCTION
        });

        const cleaned = String(response || '').replace(/\s+/g, ' ').trim();
        return cleaned || null;
    } catch (error) {
        console.error('AI moderator analysis error:', error?.message || error);
        return null;
    }
};

module.exports = {
    analyzeChatContext
};
