import { useState } from 'react';
import { useBooking } from '../../context/BookingContext.jsx';
import Icon from '../Icon.jsx';
import { INR } from '../../lib/format.js';

const iconForAddOn = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('bonfire') || n.includes('fire')) return 'fire';
  if (n.includes('spa') || n.includes('massage')) return 'spa';
  if (n.includes('meal') || n.includes('dining') || n.includes('breakfast')) return 'dine';
  if (n.includes('transfer') || n.includes('airport') || n.includes('car')) return 'car';
  return 'leaf';
};

const unitLabel = (unit) =>
  ({ per_person: 'per person', per_night: 'per night', per_booking: 'per booking' }[unit] || unit);

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const phoneOk = (v) => v.replace(/\D/g, '').length >= 10;

export default function StepGuest() {
  const { guest, setGuest, addOnCatalog, addOnQty, setAddOn, setStep } = useBooking();
  const [errors, setErrors] = useState({});

  const set = (k, v) => setGuest((g) => ({ ...g, [k]: v }));

  const validate = () => {
    const e = {};
    if (!guest.firstName.trim()) e.firstName = 'First name is required';
    if (!guest.lastName.trim()) e.lastName = 'Last name is required';
    if (!emailOk(guest.email.trim())) e.email = 'Enter a valid email';
    if (!phoneOk(guest.phone)) e.phone = 'Enter a valid phone number';
    if (!guest.idAck) e.idAck = 'Please acknowledge the ID requirement';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onContinue = () => {
    if (validate()) setStep(4);
  };

  return (
    <div className="step">
      <div className="step-title">
        <span className="step-num">3</span>
        <h2>Guest details &amp; experiences</h2>
      </div>

      <div className="grid-2">
        <div className="form-row">
          <label htmlFor="fn">First name</label>
          <input id="fn" value={guest.firstName} aria-invalid={!!errors.firstName}
            onChange={(e) => set('firstName', e.target.value)} />
          {errors.firstName && <p className="err">{errors.firstName}</p>}
        </div>
        <div className="form-row">
          <label htmlFor="ln">Last name</label>
          <input id="ln" value={guest.lastName} aria-invalid={!!errors.lastName}
            onChange={(e) => set('lastName', e.target.value)} />
          {errors.lastName && <p className="err">{errors.lastName}</p>}
        </div>
        <div className="form-row">
          <label htmlFor="em">Email</label>
          <input id="em" type="email" value={guest.email} aria-invalid={!!errors.email}
            onChange={(e) => set('email', e.target.value)} />
          {errors.email && <p className="err">{errors.email}</p>}
        </div>
        <div className="form-row">
          <label htmlFor="ph">Phone</label>
          <input id="ph" type="tel" value={guest.phone} aria-invalid={!!errors.phone}
            onChange={(e) => set('phone', e.target.value)} />
          {errors.phone && <p className="err">{errors.phone}</p>}
        </div>
      </div>
      <div className="form-row">
        <label htmlFor="city">City <span className="muted" style={{ fontWeight: 400 }}>· optional</span></label>
        <input id="city" value={guest.city} onChange={(e) => set('city', e.target.value)} />
      </div>
      <div className="form-row">
        <label htmlFor="sr">Special requests <span className="muted" style={{ fontWeight: 400 }}>· optional</span></label>
        <textarea id="sr" value={guest.specialRequest} placeholder="Arrival time, celebrations, dietary notes…"
          onChange={(e) => set('specialRequest', e.target.value)} />
      </div>

      <h3 style={{ fontSize: '1.1rem', margin: '22px 0 4px' }}>Add experiences</h3>
      <p className="muted" style={{ fontSize: '.9rem', marginTop: 0 }}>All optional, priced transparently.</p>

      {/* Breakfast is always included */}
      <div className="addon">
        <div className="ic"><Icon name="dine" /></div>
        <div className="info">
          <h3>Breakfast <span className="gst-tag">INCLUDED</span></h3>
          <span>Complimentary al fresco breakfast, every morning.</span>
        </div>
        <span className="toggle on" aria-label="Breakfast is included" style={{ opacity: 0.6, cursor: 'not-allowed' }} />
      </div>

      {addOnCatalog.length === 0 && (
        <p className="muted" style={{ fontSize: '.85rem' }}>No additional experiences configured yet.</p>
      )}

      {addOnCatalog.map((a) => {
        const qty = addOnQty[a.id] || 0;
        return (
          <div className="addon" key={a.id}>
            <div className="ic"><Icon name={iconForAddOn(a.name)} /></div>
            <div className="info">
              <h3>{a.name} <span className="gst-tag">+{Number(a.taxRate)}% GST</span></h3>
              <span>{INR(a.price)} {unitLabel(a.unit)}{a.description ? ` · ${a.description}` : ''}</span>
            </div>
            <div className="stepper">
              <button type="button" aria-label={`Fewer ${a.name}`} onClick={() => setAddOn(a.id, qty - 1)} disabled={qty <= 0}>−</button>
              <span aria-live="polite">{qty}</span>
              <button type="button" aria-label={`More ${a.name}`} onClick={() => setAddOn(a.id, qty + 1)}>+</button>
            </div>
          </div>
        );
      })}

      <div className="check-row" style={{ marginTop: 18 }}>
        <input id="idack" type="checkbox" checked={guest.idAck} onChange={(e) => set('idAck', e.target.checked)} aria-invalid={!!errors.idAck} />
        <label htmlFor="idack" style={{ margin: 0, textTransform: 'none', letterSpacing: 0, fontWeight: 400, fontSize: '.9rem', color: 'var(--moss)' }}>
          I understand a government photo ID is required for all adults at check-in.
        </label>
      </div>
      {errors.idAck && <p className="err" style={{ marginLeft: 28 }}>{errors.idAck}</p>}

      <div className="step-actions" style={{ marginTop: 20 }}>
        <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
        <button className="btn btn-primary" onClick={onContinue}>Continue to payment →</button>
      </div>
    </div>
  );
}
