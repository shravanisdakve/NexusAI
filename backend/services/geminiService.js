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

/*
 * Analyzes notes and recent chat messages to track the group's collective knowledge gaps.
 * Returns an array of string topics representing the gaps.
 */
const analyzeKnowledgeGaps = async (notes = '', chatLines = []) => {
    try {
        if (chatLines.length === 0) {
            return [];
        }

        const prompt = `Based on the following study notes and recent chat messages from a study group, identify up to 3 specific knowledge gaps, misconceptions, or concepts the group is struggling with collectively.
If there are no clear gaps, return an empty array [].
Otherwise, return a JSON array of short string topics describing the gaps (e.g. ["Thermodynamics concepts", "Newton's third law"]).

Notes (truncated):
${notes.substring(0, 500)}

Chat:
${chatLines.join('\n')}

Output ONLY a raw JSON array of strings without formatting or markdown.`;

        const response = await aiProvider.generate(prompt, {
            feature: 'knowledge-gaps',
            fast: true,
            temperature: 0.2,
            maxTokens: 150,
            systemInstruction: 'You are an academic analyzer. Output only a bare JSON array.'
        });

        const cleaned = String(response || '').replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('AI knowledge gap analysis error:', error?.message || error);
        return [];
    }
};

/**
 * Generates a professional resume summary and ATS keywords tailored to a role.
 */
const generateResumeAnalysis = async (candidateData) => {
    try {
        const prompt = `Analyze this candidate data and generate:
1. A 3-sentence professional summary.
2. A list of 15 high-impact ATS keywords.

Candidate Data:
Role: ${candidateData.targetRole}
Skills: ${candidateData.skills}
Projects: ${candidateData.projects}
Branch: ${candidateData.branch}

Output ONLY valid JSON:
{ "summary": "...", "keywords": ["...", "..."] }`;

        const response = await aiProvider.generate(prompt, {
            feature: 'projectIdeas', // Reusing a reasoning feature
            temperature: 0.7,
            json: true,
            systemInstruction: 'You are a professional Career Coach and ATS Specialist.'
        });

        const cleaned = String(response || '').replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (error) {
        console.error('AI Resume analysis error:', error);
        return null;
    }
};

module.exports = {
    analyzeChatContext,
    analyzeKnowledgeGaps,
    generateResumeAnalysis
};
