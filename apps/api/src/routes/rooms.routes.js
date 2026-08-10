const router = require('express').Router();
const ctrl = require('../controllers/rooms.controller');
const { requireAdmin } = require('../middleware/auth');

// --- Public ---
router.get('/', ctrl.listRoomTypes);
router.get('/:id', ctrl.getRoomType);

// --- Admin ---
router.post('/', requireAdmin, ctrl.createRoomType);
router.patch('/:id', requireAdmin, ctrl.updateRoomType);
router.post('/:id/rooms', requireAdmin, ctrl.addRoom);

module.exports = router;
