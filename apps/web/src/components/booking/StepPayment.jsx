import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext.jsx';
import Icon from '../Icon.jsx';
import { INR } from '../../lib/format.js';

function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setRemaining(Math.max(0, Math.floor(ms / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return remaining;
}

export default function StepPayment() {
  const navigate = useNavigate();
  const { quote, booking, createHold, confirm, working, bookingError, setStep } = useBooking();
  const [method, setMethod] = useState('card');
  const [expired, setExpired] = useState(false);
  const [holdFailed, setHoldFailed] = useState(null);
  const held = useRef(false);

  // Reserve the villa on entering this step (once).
  useEffect(() => {
    if (held.current || booking) return;
    held.current = true;
    createHold().catch((err) => setHoldFailed(err.message || 'Could not hold these dates'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const remaining = useCountdown(booking?.holdExpiresAt);
  useEffect(() => {
    if (remaining === 0 && booking?.holdExpiresAt) setExpired(true);
  }, [remaining, booking]);

  const mm = remaining != null ? String(Math.floor(remaining / 60)).padStart(2, '0') : '--';
  const ss = remaining != null ? String(remaining % 60).padStart(2, '0') : '--';
  const urgent = remaining != null && remaining <= 120;

  const pay = async () => {
    try {
      // NOTE: no real gateway is wired (the API's Payment model is a stub).
      // In production, run the gateway here and confirm on its success webhook.
      const b = await confirm();
      navigate(`/confirmation/${b.id}`);
    } catch {
      /* bookingError is surfaced below */
    }
  };

  if (holdFailed) {
    return (
      <div className="step">
        <div className="step-title"><span className="step-num">4</span><h2>Payment</h2></div>
        <div className="hint warn">
          <Icon name="lock" style={{ width: 18, height: 18, stroke: 'var(--warn-fg)' }} />
          <span>{holdFailed}</span>
        </div>
        <div className="step-actions" style={{ marginTop: 18 }}>
          <button className="btn btn-ghost" onClick={() => setStep(1)}>← Start over</button>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="step">
        <div className="step-title"><span className="step-num">4</span><h2>Payment</h2></div>
        <div className="hint warn">
          <Icon name="cal" style={{ width: 18, height: 18, stroke: 'var(--warn-fg)' }} />
          <span>Your 15-minute hold expired and the dates were released. Please start again to re-check availability.</span>
        </div>
        <div className="step-actions" style={{ marginTop: 18 }}>
          <button className="btn btn-primary" onClick={() => setStep(1)}>Start over</button>
        </div>
      </div>
    );
  }

  return (
    <div className="step">
      <div className="step-title" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="step-num">4</span>
          <h2>Payment</h2>
        </div>
        {booking && (
          <span className={'hold-timer' + (urgent ? ' urgent' : '')}>
            <Icon name="lock" style={{ width: 15, height: 15, stroke: 'currentColor' }} />
            Held {mm}:{ss}
          </span>
        )}
      </div>

      {!booking && working && (
        <div className="hint info"><span className="loader dark" /> <span>Reserving your dates…</span></div>
      )}

      <div className="demo-note">
        <Icon name="lock" style={{ width: 16, height: 16, stroke: '#7a5a12' }} />
        <span>
          <b>Demo payment.</b> No live gateway is connected and no card is charged — submitting confirms the
          booking against the API so you can see the full flow. Wire Razorpay/Stripe here for production.
        </span>
      </div>

      <div className="pay-methods" role="tablist" aria-label="Payment method">
        {[
          { id: 'card', label: 'Card', icon: 'card' },
          { id: 'upi', label: 'UPI', icon: 'phone' },
          { id: 'bank', label: 'Bank transfer', icon: 'lock' },
        ].map((m) => (
          <button key={m.id} role="tab" aria-selected={method === m.id}
            className={'pay-method' + (method === m.id ? ' on' : '')} onClick={() => setMethod(m.id)}>
            <Icon name={m.icon} style={{ width: 18, height: 18, stroke: 'var(--forest)' }} />
            {m.label}
          </button>
        ))}
      </div>

      <div className="pay-card">
        {method === 'card' && (
          <>
            <div className="form-row">
              <label htmlFor="cardno">Card number</label>
              <input id="cardno" inputMode="numeric" placeholder="4242 4242 4242 4242" autoComplete="off" />
            </div>
            <div className="grid-2">
              <div className="form-row"><label htmlFor="exp">Expiry</label><input id="exp" placeholder="MM / YY" autoComplete="off" /></div>
              <div className="form-row"><label htmlFor="cvv">CVV</label><input id="cvv" placeholder="123" autoComplete="off" /></div>
            </div>
          </>
        )}
        {method === 'upi' && (
          <div className="form-row">
            <label htmlFor="upi">UPI ID</label>
            <input id="upi" placeholder="name@bank" autoComplete="off" />
          </div>
        )}
        {method === 'bank' && (
          <p className="muted" style={{ margin: 0, fontSize: '.9rem' }}>
            Bank transfer instructions would be emailed after you place the request. For this demo, just
            confirm below.
          </p>
        )}
      </div>

      {bookingError && (
        <div className="hint warn" style={{ marginTop: 16 }}>
          <Icon name="lock" style={{ width: 18, height: 18, stroke: 'var(--warn-fg)' }} />
          <span>{bookingError}</span>
        </div>
      )}

      <div className="step-actions" style={{ marginTop: 20 }}>
        <button className="btn btn-ghost" onClick={() => setStep(3)} disabled={working}>← Back</button>
        <button className="btn btn-primary" onClick={pay} disabled={!booking || working}>
          {working ? <><span className="loader" /> Confirming…</> : <><Icon name="lock" style={{ width: 16, height: 16, stroke: '#fff' }} /> Pay {INR(quote.payableNow)} now</>}
        </button>
      </div>
      <p className="muted" style={{ fontSize: '.76rem', textAlign: 'center', margin: '12px 0 0' }}>
        You won't be charged in this demo · GST invoice needs villa GSTIN <span className="flag">CONFIRM</span>
      </p>
    </div>
  );
}
