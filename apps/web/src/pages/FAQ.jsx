import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Footer from '../components/Footer.jsx';

const FAQS = [
  {
    q: 'Can I book just a few bedrooms instead of the whole villa?',
    a: 'Cosmic Park is sold as one whole-villa unit — all 8 bedrooms and the shared spaces are yours alone. You never share the property with strangers. Per-bedroom stays may be offered on quiet dates in future, but they are off by default.',
  },
  {
    q: 'How many people can stay?',
    a: 'The nightly rate includes a base of 16 guests. Larger groups may be accommodated with extra mattresses at an additional per-night charge — please enquire, as the maximum occupancy is being confirmed.',
  },
  {
    q: 'How is the price calculated?',
    a: 'Rates are per night and vary by season — Off-Peak, Peak (weekends / high season) and Festive. A stay that spans different tiers is priced night by night, so your quote is always the true sum, never a flat guess. GST at 18% and any add-ons are shown separately at checkout.',
  },
  {
    q: 'Is there a minimum stay?',
    a: 'Yes — it depends on the season of your check-in night: 1 night off-peak, 2 nights on peak dates, and 3 nights over festive periods. The booking engine will tell you if your dates need a longer stay.',
  },
  {
    q: 'What’s included, and what costs extra?',
    a: 'Breakfast is complimentary every morning. Optional experiences — a bonfire evening, in-villa spa, meal packages, and airport transfers — can be added at booking and are priced transparently with 18% GST.',
  },
  {
    q: 'What about the security deposit?',
    a: 'A refundable ₹25,000 deposit is collected with your booking (no GST) and returned within 7 days of check-out, less any damages. Amount pending final confirmation.',
  },
  {
    q: 'What is your cancellation policy?',
    a: 'As a reference: full refund of stay charges 14+ days before check-in, 50% within 7–14 days, and no refund inside 7 days. The deposit is always refundable. Final terms are pending owner sign-off.',
  },
  {
    q: 'How do I get there?',
    a: 'Cosmic Park is in Anaikatti, roughly 35 km from Coimbatore International Airport (CJB) — about an hour’s drive. Airport transfers can be added to your booking as a one-way or round trip.',
  },
  {
    q: 'How do I pay, and when?',
    a: 'A 30% advance confirms your dates; the balance is due before or at check-in. You’ll see both amounts — "payable now" and "balance at check-in" — before you confirm.',
  },
];

function Item({ q, a, open, onToggle, id }) {
  return (
    <div className={'faq-item' + (open ? ' open' : '')}>
      <button className="faq-q" aria-expanded={open} aria-controls={`faq-a-${id}`} onClick={onToggle}>
        {q}
        <span className="pm" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="faq-a" id={`faq-a-${id}`} role="region">
          <p>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <>
      <PageHeader
        eyebrow="FAQ"
        title="Questions, answered"
        sub="The things groups ask most before booking Cosmic Park. Still unsure? Reach out and we’ll help you plan."
      />
      <div className="wrap page-body">
        <div className="faq">
          {FAQS.map((f, i) => (
            <Item key={i} id={i} q={f.q} a={f.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
        <div style={{ marginTop: 34, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/book" className="btn btn-primary">Check dates &amp; book</Link>
          <a href="mailto:stay@cosmicpark.in" className="btn btn-ghost">Ask a question</a>
        </div>
      </div>
      <Footer />
    </>
  );
}
