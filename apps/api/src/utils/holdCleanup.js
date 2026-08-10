const cron = require('node-cron');
const { releaseExpiredHolds } = require('../services/booking.service');

/** Runs every minute; frees up rooms whose hold window has lapsed. */
function startHoldCleanupJob() {
  cron.schedule('* * * * *', async () => {
    try {
      const count = await releaseExpiredHolds();
      if (count > 0) console.log(`[hold-cleanup] released ${count} expired hold(s)`);
    } catch (err) {
      console.error('[hold-cleanup] failed:', err.message);
    }
  });
}

module.exports = { startHoldCleanupJob };
