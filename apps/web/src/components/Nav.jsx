import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';

// Split either side of the centre emblem. Left carries the "what it is" pages,
// right carries the "what it costs / where it is" pages so the Book button
// finishes that side.
// 2 / 3 rather than 3 / 2: without the Book button on the right, that split is
// what keeps the two halves close to the same width either side of the emblem.
const LEFT_LINKS = [
  { label: 'The Villa', to: '/#villa' },
  { label: 'Experiences', to: '/#experiences' },
];
const RIGHT_LINKS = [
  { label: 'Gallery', to: '/gallery' },
  { label: 'Rates', to: '/book' },
  { label: 'Location', to: '/#location' },
];
const LINKS = [...LEFT_LINKS, ...RIGHT_LINKS];

// secondary pages — footer on desktop, folded into the mobile menu
const MORE_LINKS = [
  { label: 'Our Story', to: '/story' },
  { label: 'Policies', to: '/policies' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Manage my booking', to: '/manage' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // close the mobile menu whenever the route changes
  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  const goHash = (to) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <nav className="nav-links nav-links-left" aria-label="Primary">
          {LEFT_LINKS.map((l) => (
            <Link key={l.label} to={l.to}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* The emblem is a dense circular illustration — at nav-bar height it reads
            as a smudge. It gets its own disc that overhangs the bar instead, so the
            art can be large enough to read without stretching the 70px bar. The
            wordmark under it is live gold type rather than the lockup's baked-in
            lettering, which turns to mush at any size a nav badge can carry. */}
        <button className="brand-badge" onClick={() => navigate('/')} aria-label="Cosmic Park Resort — home">
          <span className="mark" aria-hidden="true" />
          <span className="badge-word" aria-hidden="true">
            <b>Cosmic Park</b>
            <i>Resort</i>
          </span>
        </button>

        {/* No Book button here — the availability form sits on this same page and
            "Rates" already reaches /book. */}
        <nav className="nav-links nav-links-right" aria-label="Gallery, rates and location">
          {RIGHT_LINKS.map((l) => (
            <Link key={l.label} to={l.to}>
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          className="hamburger"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? 'close' : 'menu'} />
        </button>
      </div>

      {/* Mobile menu — the wireframe hid nav on mobile with no replacement;
          this restores navigation for small screens. */}
      <div className={'mobile-menu' + (open ? ' open' : '')}>
        <nav aria-label="Mobile">
          {LINKS.map((l) => (
            <a key={l.label} onClick={() => goHash(l.to)} role="button" tabIndex={0}>
              {l.label}
            </a>
          ))}
          {MORE_LINKS.map((l) => (
            <a key={l.label} onClick={() => goHash(l.to)} role="button" tabIndex={0}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
