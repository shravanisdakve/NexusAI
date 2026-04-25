
const aiProvider = require('./services/aiProvider');

async function testOllama() {
    console.log("Testing Ollama via aiProvider...");
    try {
        const response = await aiProvider.generate("Hello, who are you?", { feature: 'chat' });
        console.log("Response:", response);
    } catch (err) {
        console.error("AI Provider Error:", err.message);
    }
}

testOllama();
