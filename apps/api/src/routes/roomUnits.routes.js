const router = require('express').Router();
const ctrl = require('../controllers/rooms.controller');
const { requireAdmin } = require('../middleware/auth');

// POST /api/rooms/:id/block  — owner block-out / maintenance dates for one physical room
router.post('/:id/block', requireAdmin, ctrl.blockRoomDates);

module.exports = router;
