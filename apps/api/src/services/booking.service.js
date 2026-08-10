const prisma = require('../config/db');
const { v4: uuid } = require('uuid');
const { ApiError } = require('../middleware/errorHandler');
const { isRoomAvailable } = require('./availability.service');
const { quoteStay, computeAddOnTax } = require('./pricing.service');

const HOLD_MINUTES = Number(process.env.HOLD_DURATION_MINUTES || 15);

function generateReference() {
  const year = new Date().getFullYear();
  const suffix = uuid().split('-')[0].toUpperCase();
  return `CP-${year}-${suffix}`;
}

/**
 * Concurrency note: Prisma has no built-in SELECT ... FOR UPDATE.
 * To keep two simultaneous requests from both "winning" the same
 * room, we wrap the availability re-check + booking-item insert in
 * a single serializable transaction. Under Postgres this makes the
 * *second* transaction fail with a serialization error on conflict,
 * which we catch and turn into a 409. For high-traffic production
 * use, consider a Postgres advisory lock keyed on roomId instead —
 * cheaper than retrying failed serializable transactions.
 */
async function createHold({ roomTypeId, roomId, checkIn, checkOut, guest, totalGuests, addOns = [] }) {
  if (checkIn >= checkOut) {
    throw new ApiError(400, 'checkOut must be after checkIn');
  }

  return prisma.$transaction(
    async (tx) => {
      const available = await isRoomAvailableTx(tx, roomId, checkIn, checkOut);
      if (!available) {
        throw new ApiError(409, 'Room is no longer available for the selected dates');
      }

      const quote = await quoteStay(roomTypeId, checkIn, checkOut);

      let addOnAmount = 0;
      const addOnRows = [];
      for (const item of addOns) {
        const catalogItem = await tx.addOnCatalog.findUnique({ where: { id: item.addOnId } });
        if (!catalogItem || !catalogItem.isActive) {
          throw new ApiError(400, `Add-on ${item.addOnId} is not available`);
        }
        const { lineBeforeTax, tax, lineTotal } = computeAddOnTax(
          Number(catalogItem.price),
          item.quantity || 1,
          Number(catalogItem.taxRate)
        );
        addOnAmount += lineTotal;
        addOnRows.push({
          addOnId: catalogItem.id,
          quantity: item.quantity || 1,
          unitPrice: catalogItem.price,
          taxAmount: tax,
          lineTotal,
        });
      }

      // Upsert guest by email so repeat guests don't get duplicated
      const guestRecord = await tx.guest.upsert({
        where: { email: guest.email },
        update: {
          firstName: guest.firstName,
          lastName: guest.lastName,
          phone: guest.phone,
        },
        create: {
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
        },
      });

      const totalAmount = quote.subtotal + addOnAmount;
      const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

      const booking = await tx.booking.create({
        data: {
          reference: generateReference(),
          guestId: guestRecord.id,
          status: 'HELD',
          holdExpiresAt,
          totalGuests,
          subtotal: quote.subtotal,
          taxAmount: 0,
          addOnAmount,
          totalAmount,
          currency: process.env.DEFAULT_CURRENCY || 'INR',
          items: {
            create: {
              roomTypeId,
              roomId,
              checkIn,
              checkOut,
              nights: quote.nightCount,
              nightlyRate: quote.subtotal / quote.nightCount,
              lineTotal: quote.subtotal,
            },
          },
          addOns: addOnRows.length
            ? { create: addOnRows }
            : undefined,
        },
        include: { items: true, addOns: true, guest: true },
      });

      return booking;
    },
    { isolationLevel: 'Serializable' }
  );
}

// Transaction-scoped duplicate of isRoomAvailable, using `tx`
// instead of the module-level `prisma` client, since the outer
// availability service always uses the global client.
async function isRoomAvailableTx(tx, roomId, checkIn, checkOut, excludeBookingId = null) {
  const now = new Date();
  const conflictingItem = await tx.bookingItem.findFirst({
    where: {
      roomId,
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
      ...(excludeBookingId ? { bookingId: { not: excludeBookingId } } : {}),
      booking: {
        OR: [{ status: 'CONFIRMED' }, { status: 'HELD', holdExpiresAt: { gt: now } }],
      },
    },
  });
  if (conflictingItem) return false;

  const block = await tx.availabilityBlock.findFirst({
    where: { roomId, startDate: { lt: checkOut }, endDate: { gt: checkIn } },
  });
  return !block;
}

