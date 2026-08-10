const router = require('express').Router();
const { getSummary } = require('../controllers/dashboard.controller');
const { requireAdmin } = require('../middleware/auth');

router.get('/summary', requireAdmin, getSummary);

module.exports = router;
