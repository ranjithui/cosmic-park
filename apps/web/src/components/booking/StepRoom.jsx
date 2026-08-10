import { useBooking } from '../../context/BookingContext.jsx';
import { Media } from '../Placeholder.jsx';
import Icon from '../Icon.jsx';
import { INR, shortDate } from '../../lib/format.js';

export default function StepRoom() {
  const {
    availability, selected, selectRoom, nights, minStay, belowMin, setStep,
  } = useBooking();

  const results = availability || [];

  return (
    <div className="step">
      <div className="step-title">
        <span className="step-num">2</span>
        <h2>Choose your stay</h2>
      </div>

      {results.length === 0 && (
        <div className="hint warn">
          <Icon name="cal" style={{ width: 18, height: 18, stroke: 'var(--warn-fg)' }} />
          <span>No availability for these dates. Go back and pick a different range.</span>
        </div>
      )}

      {results.map((r, i) => {
        const isSel = selected?.roomType?.id === r.roomType.id;
        const avgNight = r.pricing?.nights ? r.pricing.subtotal / r.pricing.nights : null;
        return (
          <button
            type="button"
            key={r.roomType.id}
            className={'opt ' + (isSel ? 'sel' : '')}
            aria-pressed={isSel}
            onClick={() => selectRoom(r)}
          >
            <span className="radio-dot" />
            {/* Room types come from the API, so there is no fixed photo per id —
                the bedroom frames cycle as a stand-in until one is uploaded. */}
            <Media
              section="room_type"
              roomTypeId={r.roomType.id}
              src={`/gallery/bedroom-${(i % 8) + 1}.jpg`}
              tag="Photo"
              label={r.roomType.name}
            />
            <div>
              <h3>
                {r.roomType.name}{' '}
                <span className="flag good">RECOMMENDED</span>
              </h3>
              <p className="muted" style={{ margin: 0, fontSize: '.9rem' }}>
                {r.roomType.bedrooms} bedrooms · base {r.roomType.maxOccupancy} guests · private pool,
                lawn, bonfire pit &amp; games. Your group only.
              </p>
            </div>
            <div className="price">
              <b>{avgNight ? INR(avgNight) : '₹45k+'}</b>
              <span>avg / night</span>
            </div>
          </button>
        );
      })}

      {selected && (
        <>
          {/* per-night breakdown from the API quote */}
          <div className="hint ok" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <Icon name="cal" style={{ width: 18, height: 18, stroke: 'var(--ok-fg)' }} />
              <strong>{nights} night{nights > 1 ? 's' : ''} · per-night pricing</strong>
            </div>
            <div style={{ display: 'grid', gap: 2 }}>
              {(selected.pricing?.breakdown || []).map((n, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem' }}>
                  <span>{shortDate(n.date)} · {n.ratePlanName}</span>
                  <span>{INR(n.rate)}</span>
                </div>
              ))}
            </div>
          </div>

          {belowMin && (
            <div className="hint warn">
              <Icon name="cal" style={{ width: 18, height: 18, stroke: 'var(--warn-fg)' }} />
              <span>
                These dates fall in a period with a <b>{minStay}-night minimum</b>. Please go back and
                extend your stay.
              </span>
            </div>
          )}
        </>
      )}

      <div className="step-actions" style={{ marginTop: 18 }}>
        <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
        <button className="btn btn-primary" disabled={!selected || belowMin} onClick={() => setStep(3)}>
          Continue →
        </button>
      </div>
    </div>
  );
}
