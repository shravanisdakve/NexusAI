const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

const logFile = 'api_health_result.txt';
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

async function checkHealth() {
    fs.writeFileSync(logFile, 'Starting Health Check...\n');

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        log("❌ FATAL: GEMINI_API_KEY is missing from .env");
        return;
    }
    log(`ℹ️  API Key loaded: ${key.substring(0, 4)}...${key.substring(key.length - 4)} (Length: ${key.length})`);

    const genAI = new GoogleGenerativeAI(key);

    const modelsToTest = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-pro",
        "gemini-1.0-pro",
        "gemini-2.0-flash-exp"
    ];

    for (const modelName of modelsToTest) {
        log(`\n--- Testing ${modelName} (generateContent) ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, reply with 'OK'");
            const responseText = result.response.text();
            log(`✅ SUCCESS: ${modelName} replied: "${responseText.trim()}"`);

            // If successful, try streaming immediately to see if that's the delta
            try {
                log(`    ... Testing streaming for ${modelName}`);
                const chat = model.startChat();
                const streamResult = await chat.sendMessageStream("Hello");
                let streamText = '';
                for await (const chunk of streamResult.stream) {
                    streamText += chunk.text();
                }
                log(`    ✅ STREAMING SUCCESS: "${streamText.substring(0, 10)}..."`);
            } catch (streamErr) {
                log(`    ❌ STREAMING FAILED: ${streamErr.message.split('\n')[0]}`);
            }

        } catch (error) {
            log(`❌ FAILED: ${error.message.split('\n')[0]}`);
        }
    }
}

checkHealth();
