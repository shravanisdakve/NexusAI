const fs = require('fs');
require('dotenv').config();

const logFile = 'rest_api_result.txt';
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

async function checkRestApi() {
    fs.writeFileSync(logFile, 'Starting REST API Check...\n');

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        log("❌ FATAL: GEMINI_API_KEY is missing from .env");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    log(`Fetching models from: ${url.replace(key, 'HIDDEN_KEY')}`);

    try {
        const response = await fetch(url);
        const status = response.status;
        const text = await response.text();

        log(`HTTP Status: ${status}`);

        if (status === 200) {
            log("✅ API Request Successful!");
            const data = JSON.parse(text);
            if (data.models && data.models.length > 0) {
                log(`Found ${data.models.length} models:`);
                data.models.forEach(m => log(` - ${m.name} (${m.displayName})`));
            } else {
                log("⚠️  No models returned in the list (but request succeeded).");
            }
        } else {
            log("❌ API Request Failed!");
            log("Response Body: " + text);
        }

    } catch (error) {
        log(`❌ Network Error: ${error.message}`);
    }
}

checkRestApi();
