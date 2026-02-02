const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testModel() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    console.log("Testing gemini-1.5-flash...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say hello");
        console.log("✅ SUCCESS! Response:", result.response.text());
    } catch (error) {
        console.log("❌ FAILED:", error.message);
    }
}

testModel();
