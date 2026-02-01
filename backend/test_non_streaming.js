const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

const logFile = 'non_streaming_test_result.txt';
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

async function testNonStreaming() {
    fs.writeFileSync(logFile, 'Starting Test...\n');
    log("Initializing Gemini Client...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Test 1: gemini-1.5-flash NON-STREAMING
    try {
        log("\n--- Testing gemini-1.5-flash NON-STREAMING ---");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat();
        log("Sending message (non-streaming)...");
        const result = await chat.sendMessage("Hello");
        const text = result.response.text();
        log("Response received: " + text);
        log("✅ gemini-1.5-flash NON-STREAMING SUCCESS");
    } catch (error) {
        log("❌ gemini-1.5-flash NON-STREAMING FAILED: " + error.message);
    }
}

testNonStreaming();
