const router = require('express').Router();
const ctrl = require('../controllers/guests.controller');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

router.get('/', ctrl.listGuests);
router.get('/:id', ctrl.getGuest);

module.exports = router;
