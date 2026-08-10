const asyncHandler = require('../middleware/asyncHandler');
const { searchAvailability } = require('../services/availability.service');

// GET /api/availability?checkIn=2026-12-20&checkOut=2026-12-23&guests=10
const checkAvailability = asyncHandler(async (req, res) => {
  const { checkIn, checkOut, guests } = req.query;
  const results = await searchAvailability({
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    guests,
  });
  res.json({ checkIn, checkOut, results });
});

module.exports = { checkAvailability };
