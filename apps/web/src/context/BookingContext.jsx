import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { api } from '../lib/api.js';
import { buildQuote, minStayForCheckIn, BASE_OCCUPANCY } from '../lib/pricing.js';
import { nightCount } from '../lib/format.js';

const BookingContext = createContext(null);

export const useBooking = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within <BookingProvider>');
  return ctx;
};

const emptyGuest = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  specialRequest: '',
  idAck: false,
};

export function BookingProvider({ initial = {}, children }) {
  const [step, setStep] = useState(1);

  // Step 1 — dates & guests
  const [checkIn, setCheckIn] = useState(initial.checkIn || '');
  const [checkOut, setCheckOut] = useState(initial.checkOut || '');
  const [guests, setGuests] = useState(
    Math.min(BASE_OCCUPANCY, Number(initial.guests) || BASE_OCCUPANCY)
  );

  // availability search
  const [availability, setAvailability] = useState(null); // results array
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Step 2 — room selection
  const [selected, setSelected] = useState(null); // { roomType, roomId, pricing }
  const [ratePlans, setRatePlans] = useState([]);

  // Step 3 — guest + add-ons
  const [guest, setGuest] = useState(emptyGuest);
  const [addOnCatalog, setAddOnCatalog] = useState([]);
  const [addOnQty, setAddOnQty] = useState({}); // { [addOnId]: qty }

  // Step 4 — booking (hold → confirm)
  const [booking, setBooking] = useState(null);
  const [working, setWorking] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  const nights = nightCount(checkIn, checkOut);
  const minStay = useMemo(() => minStayForCheckIn(ratePlans, checkIn), [ratePlans, checkIn]);
  const belowMin = nights > 0 && nights < minStay;

  const addOnLines = useMemo(
    () =>
      addOnCatalog.map((a) => ({
        id: a.id,
        name: a.name,
        unit: a.unit,
        unitPrice: Number(a.price),
        taxRate: Number(a.taxRate),
        quantity: addOnQty[a.id] || 0,
      })),
    [addOnCatalog, addOnQty]
  );

  const quote = useMemo(
    () =>
      buildQuote({
        roomSubtotal: Number(selected?.pricing?.subtotal || 0),
        nights,
        guests,
        addOnLines,
      }),
    [selected, nights, guests, addOnLines]
  );

  // ---- actions ----
  const runSearch = useCallback(async () => {
    setSearching(true);
    setSearchError(null);
    setSelected(null);
    try {
      const res = await api.checkAvailability({ checkIn, checkOut, guests });
      setAvailability(res.results || []);
      return res.results || [];
    } catch (err) {
      setSearchError(err.message || 'Availability search failed');
      setAvailability([]);
      return [];
    } finally {
      setSearching(false);
    }
  }, [checkIn, checkOut, guests]);

  const selectRoom = useCallback(async (result) => {
    setSelected({
      roomType: result.roomType,
      roomId: result.availableRoomIds?.[0],
      pricing: result.pricing,
    });
    // pull rate plans (for min-stay) + add-on catalog in the background
    try {
      const [rt, addOns] = await Promise.all([
        api.getRoomType(result.roomType.id),
        api.listAddOns(),
      ]);
      setRatePlans(rt?.roomType?.ratePlans || []);
      setAddOnCatalog(addOns?.addOns || []);
    } catch {
      /* non-fatal; pricing still works from availability quote */
    }
  }, []);

  const setAddOn = useCallback((id, qty) => {
    setAddOnQty((m) => ({ ...m, [id]: Math.max(0, qty) }));
  }, []);

  const createHold = useCallback(async () => {
    if (!selected?.roomId) throw new Error('No room selected');
    setWorking(true);
    setBookingError(null);
    try {
      const payload = {
        roomTypeId: selected.roomType.id,
        roomId: selected.roomId,
        checkIn,
        checkOut,
        totalGuests: guests,
        guest: {
          firstName: guest.firstName.trim(),
          lastName: guest.lastName.trim(),
          email: guest.email.trim(),
          phone: guest.phone.trim() || undefined,
        },
        addOns: addOnLines
          .filter((a) => a.quantity > 0)
          .map((a) => ({ addOnId: a.id, quantity: a.quantity })),
      };
      const res = await api.createHold(payload);
      setBooking(res.booking);
      return res.booking;
    } catch (err) {
      setBookingError(err.message || 'Could not hold these dates');
      throw err;
    } finally {
      setWorking(false);
    }
  }, [selected, checkIn, checkOut, guests, guest, addOnLines]);

  const confirm = useCallback(async () => {
    if (!booking?.id) throw new Error('No booking to confirm');
    setWorking(true);
    setBookingError(null);
    try {
      const res = await api.confirmBooking(booking.id, { depositAmount: quote.deposit });
      setBooking(res.booking);
      return res.booking;
    } catch (err) {
      setBookingError(err.message || 'Payment confirmation failed');
      throw err;
    } finally {
      setWorking(false);
    }
  }, [booking, quote.deposit]);

  const value = {
    step, setStep,
    checkIn, setCheckIn,
    checkOut, setCheckOut,
    guests, setGuests,
    nights, minStay, belowMin,
    availability, searching, searchError, runSearch,
    selected, ratePlans, selectRoom,
    guest, setGuest,
    addOnCatalog, addOnQty, addOnLines, setAddOn,
    booking, working, bookingError, createHold, confirm,
    quote,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}
