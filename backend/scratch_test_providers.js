const { generate, PROVIDERS } = require('./services/aiProvider');
require('dotenv').config();

async function test() {
    console.log("Testing AI Providers...");
    
    const prompt = "Generate a simple JSON object with a 'status' field equal to 'ok'. RETURN ONLY JSON.";
    const options = { json: true, feature: 'quiz' };

    try {
        console.log("\n--- Testing default (fallback chain) ---");
        const result = await generate(prompt, options);
        console.log("Result:", result);
        console.log("Is valid JSON?", isValidJson(result));
    } catch (e) {
        console.error("Default chain failed:", e.message);
    }
}

function isValidJson(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

test();
