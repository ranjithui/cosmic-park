// Customer-facing price breakdown for a stay.
//
// The API's /availability returns a PRE-TAX room subtotal (sum of nightly
// rates). Per the booking rules (SITEMAP-and-BOOKING-RULES.md §2.6) and the
// wireframe, the guest must see an 18% GST-inclusive breakdown, the extra-
// guest charge, a separate refundable deposit, and the advance payable now.
// We compute all of that here so the displayed total matches the spec's
// worked example to the rupee.
//
// NOTE: the backend currently stores totals WITHOUT room-rent GST (flagged
// in the API review). This module is the single source of truth for what the
// guest is shown and asked to pay; keep it aligned with the API once the
// backend applies GST server-side.

export const GST_RATE = 0.18; // 18% on room rent + add-ons
export const BASE_OCCUPANCY = 16; // guests included in the nightly rate
export const EXTRA_GUEST_PER_NIGHT = 1500; // per extra mattress / night
export const SECURITY_DEPOSIT = 25000; // refundable, no GST
export const ADVANCE_RATE = 0.3; // % of taxed total collected now

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * @param {object} args
 * @param {number} args.roomSubtotal  pre-tax room rent (from API pricing.subtotal)
 * @param {number} args.nights        number of nights
 * @param {number} args.guests        total guests
 * @param {Array}  args.addOnLines    [{ id, name, unit, unitPrice, taxRate, quantity }]
 */
export function buildQuote({ roomSubtotal = 0, nights = 0, guests = 0, addOnLines = [] }) {
  const extraGuests = Math.max(0, guests - BASE_OCCUPANCY);
  const extraGuestFee = extraGuests * EXTRA_GUEST_PER_NIGHT * nights;

  const roomBeforeTax = roomSubtotal + extraGuestFee;
  const roomGst = round2(roomBeforeTax * GST_RATE);
  const stayTotal = round2(roomBeforeTax + roomGst);

  const addOns = addOnLines
    .filter((a) => a.quantity > 0)
    .map((a) => {
      const before = a.unitPrice * a.quantity;
      const rate = (a.taxRate ?? 18) / 100;
      const tax = round2(before * rate);
      return {
        id: a.id,
        name: a.name,
        quantity: a.quantity,
        unit: a.unit,
        beforeTax: before,
        tax,
        lineTotal: round2(before + tax),
      };
    });

  const addOnBeforeTax = addOns.reduce((s, a) => s + a.beforeTax, 0);
  const addOnGst = round2(addOns.reduce((s, a) => s + a.tax, 0));
  const addOnTotal = round2(addOnBeforeTax + addOnGst);

  const taxedTotal = round2(stayTotal + addOnTotal);
  const deposit = SECURITY_DEPOSIT;
  const grandTotal = round2(taxedTotal + deposit);
  const payableNow = round2(taxedTotal * ADVANCE_RATE + deposit);
  const balanceAtCheckIn = round2(taxedTotal - taxedTotal * ADVANCE_RATE);

  return {
    nights,
    guests,
    extraGuests,
    extraGuestFee,
    roomSubtotal,
    roomBeforeTax,
    roomGst,
    stayTotal,
    addOns,
    addOnBeforeTax,
    addOnGst,
    addOnTotal,
    taxedTotal,
    deposit,
    grandTotal,
    payableNow,
    balanceAtCheckIn,
  };
}

/**
 * Minimum-stay for a given check-in date, derived from a room type's rate
 * plans (§2.4: enforced by the check-in night's tier). Falls back to 1.
 * @param {Array} ratePlans  room type ratePlans [{ startDate, endDate, minStay, priority }]
 * @param {string} checkIn   ISO date
 */
export function minStayForCheckIn(ratePlans = [], checkIn) {
  if (!checkIn) return 1;
  const d = new Date(checkIn.slice(0, 10) + 'T00:00');
  const matching = ratePlans
    .filter((p) => {
      const s = new Date(p.startDate);
      const e = new Date(p.endDate);
      return s <= d && d < e && p.isActive !== false;
    })
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return matching[0]?.minStay || 1;
}
