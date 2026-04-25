const cron = require('node-cron');
const { runUniversityScraper } = require('../services/scraperService');

// P1 FIX: Prevent concurrent scraper runs if MU portal is slow to respond
let scraperRunning = false;
let lastSuccessfulRun = null;

const initScraperCron = (io) => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        if (scraperRunning) {
            console.log('[CRON] Scraper already running — skipping this tick.');
            return;
        }
        scraperRunning = true;
        console.log('[CRON] Running MU Live Web Scraper...');
        try {
            const result = await runUniversityScraper();
            lastSuccessfulRun = new Date();

            if (result.upsertedCount > 0) {
                console.log(`[CRON] MU Scraper found ${result.upsertedCount} new circular(s).`);
                
                // Notify active users over sockets (if io is provided)
                if (io && result.newCirculars.length > 0) {
                    const latest = result.newCirculars[0];
                    io.emit('mu-notification', {
                        title: 'New MU Update',
                        message: latest.title,
                        link: latest.link,
                        urgent: latest.urgent
                    });
                }
            } else {
                console.log('[CRON] MU Scraper finished. No new circulars.');
            }
        } catch (err) {
            console.error('[CRON] MU Scraper error:', err);
        } finally {
            scraperRunning = false;
        }
    });
    
    console.log('[CRON] MU Live Web Scraper initialized and scheduled (every hour)');
};

// Expose scraper health data for /api/health
const getScraperHealth = () => ({
    running: scraperRunning,
    lastSuccessfulRun
});

module.exports = initScraperCron;
module.exports.getScraperHealth = getScraperHealth;

