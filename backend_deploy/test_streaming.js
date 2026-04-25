const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testStreaming() {
    console.log("Initializing Gemini Client...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Test 1: gemini-1.5-flash STREAMING
    try {
        console.log("\n--- Testing gemini-1.5-flash STREAMING ---");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat();
        console.log("Sending message stream...");
        const result = await chat.sendMessageStream("Hello, tell me a joke.");

        process.stdout.write("Response: ");
        for await (const chunk of result.stream) {
            process.stdout.write(chunk.text());
        }
        console.log("\n✅ gemini-1.5-flash STREAMING SUCCESS");
    } catch (error) {
        console.error("\n❌ gemini-1.5-flash STREAMING FAILED:", error.message);
    }

    // Test 2: gemini-pro STREAMING
    try {
        console.log("\n--- Testing gemini-pro STREAMING ---");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const chat = model.startChat();
        console.log("Sending message stream...");
        const result = await chat.sendMessageStream("Hello, tell me a joke.");

        process.stdout.write("Response: ");
        for await (const chunk of result.stream) {
            process.stdout.write(chunk.text());
        }
        console.log("\n✅ gemini-pro STREAMING SUCCESS");
    } catch (error) {
        console.error("\n❌ gemini-pro STREAMING FAILED:", error.message);
    }
}

testStreaming();
