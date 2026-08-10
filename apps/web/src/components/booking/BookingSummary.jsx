import { useBooking } from '../../context/BookingContext.jsx';
import { Media } from '../Placeholder.jsx';
import Icon from '../Icon.jsx';
import { INR, shortDate } from '../../lib/format.js';

export default function BookingSummary() {
  const { checkIn, checkOut, nights, guests, belowMin, selected, quote, addOnLines } = useBooking();
  const hasDates = nights > 0 && !belowMin;
  const roomTypeId = selected?.roomType?.id;

  return (
    <aside className="summary" aria-label="Price summary">
      <Media
        section="room_type"
        roomTypeId={roomTypeId}
        src="/gallery/cover-aerial-dusk.jpg"
        className="sum-ph"
        tag="Photo"
        label="Cosmic Park"
        style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
      />
      <div className="sum-body">
        <h3>Your stay</h3>
        <p className="muted" style={{ fontSize: '.86rem', margin: '0 0 12px' }}>
          {hasDates
            ? `${shortDate(checkIn)} → ${shortDate(checkOut)} · ${nights} night${nights > 1 ? 's' : ''} · ${guests} guests`
            : 'Pick your dates to see a live price breakdown.'}
        </p>

        {!hasDates && (
          <div className="empty-sum">
            <Icon name="leaf" style={{ width: 30, height: 30, margin: '0 auto 8px', display: 'block' }} />
            Select valid check-in and check-out dates {belowMin ? '(meet the minimum stay)' : ''} to see
            your GST-inclusive quote.
          </div>
        )}

        {hasDates && selected && (
          <>
            <div className="line">
              <span className="muted">Whole villa · {nights} night{nights > 1 ? 's' : ''}</span>
              <span>{INR(quote.roomSubtotal)}</span>
            </div>
            {quote.extraGuestFee > 0 && (
              <div className="line">
                <span className="muted">Extra guests ({quote.extraGuests} × {nights}n)</span>
                <span>{INR(quote.extraGuestFee)}</span>
              </div>
            )}
            <div className="line">
              <span className="muted">GST on room rent · 18% <span className="flag">SLAB?</span></span>
              <span>{INR(quote.roomGst)}</span>
            </div>
            <div className="line sub">
              <span>Stay total</span>
              <span>{INR(quote.stayTotal)}</span>
            </div>

            {quote.addOns.length > 0 && (
              <>
                {quote.addOns.map((a) => (
                  <div className="line" key={a.id}>
                    <span className="muted">{a.name} × {a.quantity}</span>
                    <span>{INR(a.beforeTax)}</span>
                  </div>
                ))}
                <div className="line">
                  <span className="muted">GST on add-ons · 18%</span>
                  <span>{INR(quote.addOnGst)}</span>
                </div>
                <div className="line sub">
                  <span>Add-ons total</span>
                  <span>{INR(quote.addOnTotal)}</span>
                </div>
              </>
            )}

            <div className="line">
              <span className="muted">Security deposit (refundable · no GST)</span>
              <span>{INR(quote.deposit)}</span>
            </div>
            <div className="line total">
              <span>Grand total</span>
              <b>{INR(quote.grandTotal)}</b>
            </div>
            <div className="deposit-note">
              Deposit is refunded within 7 days of check-out, less any damages. <span className="flag">CONFIRM</span>
            </div>

            <div className="pay-now">
              <small>
                PAYABLE NOW · 30% advance + deposit{' '}
                <span className="flag" style={{ background: 'rgba(255,255,255,.15)', color: 'var(--gold-lt)' }}>CONFIRM %</span>
              </small>
              <span className="amt">{INR(quote.payableNow)}</span>
              <small>Balance {INR(quote.balanceAtCheckIn)} due at check-in</small>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
