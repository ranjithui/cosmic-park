const router = require('express').Router();
const ctrl = require('../controllers/bookings.controller');
const { requireAdmin } = require('../middleware/auth');
const {
  validate,
  holdSchema,
  confirmSchema,
  cancelSchema,
  modifySchema,
} = require('../utils/validators');

// --- Guest-facing reservation lifecycle ---
// POST /api/bookings/hold          — Step 1: temporarily hold a room
router.post('/hold', validate(holdSchema), ctrl.holdBooking);

// POST /api/bookings/:id/confirm   — Step 2: confirm after payment/deposit
router.post('/:id/confirm', validate(confirmSchema), ctrl.confirmBooking);

// POST /api/bookings/:id/cancel    — cancel a HELD or CONFIRMED booking
router.post('/:id/cancel', validate(cancelSchema), ctrl.cancelBooking);

// PATCH /api/bookings/:id          — modify dates/room/guest count
router.patch('/:id', validate(modifySchema), ctrl.modifyBooking);

// GET /api/bookings/:id            — fetch a single booking (guest confirmation page)
router.get('/:id', ctrl.getBooking);

// --- Admin-only ---
// GET /api/bookings?status=&from=&to=&q=  — list/search/filter (admin dashboard)
router.get('/', requireAdmin, ctrl.listBookings);

module.exports = router;
