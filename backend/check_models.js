const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Testing gemini-1.5-flash...");
        const result = await model.generateContent("Hello");
        console.log("Success! Response:", result.response.text());
    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.message);
    }

    try {
        console.log("\nListing all available models...");
        // Note: listModels is not directly exposed on the client in the same way in all SDK versions, 
        // but we can try to infer or just test a few common ones.
        // Actually, for the Node SDK, listModels isn't a helper on the main class in simplified usage.
        // We will test a few specific ones.

        const candidates = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash-latest",
            "gemini-1.0-pro",
            "gemini-pro"
        ];

        for (const modelName of candidates) {
            console.log(`\nTesting ${modelName}...`);
            try {
                const m = genAI.getGenerativeModel({ model: modelName });
                const r = await m.generateContent("Test");
                console.log(`✅ ${modelName} IS AVAILABLE.`);
            } catch (e) {
                console.log(`❌ ${modelName} failed: ${e.message.split('\n')[0]}`);
            }
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
