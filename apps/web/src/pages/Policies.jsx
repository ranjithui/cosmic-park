import PageHeader from '../components/PageHeader.jsx';
import Footer from '../components/Footer.jsx';
import { Link } from 'react-router-dom';

export default function Policies() {
  return (
    <>
      <PageHeader
        eyebrow="Good to know"
        title="Policies"
        sub="Everything you agree to when you book Cosmic Park. Items marked CONFIRM / DEFINE are pending final sign-off from the property owner."
      />
      <div className="wrap page-body split">
        <div className="prose">
          <h2>Check-in &amp; check-out</h2>
          <p>
            Check-in from <b>2:00 PM</b>, check-out by <b>11:00 AM</b>. Early check-in and late
            check-out can sometimes be arranged for an extra cost, subject to availability and the
            turnaround needed between stays.
          </p>

          <h2>Booking model</h2>
          <p>
            Cosmic Park is booked as <b>one whole villa</b> — all 8 bedrooms, the pool, lawn and shared
            spaces are yours alone for the stay. You never share the property with other guests. The
            nightly rate includes a base of <b>16 guests <span className="flag">CONFIRM</span></b>.
          </p>

          <h2>Cancellation</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Reference framework — pending owner sign-off. <span className="flag">SIGN-OFF</span>
          </p>
          <table className="rule-table">
            <thead>
              <tr><th>Notice before check-in</th><th>Refund of stay charges</th></tr>
            </thead>
            <tbody>
              <tr><td>14 days or more</td><td>Full refund</td></tr>
              <tr><td>7–14 days</td><td>50% refund</td></tr>
              <tr><td>Less than 7 days</td><td>No refund</td></tr>
            </tbody>
          </table>
          <p className="muted">
            The security deposit is always refundable (less any damages), separate from the above.
          </p>

          <h2>Security deposit</h2>
          <p>
            A refundable security deposit of <b>₹25,000 <span className="flag">CONFIRM</span></b> is
            collected with your booking. It carries no GST and is returned within <b>7 days</b> of
            check-out, less any damage or breakage. <span className="flag">CONFIRM</span>
          </p>

          <h2>Payment</h2>
          <p>
            A <b>30% advance <span className="flag">CONFIRM %</span></b> confirms your dates; the balance
            is due before or at check-in. Both amounts are shown clearly at checkout, with a
            GST-inclusive breakdown separating the stay from any add-on experiences. A GST invoice is
            issued against the villa's GSTIN. <span className="flag">CONFIRM GSTIN</span>
          </p>

          <h2>Taxes</h2>
          <p>
            GST is charged at <b>18%</b> on room rent and on add-on experiences (bonfire, spa, meals,
            transfers). The applicable slab on room rent is being confirmed. <span className="flag">CONFIRM slab</span>
          </p>

          <h2>Identification</h2>
          <p>A valid government photo ID is required for <b>all adults</b> at check-in.</p>

          <h2>Pets, smoking &amp; children</h2>
          <ul>
            <li>Pets — <span className="flag">DEFINE</span></li>
            <li>Smoking / parties — <span className="flag">DEFINE</span></li>
            <li>Children age cut-off &amp; extra-bed charge — <span className="flag">DEFINE</span></li>
          </ul>
          <p className="muted">
            These will be finalised with the owner and surfaced both here and during booking.
          </p>
        </div>

        <aside className="aside-card">
          <h3>Quick reference</h3>
          <div className="kv"><span className="k">Check-in</span><span>2:00 PM</span></div>
          <div className="kv"><span className="k">Check-out</span><span>11:00 AM</span></div>
          <div className="kv"><span className="k">Base guests</span><span>16</span></div>
          <div className="kv"><span className="k">Deposit</span><span>₹25,000</span></div>
          <div className="kv"><span className="k">Advance</span><span>30%</span></div>
          <div className="kv"><span className="k">GST</span><span>18%</span></div>
          <Link to="/book" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
            Check dates &amp; book
          </Link>
        </aside>
      </div>
      <Footer />
    </>
  );
}
