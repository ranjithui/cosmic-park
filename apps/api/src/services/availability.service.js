const prisma = require('../config/db');

/**
 * Date-range overlap convention used throughout this service:
 * a stay [checkIn, checkOut) overlaps another [otherIn, otherOut)
 * iff checkIn < otherOut AND checkOut > otherIn. checkOut is
 * exclusive, so a checkout on day X and a new check-in on day X
 * do NOT count as a conflict (same-day turnover is allowed).
 */

/**
 * Returns true if `roomId` is free for [checkIn, checkOut).
 * A room is UNavailable if either:
 *  - it has a CONFIRMED booking item overlapping the range, or
 *  - it has a HELD booking item overlapping the range whose hold
 *    has not yet expired, or
 *  - it has an owner/maintenance AvailabilityBlock overlapping it.
 *
 * `excludeBookingId` lets the modify-reservation flow check
 * availability while ignoring the booking being modified.
 */
async function isRoomAvailable(roomId, checkIn, checkOut, excludeBookingId = null) {
  const now = new Date();

  const conflictingItem = await prisma.bookingItem.findFirst({
    where: {
      roomId,
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
      ...(excludeBookingId ? { bookingId: { not: excludeBookingId } } : {}),
      booking: {
        OR: [
          { status: 'CONFIRMED' },
          { status: 'HELD', holdExpiresAt: { gt: now } },
        ],
      },
    },
  });
  if (conflictingItem) return false;

  const block = await prisma.availabilityBlock.findFirst({
    where: {
      roomId,
      startDate: { lt: checkOut },
      endDate: { gt: checkIn },
    },
  });
  if (block) return false;

  return true;
}

/**
 * For a given RoomType, returns the list of Room ids that are
 * available for the requested date range. Used by the public
 * "check availability" endpoint and by hold creation.
 */
async function findAvailableRooms(roomTypeId, checkIn, checkOut) {
  const rooms = await prisma.room.findMany({
    where: { roomTypeId, isActive: true },
  });

  const availability = await Promise.all(
    rooms.map(async (room) => ({
      room,
      available: await isRoomAvailable(room.id, checkIn, checkOut),
    }))
  );

  return availability.filter((r) => r.available).map((r) => r.room);
}

/**
 * Availability search across all active room types — the payload
 * for GET /api/availability. Returns each room type with whether
 * it has at least one free room and, if so, a price quote.
 */
async function searchAvailability({ checkIn, checkOut, guests }) {
  const { quoteStay } = require('./pricing.service');

  const roomTypes = await prisma.roomType.findMany({
    where: {
      isActive: true,
      ...(guests ? { maxOccupancy: { gte: Number(guests) } } : {}),
    },
    include: { media: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 1 } },
  });

  const results = [];
  for (const roomType of roomTypes) {
    const availableRooms = await findAvailableRooms(roomType.id, checkIn, checkOut);
    if (availableRooms.length === 0) continue;

    const quote = await quoteStay(roomType.id, checkIn, checkOut);
    results.push({
      roomType: {
        id: roomType.id,
        name: roomType.name,
        slug: roomType.slug,
        maxOccupancy: roomType.maxOccupancy,
        bedrooms: roomType.bedrooms,
        bathrooms: roomType.bathrooms,
        coverImage: roomType.media[0]?.url || null,
      },
      availableRoomCount: availableRooms.length,
      availableRoomIds: availableRooms.map((r) => r.id),
      pricing: {
        nights: quote.nightCount,
        subtotal: quote.subtotal,
        currency: process.env.DEFAULT_CURRENCY || 'INR',
        breakdown: quote.nights,
      },
    });
  }

  return results;
}

module.exports = { isRoomAvailable, findAvailableRooms, searchAvailability };
