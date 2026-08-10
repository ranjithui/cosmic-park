const asyncHandler = require('../middleware/asyncHandler');
const prisma = require('../config/db');

// GET /api/admin/dashboard/summary
const getSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [heldCount, confirmedCount, upcomingArrivals, totalGuests, revenueThisMonth] = await Promise.all([
    prisma.booking.count({ where: { status: 'HELD', holdExpiresAt: { gt: now } } }),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.bookingItem.count({
      where: {
        checkIn: { gte: now, lte: in7days },
        booking: { status: 'CONFIRMED' },
      },
    }),
    prisma.guest.count(),
    prisma.booking.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      },
    }),
  ]);

  res.json({
    activeHolds: heldCount,
    confirmedBookings: confirmedCount,
    upcomingArrivals7d: upcomingArrivals,
    totalGuests,
    revenueThisMonth: revenueThisMonth._sum.totalAmount || 0,
  });
});

module.exports = { getSummary };
