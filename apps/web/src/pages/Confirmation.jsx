import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { buildQuote } from '../lib/pricing.js';
import { INR, longDate } from '../lib/format.js';
import Icon from '../components/Icon.jsx';
import Footer from '../components/Footer.jsx';

export default function Confirmation() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api
      .getBooking(id, controller.signal)
      .then((res) => setBooking(res.booking))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message || 'Could not load booking');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="center-state">
        <span className="loader dark" style={{ width: 28, height: 28 }} />
        <p className="muted" style={{ marginTop: 12 }}>Loading your booking…</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <>
        <div className="center-state">
          <h2>We couldn't find that booking</h2>
          <p className="muted">{error || 'The reference may be incorrect or the booking was removed.'}</p>
          <Link to="/book" className="btn btn-primary" style={{ marginTop: 16 }}>Start a new booking</Link>
        </div>
        <Footer />
      </>
    );
  }

  const item = booking.items?.[0];
  const roomType = item?.roomType;
  const nights = item?.nights || 0;

  // Reconstruct the guest-facing GST-inclusive breakdown from stored lines.
  const quote = buildQuote({
    roomSubtotal: Number(item?.lineTotal || booking.subtotal || 0),
    nights,
    guests: booking.totalGuests,
    addOnLines: (booking.addOns || []).map((a) => ({
      id: a.id,
      name: a.addOn?.name || 'Add-on',
      unit: a.addOn?.unit,
      unitPrice: Number(a.unitPrice),
      taxRate: Number(a.addOn?.taxRate ?? 18),
      quantity: a.quantity,
    })),
  });

  const status = (booking.status || '').toLowerCase();

  return (
    <>
      <div className="confirm-hero">
        <div className="tick">
          <Icon name="check" style={{ width: 30, height: 30, stroke: '#fff', strokeWidth: 2.5 }} />
        </div>
        <p className="eyebrow" style={{ color: 'var(--gold-lt)' }}>
          {status === 'confirmed' ? 'Booking confirmed' : 'Booking received'}
        </p>
        <h1>Your stay at Cosmic Park is {status === 'confirmed' ? 'booked' : 'reserved'}.</h1>
        <div className="ref">{booking.reference}</div>
        <p style={{ color: 'rgba(244,238,225,.8)', marginTop: 16, maxWidth: '46ch', marginInline: 'auto' }}>
          A confirmation with directions and check-in details would be emailed to{' '}
          <b style={{ color: '#fff' }}>{booking.guest?.email}</b>.
        </p>
      </div>

      <div className="wrap confirm-grid">
        <div>
          <div className="info-card">
            <h3>Stay details</h3>
            <div className="kv"><span className="k">Status</span>
              <span className={'status-pill ' + status}>{booking.status}</span></div>
            <div className="kv"><span className="k">Villa</span><span>{roomType?.name || 'Whole Villa'}</span></div>
            <div className="kv"><span className="k">Check-in</span><span>{longDate(item?.checkIn)} · 2:00 PM</span></div>
            <div className="kv"><span className="k">Check-out</span><span>{longDate(item?.checkOut)} · 11:00 AM</span></div>
            <div className="kv"><span className="k">Nights</span><span>{nights}</span></div>
            <div className="kv"><span className="k">Guests</span><span>{booking.totalGuests}</span></div>
          </div>

          <div className="info-card">
            <h3>Lead guest</h3>
            <div className="kv"><span className="k">Name</span><span>{booking.guest?.firstName} {booking.guest?.lastName}</span></div>
            <div className="kv"><span className="k">Email</span><span>{booking.guest?.email}</span></div>
            {booking.guest?.phone && <div className="kv"><span className="k">Phone</span><span>{booking.guest.phone}</span></div>}
          </div>

          <div className="info-card">
            <h3>Good to know</h3>
            <div className="policy-row">
              <div className="pc"><b>Check-in / out</b><span>2:00 PM / 11:00 AM</span></div>
              <div className="pc"><b>Cancellation</b><span>Full refund 14+ days out <span className="flag">SIGN-OFF</span></span></div>
              <div className="pc"><b>Security deposit</b><span>{INR(quote.deposit)} refundable</span></div>
              <div className="pc"><b>ID</b><span>Govt photo ID · all adults</span></div>
            </div>
          </div>

          <Link to="/" className="btn btn-ghost">← Back to home</Link>
        </div>

        {/* Invoice */}
        <aside className="summary" aria-label="Invoice">
          <div className="sum-body">
            <h3>GST invoice</h3>
            <p className="muted" style={{ fontSize: '.82rem', margin: '0 0 12px' }}>
              GSTIN <span className="flag">CONFIRM</span> · Ref {booking.reference}
            </p>

            <div className="line"><span className="muted">Room rent · {nights} night{nights > 1 ? 's' : ''}</span><span>{INR(quote.roomSubtotal)}</span></div>
            {quote.extraGuestFee > 0 && (
              <div className="line"><span className="muted">Extra guests</span><span>{INR(quote.extraGuestFee)}</span></div>
            )}
            <div className="line"><span className="muted">GST on room rent · 18%</span><span>{INR(quote.roomGst)}</span></div>
            <div className="line sub"><span>Stay total</span><span>{INR(quote.stayTotal)}</span></div>

            {quote.addOns.length > 0 && (
              <>
                {quote.addOns.map((a) => (
                  <div className="line" key={a.id}><span className="muted">{a.name} × {a.quantity}</span><span>{INR(a.beforeTax)}</span></div>
                ))}
                <div className="line"><span className="muted">GST on add-ons · 18%</span><span>{INR(quote.addOnGst)}</span></div>
                <div className="line sub"><span>Add-ons total</span><span>{INR(quote.addOnTotal)}</span></div>
              </>
            )}

            <div className="line"><span className="muted">Security deposit (refundable · no GST)</span><span>{INR(quote.deposit)}</span></div>
            <div className="line total"><span>Grand total</span><b>{INR(quote.grandTotal)}</b></div>

            <div className="deposit-note">
              Paid now: <b>{INR(quote.payableNow)}</b> (30% advance + deposit). Balance {INR(quote.balanceAtCheckIn)} due at check-in. <span className="flag">CONFIRM %</span>
            </div>
          </div>
        </aside>
      </div>

      <Footer />
    </>
  );
}
