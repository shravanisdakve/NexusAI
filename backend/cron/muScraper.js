const cron = require('node-cron');
const { runUniversityScraper } = require('../services/scraperService');

const initScraperCron = (io) => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] Running MU Live Web Scraper...');
        try {
            const result = await runUniversityScraper();
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
        }
    });
    
    console.log('[CRON] MU Live Web Scraper initialized and scheduled (every hour)');
};

module.exports = initScraperCron;
