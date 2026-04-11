const aiProvider = require('./aiProvider');
const MUPastQuestion = require('../models/MUPastQuestion');

const MU_EXTRACTION_PROMPT = `
You are an expert MU (Mumbai University) Engineering Professor.
I am providing text extracted from a past university question paper.
Your goal is to parse this paper and return a structured list of individual questions.

Rules:
1. Identify the subject, branch, and semester.
2. For each question, extract:
   - Level (Q1, Q2a, Q3b, etc.)
   - Marks (as printed)
   - Actual text of the question.
   - Categorize each question into one of the 6 modules (1 to 6) based on standard MU syllabus for that subject.
   - Tag question type: [numerical, theory, derivation, diagram, CASE STUDY, design, logic].
   - If marks are (10) or (20) and it's a multi-part question, try to break it down.

RESPONSE FORMAT: JSON ONLY
Return a JSON array like:
[
  {
    "questionText": "Explain the working of LVDT with a neat diagram.",
    "marks": 10,
    "module": 3,
    "tags": ["theory", "diagram"],
    "difficulty": "Easy",
    "level": "Q2a"
  }
]
`;

async function ingestPaper(text, metadata) {
    try {
        const prompt = `Analyze this MU paper text and extract questions:\n\n${text}\n\nMetadata: Subject: ${metadata.subject}, Branch: ${metadata.branch}, Year: ${metadata.paperYear}, Semester: ${metadata.semester}, Type: ${metadata.paperType}`;
        
        const result = await aiProvider.generate(prompt, { 
            feature: 'quiz', // Uses Groq JSON mode
            systemInstruction: MU_EXTRACTION_PROMPT,
            json: true 
        });

        const questions = JSON.parse(result.replace(/```json|```/g, '').trim());

        const savedQuestions = [];
        for (const q of questions) {
            const saved = await MUPastQuestion.create({
                ...q,
                subject: metadata.subject,
                branch: metadata.branch,
                semester: metadata.semester,
                paperYear: metadata.paperYear,
                paperType: metadata.paperType,
                year: metadata.year, // FE, SE, etc.
                ingestedBy: metadata.userId
            });
            savedQuestions.push(saved);
        }

        return { success: true, count: savedQuestions.length, questions: savedQuestions };
    } catch (error) {
        console.error("[MUAnalysis] Ingestion failed:", error);
        throw error;
    }
}

/**
 * Predict exam-likely topics based on frequency of ingested questions
 */
async function predictTopics(subject) {
    try {
        const data = await MUPastQuestion.find({ subject: subject }).lean();
        
        let prompt;
        if (data.length > 0) {
            // Data-Driven Mode: Use frequency and distribution from DB
            const moduleStats = {};
            data.forEach(q => {
                if (!moduleStats[q.module]) {
                    moduleStats[q.module] = { module: q.module, count: 0, weight: 0, concepts: [] };
                }
                moduleStats[q.module].count++;
                moduleStats[q.module].weight += q.marks;
            });

            prompt = `Based on the following frequency and distribution of questions from past papers, predict the "Most Likely Topics" for the upcoming MU exam.
            Subject: ${subject}
            Past Data Summary: ${JSON.stringify(moduleStats)}
            
            Provide a list of "Must Study" topics for EACH of the 6 modules.
            Rank them by "Likely Marks" based on past distribution.
            Mention "Predictive Trend": e.g., "Recently the focus has shifted to numericals from Module 4".
            
            Return ONLY valid JSON.
            Format: { "predictions": [{ "module": number, "highYieldTopics": [string], "estimatedMarks": number, "trend": string }] }
            `;
        } else {
            // AI Fallback Mode: Generate based on general MU syllabus knowledge
            prompt = `
            You are an expert MU (Mumbai University) Engineering Professor.
            I do not have specific past paper data in my database for the subject: ${subject}.
            
            Using your internal knowledge of the Standard MU Engineering Syllabus (Rev-2019/2024 C-Scheme), predict the "Most Likely Topics" for the upcoming exam for ${subject}.
            
            Instructions:
            1. Generate high-yield topics for EACH of the 6 standard modules.
            2. Estimate marks distribution (out of 80 total).
            3. Provide an insightful trend for each module based on typical MU questioning patterns (Theory vs Numerical etc).
            
            Return ONLY valid JSON.
            Format: { "predictions": [{ "module": number, "highYieldTopics": [string], "estimatedMarks": number, "trend": string }] }
            `;
        }

        const suggestion = await aiProvider.generate(prompt, { feature: 'suggestions', json: true });
        // Clean and parse
        let cleaned = suggestion.replace(/```json|```/g, '').trim();
        // Sometimes LLMs wrap in an extra object or markdown
        if (cleaned.startsWith('```')) cleaned = cleaned.split('\n').slice(1, -1).join('\n');
        
        return JSON.parse(cleaned);
    } catch (error) {
        console.error("[MUAnalysis] Prediction failed:", error);
        throw error;
    }
}

/**
 * Get likely questions with AI Fallback
 */
async function getLikelyQuestions(subject, module) {
    try {
        const query = { subject };
        if (module) query.module = Number(module);
        
        let questions = await MUPastQuestion.find(query).sort({ frequency: -1, marks: -1 }).limit(10).lean();

        if (questions.length === 0) {
            // AI Fallback for Questions
            const prompt = `
            You are an expert MU Engineering Professor. Give me 5-7 high-frequency questions for the MU exam on the subject: ${subject}${module ? `, specifically for Module ${module}` : ''}.
            Focus on standard markings (5, 10, or 20 marks).
            
            Return ONLY valid JSON.
            Format: { "questions": [{ "questionText": string, "marks": number, "frequency": number, "module": number }] }
            `;

            const result = await aiProvider.generate(prompt, { feature: 'quiz', json: true });
            const data = JSON.parse(result.replace(/```json|```/g, '').trim());
            return data.questions.map(q => ({ ...q, _id: `ai-${Date.now()}-${Math.random()}` }));
        }

        return questions;
    } catch (error) {
        console.error("[MUAnalysis] Likely questions fallback failed:", error);
        return [];
    }
}

module.exports = {
    ingestPaper,
    predictTopics,
    getLikelyQuestions
};
