import { useState } from 'react';
import { useBooking } from '../../context/BookingContext.jsx';
import Icon from '../Icon.jsx';
import { today } from '../../lib/format.js';
import { BASE_OCCUPANCY } from '../../lib/pricing.js';

export default function StepDates() {
  const {
    checkIn, setCheckIn, checkOut, setCheckOut, guests, setGuests,
    nights, availability, searching, searchError, runSearch, setStep,
  } = useBooking();
  const [touched, setTouched] = useState(false);

  const datesValid = nights > 0;

  const onContinue = async () => {
    setTouched(true);
    if (!datesValid) return;
    const results = await runSearch();
    const villa = results.find((r) => r.availableRoomCount > 0);
    if (villa) setStep(2);
  };

  // Show the "no availability" message whenever a search has run and come
  // back empty — whether triggered manually or by the auto-search from the
  // home page (in which case `touched` is still false).
  const searchedEmpty =
    !searching && Array.isArray(availability) && availability.length === 0 && datesValid;

  return (
    <div className="step">
      <div className="step-title">
        <span className="step-num">1</span>
        <h2>Dates &amp; guests</h2>
      </div>

      <div className="grid-3">
        <div className="field">
          <label htmlFor="ci">Check-in <span className="muted" style={{ fontWeight: 400 }}>· 2:00 PM</span></label>
          <input
            id="ci" type="date" min={today()} value={checkIn}
            aria-invalid={touched && !datesValid}
            onChange={(e) => { setCheckIn(e.target.value); if (checkOut && checkOut <= e.target.value) setCheckOut(''); }}
          />
        </div>
        <div className="field">
          <label htmlFor="co">Check-out <span className="muted" style={{ fontWeight: 400 }}>· 11:00 AM</span></label>
          <input
            id="co" type="date" min={checkIn || today()} value={checkOut}
            aria-invalid={touched && !datesValid}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="gc">Guests</label>
          <div className="stepper" style={{ width: '100%', justifyContent: 'space-between' }}>
            <button type="button" aria-label="One fewer guest" onClick={() => setGuests(Math.max(1, guests - 1))} disabled={guests <= 1}>−</button>
            <span id="gc" aria-live="polite">{guests}</span>
            <button type="button" aria-label="One more guest" onClick={() => setGuests(Math.min(BASE_OCCUPANCY, guests + 1))} disabled={guests >= BASE_OCCUPANCY}>+</button>
          </div>
        </div>
      </div>

      {touched && !datesValid && (
        <div className="hint warn">
          <Icon name="cal" style={{ width: 18, height: 18, stroke: 'var(--warn-fg)' }} />
          <span>Please choose a check-out date after your check-in date.</span>
        </div>
      )}

      {guests >= BASE_OCCUPANCY && (
        <div className="hint info">
          <Icon name="users" style={{ width: 18, height: 18, stroke: 'var(--moss)' }} />
          <span>The villa is priced for a base of {BASE_OCCUPANCY} guests. Travelling with a larger group? <a href="mailto:stay@cosmicpark.in" style={{ textDecoration: 'underline' }}>Enquire about extra beds</a> <span className="flag">CONFIRM max occupancy</span></span>
        </div>
      )}

      {searchError && (
        <div className="hint warn">
          <Icon name="cal" style={{ width: 18, height: 18, stroke: 'var(--warn-fg)' }} />
          <span>{String(searchError)}</span>
        </div>
      )}

      {searchedEmpty && (
        <div className="hint warn">
          <Icon name="cal" style={{ width: 18, height: 18, stroke: 'var(--warn-fg)' }} />
          <span>Cosmic Park isn't available for these dates — it may already be booked or blocked. Try a different range.</span>
        </div>
      )}

      <div className="step-actions" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
        <button className="btn btn-primary" onClick={onContinue} disabled={searching}>
          {searching ? <><span className="loader" /> Checking…</> : 'Check availability →'}
        </button>
      </div>
    </div>
  );
}
