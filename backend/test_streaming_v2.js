const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

const logFile = 'streaming_test_result.txt';
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

async function testStreaming() {
    fs.writeFileSync(logFile, 'Starting Test...\n');
    log("Initializing Gemini Client...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Test 1: gemini-1.5-flash STREAMING
    try {
        log("\n--- Testing gemini-1.5-flash STREAMING ---");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat();
        log("Sending message stream...");
        const result = await chat.sendMessageStream("Hello");

        let text = '';
        for await (const chunk of result.stream) {
            text += chunk.text();
        }
        log("Response received: " + text);
        log("✅ gemini-1.5-flash STREAMING SUCCESS");
    } catch (error) {
        log("❌ gemini-1.5-flash STREAMING FAILED: " + error.message);
    }

    // Test 2: gemini-pro STREAMING
    try {
        log("\n--- Testing gemini-pro STREAMING ---");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const chat = model.startChat();
        log("Sending message stream...");
        const result = await chat.sendMessageStream("Hello");

        let text = '';
        for await (const chunk of result.stream) {
            text += chunk.text();
        }
        log("Response received: " + text);
        log("✅ gemini-pro STREAMING SUCCESS");
    } catch (error) {
        log("❌ gemini-pro STREAMING FAILED: " + error.message);
    }
}

testStreaming();
