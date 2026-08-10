const prisma = require('../config/db');

/**
 * Returns the nightly rate for a single calendar date, given a
 * room type. Checks active RatePlan rows whose [startDate, endDate)
 * cover the date; if several overlap, the highest `priority` wins.
 * Falls back to RoomType.basePrice when no plan matches.
 */
async function getRateForDate(roomTypeId, date) {
  const plans = await prisma.ratePlan.findMany({
    where: {
      roomTypeId,
      isActive: true,
      startDate: { lte: date },
      endDate: { gt: date },
    },
    orderBy: { priority: 'desc' },
  });

  if (plans.length > 0) {
    return { rate: Number(plans[0].nightlyRate), ratePlanName: plans[0].name };
  }

  const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
  if (!roomType) throw new Error(`RoomType ${roomTypeId} not found`);
  return { rate: Number(roomType.basePrice), ratePlanName: 'Standard' };
}

/**
 * Sums nightly rates across a date range [checkIn, checkOut).
 * Also returns a per-night breakdown, useful for the quote/
 * hold response so the frontend can show a price calendar.
 */
async function quoteStay(roomTypeId, checkIn, checkOut) {
  const nights = [];
  let cursor = new Date(checkIn);
  const end = new Date(checkOut);

  while (cursor < end) {
    const { rate, ratePlanName } = await getRateForDate(roomTypeId, cursor);
    nights.push({ date: new Date(cursor), rate, ratePlanName });
    cursor.setDate(cursor.getDate() + 1);
  }

  const subtotal = nights.reduce((sum, n) => sum + n.rate, 0);
  return { nights, nightCount: nights.length, subtotal };
}

/** Computes GST on an add-on line, rounded to 2 decimals. */
function computeAddOnTax(unitPrice, quantity, taxRatePercent) {
  const lineBeforeTax = unitPrice * quantity;
  const tax = Math.round(lineBeforeTax * (taxRatePercent / 100) * 100) / 100;
  return { lineBeforeTax, tax, lineTotal: Math.round((lineBeforeTax + tax) * 100) / 100 };
}

module.exports = { getRateForDate, quoteStay, computeAddOnTax };
