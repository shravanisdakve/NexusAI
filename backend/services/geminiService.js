const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, { apiVersion: 'v1beta' });

const getModel = (modelName = 'gemini-1.5-flash', systemInstruction = null) => {
    const config = { model: modelName };
    if (systemInstruction) {
        config.systemInstruction = systemInstruction;
    }
    return genAI.getGenerativeModel(config);
};

/*
 * Analyzes a list of chat messages and provides a moderator summary/intervention.
 */
const analyzeChatContext = async (messages) => {
    try {
        const model = getModel('gemini-1.5-flash', `You are the 'NexusAI Guardian', an expert Study Room Moderator and Proactive Teaching Assistant.
        
        Your persona: Strict but fair, encouraging, and highly academic.
        
        Your tasks:
        1. PRODUCTIVITY: If students are off-topic, gently nudge them back to their subjects.
        2. ACADEMIC INTERVENTION: If you detect confusion, disagreement on facts, or students being 'stuck', provide a helpful hint, a short summary of the concept, or a simplified explanation.
        3. POSITIVITY: Maintain a respectful atmosphere.
        4. BREVITY: Keep your response specific and very short (under 60 words).
        
        If you see an explicit tag like '@NexusAI', prioritize answering that specific query.
        
        Current environment: Mumbai University (MU) Engineering students.`);

        const chatHistory = messages.map(m => `${m.senderName}: ${m.content}`).join('\n');
        const prompt = `Here is the recent chat history:\n\n${chatHistory}\n\nModerator intervention:`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        return "I'm having trouble analyzing the chat right now, but keep up the good work!";
    }
};

module.exports = {
    genAI,
    getModel,
    analyzeChatContext
};
