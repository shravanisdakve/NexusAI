
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testOllama() {
    console.log("Testing connection to http://127.0.0.1:11434/api/tags...");
    try {
        const response = await fetch('http://127.0.0.1:11434/api/tags', { method: 'GET', timeout: 5000 });
        if (response.ok) {
            const data = await response.json();
            console.log("Success! Models found:", data.models?.map(m => m.name));
        } else {
            console.log("Failed with status:", response.status);
        }
    } catch (err) {
        console.error("Connection Error:", err.message);
    }
}

testOllama();
