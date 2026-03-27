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
        if (data.length === 0) return { topics: [], message: "Insufficient paper data for this subject." };

        // Group by module and analyze frequency
        const moduleStats = {};
        data.forEach(q => {
            if (!moduleStats[q.module]) {
                moduleStats[q.module] = { module: q.module, count: 0, weight: 0, concepts: [] };
            }
            moduleStats[q.module].count++;
            moduleStats[q.module].weight += q.marks;
        });

        // Use AI to synthesize trends
        const prompt = `Based on the following frequency and distribution of questions from past papers, predict the "Most Likely Topics" for the upcoming MU exam.
        Subject: ${subject}
        Past Data Summary: ${JSON.stringify(moduleStats)}
        
        Provide a list of "Must Study" topics for EACH of the 6 modules.
        Rank them by "Likely Marks" based on past distribution.
        Mention "Predictive Trend": e.g., "Recently the focus has shifted to numericals from Module 4".
        
        Return ONLY valid JSON.
        Format: { "predictions": [{ "module": number, "highYieldTopics": [string], "estimatedMarks": number, "trend": string }] }
        `;

        const suggestion = await aiProvider.generate(prompt, { feature: 'suggestions', json: true });
        return JSON.parse(suggestion.replace(/```json|```/g, '').trim());
    } catch (error) {
        console.error("[MUAnalysis] Prediction failed:", error);
        throw error;
    }
}

module.exports = {
    ingestPaper,
    predictTopics
};
