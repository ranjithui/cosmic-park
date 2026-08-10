const asyncHandler = require('../middleware/asyncHandler');
const prisma = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// GET /api/room-types  (public)
const listRoomTypes = asyncHandler(async (req, res) => {
  const roomTypes = await prisma.roomType.findMany({
    where: { isActive: true },
    include: {
      media: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      amenities: { include: { amenity: true } },
    },
  });
  res.json({ roomTypes });
});

// GET /api/room-types/:id  (public)
const getRoomType = asyncHandler(async (req, res) => {
  const roomType = await prisma.roomType.findUnique({
    where: { id: req.params.id },
    include: {
      media: { orderBy: { sortOrder: 'asc' } },
      amenities: { include: { amenity: true } },
      rooms: true,
      ratePlans: { orderBy: { startDate: 'asc' } },
    },
  });
  if (!roomType) throw new ApiError(404, 'Room type not found');
  res.json({ roomType });
});

// POST /api/admin/room-types  (admin)
const createRoomType = asyncHandler(async (req, res) => {
  const { name, slug, description, maxOccupancy, bedrooms, bathrooms, basePrice } = req.body;
  const roomType = await prisma.roomType.create({
    data: { name, slug, description, maxOccupancy, bedrooms, bathrooms, basePrice },
  });
  res.status(201).json({ roomType });
});

// PATCH /api/admin/room-types/:id  (admin)
const updateRoomType = asyncHandler(async (req, res) => {
  const roomType = await prisma.roomType.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ roomType });
});

// POST /api/admin/room-types/:id/rooms  (admin) — add a physical room unit
const addRoom = asyncHandler(async (req, res) => {
  const room = await prisma.room.create({
    data: { roomTypeId: req.params.id, code: req.body.code },
  });
  res.status(201).json({ room });
});

// POST /api/admin/rooms/:id/block  (admin) — block out dates (maintenance, owner use)
const blockRoomDates = asyncHandler(async (req, res) => {
  const { startDate, endDate, reason } = req.body;
  const block = await prisma.availabilityBlock.create({
    data: {
      roomId: req.params.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
    },
  });
  res.status(201).json({ block });
});

module.exports = {
  listRoomTypes,
  getRoomType,
  createRoomType,
  updateRoomType,
  addRoom,
  blockRoomDates,
};
