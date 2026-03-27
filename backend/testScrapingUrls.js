const fetch = require('node-fetch'); // node fetch if globally available, or native fetch
async function run() {
    try {
        const res = await fetch('https://mu.ac.in/');
        if (!res.ok) throw new Error("HTTP " + res.status);
        const text = await res.text();
        const urls = new Set([...text.matchAll(/href="([^"]+)"/g)].map(m => m[1]).filter(u => u.includes('circular') || u.includes('exam')));
        console.log("Found urls:", Array.from(urls));
    } catch (e) {
        console.error(e);
    }
}
run();
