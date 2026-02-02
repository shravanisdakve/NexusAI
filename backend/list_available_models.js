const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        // There is no listModels in the standard GoogleGenerativeAI class in the same way.
        // However, we can try to find it or use the REST API.
        // For now, let's try a common list of models and see what works.
        const modelsToTest = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-1.0-pro",
            "gemini-pro",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro-latest",
            "gemini-2.0-flash-exp"
        ];

        for (const m of modelsToTest) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("test");
                if (result.response) {
                    console.log(`✅ ${m} is working!`);
                }
            } catch (err) {
                console.log(`❌ ${m} failed: ${err.message.substring(0, 100)}`);
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
