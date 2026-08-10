const asyncHandler = require('../middleware/asyncHandler');
const prisma = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// GET /api/admin/guests?q=search
const listGuests = asyncHandler(async (req, res) => {
  const { q, page = 1, pageSize = 20 } = req.query;
  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ],
      }
    : undefined;

  const [total, guests] = await Promise.all([
    prisma.guest.count({ where }),
    prisma.guest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
    }),
  ]);
  res.json({ total, guests });
});

// GET /api/admin/guests/:id  — includes their booking history
const getGuest = asyncHandler(async (req, res) => {
  const guest = await prisma.guest.findUnique({
    where: { id: req.params.id },
    include: { bookings: { include: { items: true }, orderBy: { createdAt: 'desc' } } },
  });
  if (!guest) throw new ApiError(404, 'Guest not found');
  res.json({ guest });
});

module.exports = { listGuests, getGuest };