/** Confirms a HELD booking (typically after payment/deposit succeeds). */
async function confirmBooking(bookingId, { depositAmount } = {}) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status === 'CONFIRMED') return booking; // idempotent
  if (booking.status !== 'HELD') {
    throw new ApiError(409, `Cannot confirm a booking with status ${booking.status}`);
  }
  if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
    throw new ApiError(410, 'Hold has expired — please create a new hold');
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CONFIRMED',
      holdExpiresAt: null,
      depositAmount: depositAmount ?? booking.depositAmount,
    },
    include: { items: true, addOns: true, guest: true },
  });
}

/** Cancels a booking (HELD or CONFIRMED). Cancellation-fee logic lives here. */
async function cancelBooking(bookingId, { reason, cancelledBy = 'guest' } = {}) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { items: true } });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status === 'CANCELLED') return booking; // idempotent
  if (booking.status === 'COMPLETED') {
    throw new ApiError(409, 'Cannot cancel a completed stay');
  }

  // Reference policy skeleton from the content brief: full refund
  // 14+ days out, partial inside 14 days. Wire this up to the
  // actual policy once finalized — flagged here so it's not silently
  // assumed elsewhere in the codebase.
  const firstCheckIn = booking.items.reduce(
    (min, item) => (item.checkIn < min ? item.checkIn : min),
    booking.items[0]?.checkIn
  );
  const daysUntilCheckIn = firstCheckIn
    ? Math.ceil((firstCheckIn - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const refundEligibility =
    daysUntilCheckIn === null
      ? 'n/a'
      : daysUntilCheckIn >= 14
      ? 'full_refund'
      : daysUntilCheckIn >= 7
      ? 'partial_refund_50'
      : 'no_refund';

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelReason: reason || `Cancelled by ${cancelledBy}`,
    },
    include: { items: true, addOns: true, guest: true },
  });

  return { ...updated, refundEligibility };
}

/**
 * Modifies a CONFIRMED or HELD booking's dates/room. Re-checks
 * availability for the new range (excluding this booking's own
 * items), re-quotes the price, and updates the single BookingItem.
 * For multi-room bookings, pass `bookingItemId` to target one line;
 * this scaffold assumes the common single-room-villa case.
 */
async function modifyBooking(bookingId, { checkIn, checkOut, roomId, totalGuests }) {
  return prisma.$transaction(
    async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { items: true },
      });
      if (!booking) throw new ApiError(404, 'Booking not found');
      if (!['HELD', 'CONFIRMED'].includes(booking.status)) {
        throw new ApiError(409, `Cannot modify a booking with status ${booking.status}`);
      }

      const item = booking.items[0];
      if (!item) throw new ApiError(400, 'Booking has no reservation line to modify');

      const newCheckIn = checkIn ? new Date(checkIn) : item.checkIn;
      const newCheckOut = checkOut ? new Date(checkOut) : item.checkOut;
      const newRoomId = roomId || item.roomId;

      if (newCheckIn >= newCheckOut) {
        throw new ApiError(400, 'checkOut must be after checkIn');
      }

      const available = await isRoomAvailableTx(tx, newRoomId, newCheckIn, newCheckOut, bookingId);
      if (!available) {
        throw new ApiError(409, 'Room is not available for the new dates');
      }

      const quote = await quoteStay(item.roomTypeId, newCheckIn, newCheckOut);

      await tx.bookingItem.update({
        where: { id: item.id },
        data: {
          roomId: newRoomId,
          checkIn: newCheckIn,
          checkOut: newCheckOut,
          nights: quote.nightCount,
          nightlyRate: quote.subtotal / quote.nightCount,
          lineTotal: quote.subtotal,
        },
      });

      const newTotal = quote.subtotal + Number(booking.addOnAmount);

      return tx.booking.update({
        where: { id: bookingId },
        data: {
          subtotal: quote.subtotal,
          totalAmount: newTotal,
          totalGuests: totalGuests || booking.totalGuests,
        },
        include: { items: true, addOns: true, guest: true },
      });
    },
    { isolationLevel: 'Serializable' }
  );
}

/** Releases expired holds so their rooms become available again. Run on a cron (see utils/holdCleanup.js). */
async function releaseExpiredHolds() {
  const result = await prisma.booking.updateMany({
    where: { status: 'HELD', holdExpiresAt: { lt: new Date() } },
    data: { status: 'CANCELLED', cancelReason: 'Hold expired' },
  });
  return result.count;
}

module.exports = {
  createHold,
  confirmBooking,
  cancelBooking,
  modifyBooking,
  releaseExpiredHolds,
};
