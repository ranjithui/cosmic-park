import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { buildQuote } from '../lib/pricing.js';
import { INR, longDate } from '../lib/format.js';
import PageHeader from '../components/PageHeader.jsx';
import Footer from '../components/Footer.jsx';
import Icon from '../components/Icon.jsx';

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const REFUND_LABEL = {
  full_refund: 'Full refund of stay charges',
  partial_refund_50: '50% refund of stay charges',
  no_refund: 'No refund (inside 7 days of check-in)',
  'n/a': '—',
};

export default function ManageBooking() {
  const [ref, setRef] = useState('');
  const [email, setEmail] = useState('');
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const lookup = async (e) => {
    e.preventDefault();
    setError(null);
    setBooking(null);
    setCancelResult(null);
    // Accept a pasted confirmation link OR a raw booking ID.
    const match = ref.match(UUID_RE);
    if (!match) {
      setError('Enter the booking ID (or paste the confirmation link) from your email.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.getBooking(match[0]);
      const b = res.booking;
      // Pair the lookup with an email check (booking UUIDs alone shouldn't
      // expose a reservation). Verified client-side here.
      if ((b.guest?.email || '').toLowerCase() !== email.trim().toLowerCase()) {
        setError('That email doesn’t match this booking. Please check and try again.');
        return;
      }
      setBooking(b);
    } catch (err) {
      setError(err.status === 404 ? 'No booking found for that ID.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const doCancel = async () => {
    setCancelling(true);
    setError(null);
    try {
      const res = await api.cancelBooking(booking.id, { reason: 'Cancelled by guest', cancelledBy: 'guest' });
      setBooking(res.booking);
      setCancelResult(res.booking.refundEligibility || 'n/a');
      setConfirmingCancel(false);
    } catch (err) {
      setError(err.message || 'Could not cancel this booking');
    } finally {
      setCancelling(false);
    }
  };

  const item = booking?.items?.[0];
  const quote = booking
    ? buildQuote({
        roomSubtotal: Number(item?.lineTotal || booking.subtotal || 0),
        nights: item?.nights || 0,
        guests: booking.totalGuests,
        addOnLines: (booking.addOns || []).map((a) => ({
          id: a.id,
          name: a.addOn?.name || 'Add-on',
          unitPrice: Number(a.unitPrice),
          taxRate: Number(a.addOn?.taxRate ?? 18),
          quantity: a.quantity,
        })),
      })
    : null;

  const status = (booking?.status || '').toLowerCase();
  const canCancel = booking && ['HELD', 'CONFIRMED'].includes(booking.status);

  return (
    <>
      <PageHeader
        eyebrow="Manage my booking"
        title="Find your reservation"
        sub="Look up a booking to view its details or cancel it. You’ll need the booking ID from your confirmation email (or just paste the confirmation link)."
      />

      <div className="wrap page-body">
        {!booking && (
          <div className="manage-wrap">
            <form className="manage-card" onSubmit={lookup}>
              <div className="form-row">
                <label htmlFor="ref">Booking ID or confirmation link</label>
                <input id="ref" value={ref} onChange={(e) => setRef(e.target.value)}
                  placeholder="e.g. 9333d9f0-60e4-… or the full link" aria-invalid={!!error} />
              </div>
              <div className="form-row">
                <label htmlFor="mail">Email on the booking</label>
                <input id="mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" aria-invalid={!!error} />
              </div>
              {error && (
                <div className="hint warn" style={{ marginTop: 4 }}>
                  <Icon name="lock" style={{ width: 18, height: 18, stroke: 'var(--warn-fg)' }} />
                  <span>{error}</span>
                </div>
              )}
              <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={loading}>
                {loading ? <><span className="loader" /> Looking up…</> : 'Find booking'}
              </button>
              <p className="muted" style={{ fontSize: '.82rem', textAlign: 'center', margin: '12px 0 0' }}>
                Can’t find your ID? <a href="mailto:stay@cosmicpark.in" style={{ textDecoration: 'underline' }}>Email us</a> and we’ll help.
              </p>
            </form>
          </div>
        )}

        {booking && quote && (
          <div className="split">
            <div>
              <div className="info-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ margin: 0 }}>Booking {booking.reference}</h3>
                  <span className={'status-pill ' + status}>{booking.status}</span>
                </div>
                <div className="kv"><span className="k">Villa</span><span>{item?.roomType?.name || 'Whole Villa'}</span></div>
                <div className="kv"><span className="k">Check-in</span><span>{longDate(item?.checkIn)} · 2:00 PM</span></div>
                <div className="kv"><span className="k">Check-out</span><span>{longDate(item?.checkOut)} · 11:00 AM</span></div>
                <div className="kv"><span className="k">Nights</span><span>{item?.nights}</span></div>
                <div className="kv"><span className="k">Guests</span><span>{booking.totalGuests}</span></div>
                <div className="kv"><span className="k">Lead guest</span><span>{booking.guest?.firstName} {booking.guest?.lastName}</span></div>
              </div>

              {cancelResult && (
                <div className="hint ok">
                  <Icon name="check" style={{ width: 18, height: 18, stroke: 'var(--ok-fg)' }} />
                  <span>
                    Booking cancelled. Refund eligibility: <b>{REFUND_LABEL[cancelResult] || cancelResult}</b>.
                    Your deposit is refundable (less any damages). <span className="flag">policy pending sign-off</span>
                  </span>
                </div>
              )}

              {canCancel && !confirmingCancel && (
                <button className="btn btn-ghost" onClick={() => setConfirmingCancel(true)}>Cancel this booking</button>
              )}

              {confirmingCancel && (
                <div className="info-card" style={{ borderColor: 'var(--warn-line)', background: '#fff9f6' }}>
                  <h3 style={{ marginBottom: 8 }}>Cancel this booking?</h3>
                  <p className="muted" style={{ marginTop: 0 }}>
                    Refund follows the cancellation policy based on how far out you are from check-in. This
                    can’t be undone.
                  </p>
                  {error && <p className="err">{error}</p>}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={doCancel} disabled={cancelling}
                      style={{ background: 'var(--clay-dk)' }}>
                      {cancelling ? <><span className="loader" /> Cancelling…</> : 'Yes, cancel booking'}
                    </button>
                    <button className="btn btn-ghost" onClick={() => setConfirmingCancel(false)} disabled={cancelling}>
                      Keep booking
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 18 }}>
                <button className="btn btn-ghost" onClick={() => { setBooking(null); setRef(''); setEmail(''); }}>
                  ← Look up another booking
                </button>
              </div>
            </div>

            <aside className="aside-card">
              <h3>Price summary</h3>
              <div className="line"><span className="muted">Room rent · {item?.nights}n</span><span>{INR(quote.roomSubtotal)}</span></div>
              <div className="line"><span className="muted">GST on room rent · 18%</span><span>{INR(quote.roomGst)}</span></div>
              {quote.addOns.map((a) => (
                <div className="line" key={a.id}><span className="muted">{a.name} × {a.quantity}</span><span>{INR(a.lineTotal)}</span></div>
              ))}
              <div className="line"><span className="muted">Deposit (refundable)</span><span>{INR(quote.deposit)}</span></div>
              <div className="line total"><span>Grand total</span><b>{INR(quote.grandTotal)}</b></div>
            </aside>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
