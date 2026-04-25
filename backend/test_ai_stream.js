
const aiProvider = require('./services/aiProvider');

async function testOllamaStream() {
    console.log("Testing Ollama STREAMING via aiProvider...");
    try {
        const stream = aiProvider.stream("Tell me about thermodynamics in one sentence.", { feature: 'chat' });
        let fullText = '';
        for await (const chunk of stream) {
            process.stdout.write(chunk);
            fullText += chunk;
        }
        console.log("\n\nStream finished. Length:", fullText.length);
    } catch (err) {
        console.error("\nAI Provider Stream Error:", err.message);
    }
}

testOllamaStream();
