import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

const QUICK = [
  { label: 'The Villa', to: '/#villa' },
  { label: 'Experiences', to: '/#experiences' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Location', to: '/#location' },
];
const INFO = [
  { label: 'About Us', to: '/story' },
  { label: 'House Rules', to: '/policies' },
  { label: 'FAQs', to: '/faq' },
  { label: 'Manage my booking', to: '/manage' },
];

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <div className="brand" style={{ cursor: 'default' }}>
              <span className="mark" aria-hidden="true" />
              <b>
                Cosmic
                <br />
                Park
              </b>
            </div>
            <p>
              A luxury villa in the hills, designed for large families and friends to gather, relax
              and reconnect.
            </p>
            <div className="socials">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <Icon name="insta" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                <Icon name="fb" />
              </a>
              <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" aria-label="WhatsApp">
                <Icon name="wa" />
              </a>
            </div>
          </div>

          <div>
            <h5>Quick Links</h5>
            <ul>
              {QUICK.map((l) => (
                <li key={l.label}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5>Information</h5>
            <ul>
              {INFO.map((l) => (
                <li key={l.label}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5>Stay Connected</h5>
            <ul className="foot-contact">
              <li>
                <a href="tel:+919876543210">+91 98765 43210</a>
              </li>
              <li>
                <a href="mailto:hello@cosmicpark.com">hello@cosmicpark.com</a>
              </li>
              <li>Cosmic Park, Tamil Nadu, India</li>
            </ul>
          </div>
        </div>

        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} Cosmic Park. All rights reserved.</span>
          <span>
            <Link to="/policies">Privacy Policy</Link>
            <Link to="/policies">Terms &amp; Conditions</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
