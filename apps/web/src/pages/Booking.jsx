import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BookingProvider, useBooking } from '../context/BookingContext.jsx';
import BookingSummary from '../components/booking/BookingSummary.jsx';
import StepDates from '../components/booking/StepDates.jsx';
import StepRoom from '../components/booking/StepRoom.jsx';
import StepGuest from '../components/booking/StepGuest.jsx';
import StepPayment from '../components/booking/StepPayment.jsx';
import Footer from '../components/Footer.jsx';
import { INR } from '../lib/format.js';

const STEPS = ['Dates', 'Stay', 'Details', 'Payment'];

function Progress() {
  const { step } = useBooking();
  return (
    <ol className="progress" aria-label="Booking progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n === step ? 'active' : n < step ? 'done' : '';
        return (
          <li key={label} className={state} aria-current={n === step ? 'step' : undefined}>
            <span className="pnum">{n < step ? '✓' : n}</span>
            {label}
            {i < STEPS.length - 1 && <span className="bar" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

function Wizard() {
  const { step, setStep } = useBooking();
  const navigate = useNavigate();
  const topRef = useRef(null);

  // scroll to top of the flow on each step change
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  return (
    <>
      <div className="book-head" ref={topRef}>
        <div className="wrap" style={{ display: 'block' }}>
          <button className="crumb" onClick={() => (step > 1 ? setStep(step - 1) : navigate('/'))}>
            ← {step > 1 ? 'Back a step' : 'Home'}
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap', marginTop: 6 }}>
            <div>
              <h1>Book your stay</h1>
              <p>Hold the whole of Cosmic Park for your group. Prices are GST-inclusive; figures are indicative placeholders pending final rates.</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '.72rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 700 }}>From</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: '2rem' }}>
                {INR(45000)}<span style={{ fontSize: '.9rem', opacity: 0.7 }}> / night</span>
              </div>
            </div>
          </div>
          <Progress />
        </div>
      </div>

      <div className="wrap book-layout">
        <div>
          {step === 1 && <StepDates />}
          {step === 2 && <StepRoom />}
          {step === 3 && <StepGuest />}
          {step === 4 && <StepPayment />}
        </div>
        <BookingSummary />
      </div>

      <Footer />
    </>
  );
}

// Bridges URL query (?checkIn&checkOut&guests from the home search) into the
// provider, and auto-runs the availability search to land on step 2.
function AutoSearch() {
  const [params] = useSearchParams();
  const { checkIn, checkOut, runSearch, setStep } = useBooking();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (checkIn && checkOut) {
      runSearch().then((results) => {
        if (results.find((r) => r.availableRoomCount > 0)) setStep(2);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export default function Booking() {
  const [params] = useSearchParams();
  const initial = {
    checkIn: params.get('checkIn') || '',
    checkOut: params.get('checkOut') || '',
    guests: params.get('guests') || '',
  };
  return (
    <BookingProvider initial={initial}>
      <AutoSearch />
      <Wizard />
    </BookingProvider>
  );
}
