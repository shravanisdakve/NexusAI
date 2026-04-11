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
        const prompt = `Analyze this candidate data and generate a professional resume profile. 
If the candidate data contains raw extracted text (e.g. from a PDF), also extract and structure their technical skills, projects, and achievements.

Candidate Data:
Role: ${candidateData.targetRole}
Skills: ${candidateData.skills}
Projects: ${candidateData.projects}
Branch: ${candidateData.branch}

Output ONLY valid JSON:
{ 
  "summary": "3-sentence professional summary focus on outcomes", 
  "keywords": ["ATS", "Keywords", "15 total"],
  "extractedSkills": "Technical Skills (comma separated)",
  "extractedProjects": "Detailed Project List (newline separated)",
  "extractedAchievements": "Achievements (newline separated)",
  "name": "Full Name if found in notes"
}`;

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

/**
 * Generates a personalized academic quiz based on student weaknesses.
 */
const generatePersonalizedQuiz = async (config) => {
    try {
        const prompt = `Generate a personalized quiz for a Computer Engineering student.
        
        Context:
        - Weak topics: ${config.weakTopics || 'General Fundamentals'}
        - Target exam: ${config.targetExam || 'General MU Exams'}
        - Difficulty: ${config.difficulty || 'mixed'}
        - Question Count: ${config.questionCount || 10}
        
        Focus 70% on weak topics and 30% on adjacent core fundamentals.
        
        Output JSON in this exact shape:
        {
          "title": "string",
          "recommendedTimeMinutes": number,
          "questions": [
            {
              "id": "q1",
              "type": "mcq | short_answer | code",
              "topic": "string",
              "question": "string",
              "options": ["A", "B", "C", "D"] or null,
              "correctAnswer": "string",
              "marks": number,
              "explanation": "string"
            }
          ]
        }`;

        const response = await aiProvider.generate(prompt, {
            feature: 'quiz',
            json: true,
            systemInstruction: 'You are NexusAI, an academic mentor. Generate clean, exam-ready JSON quizzes for Mumbai University students.'
        });

        return typeof response === 'string' ? JSON.parse(response) : response;
    } catch (error) {
        console.error('AI Personalized Quiz error:', error);
        return null;
    }
};

/**
 * Generates a personalized "Serious Game" timed challenge.
 */
const generateTimedChallenge = async (config) => {
    try {
        const prompt = `Design a personalized timed challenge for a Computer Engineering student.
        
        Context:
        - Weak topics: ${config.weakTopics || 'General fundamentals'}
        - Accuracy: ${config.accuracyPercent || 60}%
        - Available time: ${config.timeAvailableMinutes || 5} minutes
        - Mode: ${config.mode || 'speed_drill'}
        
        Output JSON in this exact shape:
        {
          "mode": "speed_drill | streak_mode",
          "title": "string",
          "description": "string",
          "recommendedTimeMinutes": number,
          "rules": ["string"],
          "questions": [
            {
              "id": "c1",
              "type": "mcq | short_answer | code",
              "topic": "string",
              "question": "string",
              "options": ["A","B","C","D"] or null,
              "correctAnswer": "string",
              "timeLimitSeconds": number
            }
          ]
        }`;

        const response = await aiProvider.generate(prompt, {
            feature: 'quiz', // Reusing quiz logic for structured response
            json: true,
            systemInstruction: 'You are NexusAI, designing serious academic game modes. Avoid childish games; focus on speed, recall, and skill.'
        });

        return typeof response === 'string' ? JSON.parse(response) : response;
    } catch (error) {
        console.error('AI Timed Challenge error:', error);
        return null;
    }
};

/**
 * Generates a set of flashcards and error-fix exercises.
 */
const generateFlashcardChallenge = async (config) => {
    try {
        const prompt = `Generate a personalized flashcard + error-fix set based on student weaknesses.
        
        Context:
        - Weak topics: ${config.weakTopics || 'General Fundamentals'}
        - Target exam: ${config.targetExam || 'MU Semester Exams'}
        - Count: ${config.count || 8}
        
        Output JSON:
        {
          "title": "string",
          "flashcards": [
            { "id": "f1", "topic": "string", "front": "string", "back": "string" }
          ],
          "errorFixItems": [
            { "id": "e1", "topic": "string", "brokenStatementOrCode": "string", "task": "string", "solution": "string" }
          ]
        }`;

        const response = await aiProvider.generate(prompt, {
            feature: 'flashcards',
            json: true,
            systemInstruction: 'You are NexusAI, generating spaced-repetition flashcards and error-fix exercises for Computer Engineering students.'
        });

        return typeof response === 'string' ? JSON.parse(response) : response;
    } catch (error) {
        console.error('AI Flashcard Challenge error:', error);
        return null;
    }
};

module.exports = {
    analyzeChatContext,
    analyzeKnowledgeGaps,
    generateResumeAnalysis,
    generatePersonalizedQuiz,
    generateTimedChallenge,
    generateFlashcardChallenge
};
