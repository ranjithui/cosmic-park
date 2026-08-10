const app = require('./app');
const { startHoldCleanupJob } = require('./utils/holdCleanup');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Cosmic Park booking API listening on http://localhost:${PORT}`);
  console.log(`Admin dashboard:  http://localhost:${PORT}/admin`);
  startHoldCleanupJob();
});
