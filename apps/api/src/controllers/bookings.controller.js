const asyncHandler = require('../middleware/asyncHandler');
const prisma = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const bookingService = require('../services/booking.service');

// POST /api/bookings/hold
const holdBooking = asyncHandler(async (req, res) => {
  const { roomTypeId, roomId, checkIn, checkOut, totalGuests, guest, addOns } = req.body;
  const booking = await bookingService.createHold({
    roomTypeId,
    roomId,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    totalGuests,
    guest,
    addOns,
  });
  res.status(201).json({ booking, holdDurationMinutes: Number(process.env.HOLD_DURATION_MINUTES || 15) });
});

// POST /api/bookings/:id/confirm
const confirmBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.confirmBooking(req.params.id, req.body);
  res.json({ booking });
});

// POST /api/bookings/:id/cancel
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.body);
  res.json({ booking });
});

// PATCH /api/bookings/:id
const modifyBooking = asyncHandler(async (req, res) => {
  const booking = await bookingService.modifyBooking(req.params.id, req.body);
  res.json({ booking });
});

// GET /api/bookings/:id
const getBooking = asyncHandler(async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { roomType: true, room: true } }, addOns: { include: { addOn: true } }, guest: true, payments: true },
  });
  if (!booking) throw new ApiError(404, 'Booking not found');
  res.json({ booking });
});

// GET /api/bookings  (admin — list/search/filter)
const listBookings = asyncHandler(async (req, res) => {
  const { status, from, to, q, page = 1, pageSize = 20 } = req.query;

  const where = {
    ...(status ? { status } : {}),
    ...(from || to
      ? {
          items: {
            some: {
              ...(from ? { checkOut: { gt: new Date(from) } } : {}),
              ...(to ? { checkIn: { lt: new Date(to) } } : {}),
            },
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { reference: { contains: q, mode: 'insensitive' } },
            { guest: { email: { contains: q, mode: 'insensitive' } } },
            { guest: { lastName: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: { guest: true, items: { include: { roomType: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    }),
  ]);

  res.json({ total, page: Number(page), pageSize: Number(pageSize), bookings });
});

module.exports = { holdBooking, confirmBooking, cancelBooking, modifyBooking, getBooking, listBookings };
