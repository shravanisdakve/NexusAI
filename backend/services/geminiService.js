const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = (modelName = 'gemini-2.0-flash', systemInstruction = null) => {
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
        const model = getModel('gemini-2.0-flash', `You are an expert Study Room Moderator. 
        Your goal is to ensure the study session remains productive, focused, and positive.
        
        Analyze the provided chat history.
        - If the students are discussing academic topics well, give a brief encouraging remark or a "summary so far".
        - If they are distracted, gently nudge them back to the topic.
        - If there is confusion, try to clarify the main point of confusion.
        
        Keep your response specific, helpful, and short (under 50 words).`);

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
