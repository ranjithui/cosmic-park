import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Media, Ph } from '../components/Placeholder.jsx';
import Footer from '../components/Footer.jsx';
import { today } from '../lib/format.js';

// The showcase card is a slider over all seven features; the grid beside it
// holds 02–07 and promotes any of them into the showcase on click.
// `src: null` means no photograph of that subject exists yet — those fall back
// to the labelled placeholder rather than borrowing an unrelated frame.
const FEATURES = [
  { n: '01', ic: 'pool', h: 'Private pool with a view', p: 'A swimming pool that looks out over mountain, garden and forest — yours alone for the stay.', src: '/gallery/outdoor-pool.jpg' },
  { n: '02', ic: 'lawn', h: 'Expansive lawn', p: 'Open lawn for outdoor relaxation and family gatherings, from morning chai to evening games.', src: '/gallery/outdoor-sitting.jpg' },
  { n: '03', ic: 'dine', h: 'Al fresco dining', p: 'Meals in the open air, with a complimentary breakfast overlooking the hills each morning.', src: '/gallery/balcony-view.jpg' },
  { n: '04', ic: 'fire', h: 'Bonfire evenings', p: 'Gather under open skies as the light fades — crackling fire, cool mountain air, and stars.', src: null },
  { n: '05', ic: 'racket', h: 'Room to play', p: 'Badminton, football and carrom keep every generation of the group busy through the day.', src: null },
  { n: '06', ic: 'spa', h: 'Spaces that bring people together', p: 'A bathtub to soak in, thoughtful corners to talk in, and an unhurried pace throughout.', src: '/gallery/bathtub.jpg' },
];

const SLIDE_MS = 5000;

const BEATS = [
  { ic: 'sun', h: 'Morning calm', p: 'Watch the hills wake up with a cup of chai by the lawn, or a dip in your private pool.' },
  { ic: 'users', h: 'Midday together', p: 'Long lunches, laughter and lazy hours in shaded spaces.' },
  { ic: 'run', h: 'Afternoon play', p: 'Games on the lawn, carrom indoors and time well spent.' },
  { ic: 'fire', h: 'Firelight nights', p: 'Bonfires, stars and stories that last long after.' },
];

const STATS = [
  { b: '8', s: 'Bedrooms' },
  { b: '16', s: 'Guests' },
  { b: '11+', s: 'Experiences' },
];

// One frame from each side of the stay — water, indoors, a bedroom, the view.
const STRIP = [
  { section: 'gallery', src: '/gallery/indoor-pool.jpg', label: 'Indoor pool' },
  { section: 'amenity_dining', src: '/gallery/sitting-1.jpg', label: 'Sitting area' },
  { section: 'amenity_bedroom', src: '/gallery/bedroom-1.jpg', label: 'One of eight bedrooms' },
  { section: 'amenity_view', src: '/gallery/balcony-view.jpg', label: 'Balcony over the hills' },
];

// A date input cannot show a text placeholder, so it starts as type=text and
// swaps on focus — that is what keeps "Add dates" visible until a date is set.
function DateField({ id, label, value, min, onChange }) {
  const [type, setType] = useState('text');
  return (
    <div className="hs-field">
      <label htmlFor={id}>{label}</label>
      <div className="hs-control">
        <input
          id={id}
          type={type}
          placeholder="Add dates"
          min={min}
          value={value}
          onFocus={() => setType('date')}
          onBlur={(e) => !e.target.value && setType('text')}
          onChange={onChange}
        />
        <Icon name="cal" />
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const heroVideo = useRef(null);
  // Autoplaying background motion is exactly what this setting asks us not to
  // do; without autoplay the element still paints its first frame as a still.
  const [reduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  // React can drop the `muted` attribute on the initial render, and a video that
  // is not muted at the moment autoplay fires is blocked by every browser.
  useEffect(() => {
    if (heroVideo.current) heroVideo.current.muted = true;
  }, []);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('16');
  const [rooms, setRooms] = useState('8');
  const [feature, setFeature] = useState(0); // which feature the showcase card shows
  const [paused, setPaused] = useState(false);
  // Auto-advance. `feature` is a dependency so picking a card by hand restarts
  // the clock rather than jumping again a moment later; reduced motion and
  // pointer/keyboard focus both stop it outright.
  useEffect(() => {
    if (paused || reduceMotion) return undefined;
    const id = setInterval(() => setFeature((n) => (n + 1) % FEATURES.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [paused, reduceMotion, feature]);

  const search = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests);
    navigate(`/book${params.toString() ? '?' + params.toString() : ''}`);
  };

  return (
    <>
      {/* HERO */}
      <div className="hero">
        <video
          ref={heroVideo}
          className="hero-video"
          src="/cosmic_video.mp4"
          autoPlay={!reduceMotion}
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className="hero-overlay">
          <div className="hero-content">
            <p className="eyebrow">A private 8-bedroom hillside villa</p>
            <h1>Wake up to the sights and sounds of nature.</h1>
            <p className="lede">
              The intimacy of a home with the amenities of a resort — a private pool, open lawns and
              forest views, without sharing the property with strangers.
            </p>
            {/* No availability CTA here — the search bar directly below the hero
                is the booking entry point for this page. */}
            <div className="hero-cta">
              <button
                className="btn btn-outline btn-lg"
                onClick={() => document.getElementById('villa')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore the villa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AVAILABILITY QUICK BAR — floats over the foot of the hero */}
      <div className="wrap">
        <form className="hsearch" onSubmit={search}>
          <DateField
            id="h-in"
            label="Check-in"
            value={checkIn}
            min={today()}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (checkOut && checkOut <= e.target.value) setCheckOut('');
            }}
          />
          <DateField
            id="h-out"
            label="Check-out"
            value={checkOut}
            min={checkIn || today()}
            onChange={(e) => setCheckOut(e.target.value)}
          />
          <div className="hs-field">
            <label htmlFor="h-guests">Guests</label>
            <div className="hs-control">
              <select id="h-guests" value={guests} onChange={(e) => setGuests(e.target.value)}>
                <option value="8">8 Guests</option>
                <option value="12">12 Guests</option>
                <option value="16">16 Guests</option>
                <option value="20">16+ Guests</option>
              </select>
              <Icon name="users" />
            </div>
          </div>
          <div className="hs-field">
            <label htmlFor="h-rooms">Bedrooms</label>
            <div className="hs-control">
              <select id="h-rooms" value={rooms} onChange={(e) => setRooms(e.target.value)}>
                <option value="4">4 Rooms</option>
                <option value="6">6 Rooms</option>
                <option value="8">8 Rooms (all)</option>
              </select>
              <Icon name="bed" />
            </div>
          </div>
          <button className="btn btn-primary hs-go" type="submit">
            Check Availability
          </button>
        </form>
      </div>

      {/* SIGNATURE FEATURES */}
      <section id="experiences">
        <div className="wrap">
          <div className="section-head split">
            <div>
              <p className="eyebrow">What makes it Cosmic Park</p>
              <h2>
                An experience,
                <br />
                not just a place to sleep
              </h2>
            </div>
            <p>
              Cosmic Park is more than a stay — it's a private retreat where every space is designed
              to help you slow down and reconnect.
            </p>
          </div>

          <div
            className="bento"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <article className="bento-lead">
              {/* All slides are mounted and cross-faded by opacity, so switching
                  never shows an empty frame while a file downloads. */}
              <div className="bento-slides">
                {FEATURES.map((f, i) =>
                  f.src ? (
                    <img
                      key={f.n}
                      className={'bento-slide' + (i === feature ? ' on' : '')}
                      src={f.src}
                      alt={f.h}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <Ph key={f.n} className={'bento-slide' + (i === feature ? ' on' : '')} tag="Photo" label={f.h} />
                  )
                )}
              </div>
              <div className="bento-lead-body">
                <span className="n">{FEATURES[feature].n}</span>
                <h3>{FEATURES[feature].h}</h3>
                <p>{FEATURES[feature].p}</p>
                <div className="bento-nav">
                  <div className="dots" role="tablist" aria-label="Signature features">
                    {FEATURES.map((f, i) => (
                      <button
                        key={f.n}
                        type="button"
                        role="tab"
                        className={i === feature ? 'on' : ''}
                        aria-selected={i === feature}
                        aria-label={f.h}
                        onClick={() => setFeature(i)}
                      />
                    ))}
                  </div>
                  <button
                    className="round-btn"
                    aria-label="Next feature"
                    onClick={() => setFeature((n) => (n + 1) % FEATURES.length)}
                  >
                    <Icon name="arrow" />
                  </button>
                </div>
              </div>
            </article>

            {/* Six features into a 3×2 grid — every card has a tile, and the
                showcase slides through the same set. */}
            <div className="bento-grid">
              {FEATURES.map((f, i) => (
                <article className={'tile' + (i === feature ? ' on' : '')} key={f.n}>
                  <div className="tile-top">
                    <Icon name={f.ic} />
                    <span className="n">{f.n}</span>
                  </div>
                  <h3>{f.h}</h3>
                  <p>{f.p}</p>
                  <button className="round-btn sm" aria-label={`Show ${f.h}`} onClick={() => setFeature(i)}>
                    <Icon name="arrow" />
                  </button>
                </article>
              ))}
            </div>
          </div>

          {/* The tiles now drive the slider rather than linking out, so this is
              the section's route to the full gallery. */}
          <div className="section-more">
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/gallery')}>
              Explore more <Icon name="arrow" />
            </button>
          </div>
        </div>
      </section>

      {/* DAY ITINERARY */}
      <section className="day">
        <div className="wrap day-inner">
          <div className="day-head">
            <p className="eyebrow">A day at Cosmic Park</p>
            <h2>
              From first light
              <br />
              to firelight
            </h2>
            <p>Spaces and experiences that flow with your day.</p>
            <button className="btn btn-outline" onClick={() => navigate('/gallery')}>
              Explore Experiences <Icon name="arrow" />
            </button>
          </div>

          <ol className="rail">
            {BEATS.map((b) => (
              <li key={b.h}>
                <span className="rail-ic">
                  <Icon name={b.ic} />
                </span>
                <h4>{b.h}</h4>
                <p>{b.p}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* THE VILLA — stat card + photo strip */}
      <section id="villa">
        <div className="wrap">
          <div className="strip">
            <div className="stat-card">
              <h2>
                One house.
                <br />
                Eight bedrooms.
                <br />
                Your group, only.
              </h2>
              <div className="stat-row">
                {STATS.map((s) => (
                  <div className="stat" key={s.s}>
                    <b>{s.b}</b>
                    <span>{s.s}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost" onClick={() => navigate('/book')}>
                Explore the Villa <Icon name="arrow" />
              </button>
            </div>
            {STRIP.map((m) => (
              <Media key={m.src} className="strip-img" section={m.section} src={m.src} tag="Photo" label={m.label} />
            ))}
          </div>

          {/* AREA GUIDE, then LOCATION — full-width bands, one per row. The
              media sides alternate so the two do not read as a repeat. */}
          <div className="duo" id="location">
            <article className="duo-card reverse">
              <div className="duo-body">
                <h3>
                  Hills, waterfalls &amp;
                  <br />
                  scenic drives await
                </h3>
                <p>
                  Eight places within reach of the gate — hill viewpoints, a river, a rainforest park and a stepped
                  hill temple — each with the drive measured by road from here.
                </p>
                <button className="btn btn-ghost btn-lg" onClick={() => navigate('/local-guide')}>
                  Local Guide <Icon name="arrow" />
                </button>
              </div>
              <div className="duo-media">
                <Media section="area_guide" src="/gallery/drone.jpg" tag="Photo" label="Hills and forest around Anaikatti" />
              </div>
            </article>

            <article className="duo-card">
              {/* Pinned at 11.124754, 76.747696 — OpenStreetMap embed needs no API key. */}
              <div className="duo-media">
                <iframe
                  className="map-embed"
                  title="Cosmic Park location — Anaikatti, Coimbatore"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=76.739696%2C11.116754%2C76.755696%2C11.132754&layer=mapnik&marker=11.124754%2C76.747696"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                {/* The iframe is taller than its frame so OSM's own footer bar is
                    clipped; ODbL attribution is still required, so we carry it here. */}
                <a className="map-attr" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                  © OpenStreetMap
                </a>
              </div>
              <div className="duo-body">
                <h3>
                  Tucked away,
                  <br />
                  yet close to everything
                </h3>
                <p>Surrounded by nature. Connected to what matters.</p>
                <a
                  className="btn btn-ghost btn-lg"
                  href="https://www.google.com/maps/search/?api=1&query=11.124754%2C76.747696"
                  target="_blank"
                  rel="noreferrer"
                >
                  View on Map <Icon name="arrow" />
                </a>
              </div>
            </article>
          </div>

          {/* CTA BAND */}
          <div className="cta-band" id="rates">
            <span className="cta-ic" aria-hidden="true">
              <Icon name="users" />
            </span>
            <div>
              <h2>Gather everyone. Book the whole villa.</h2>
              <p>Private. Spacious. Yours for the stay.</p>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/book')}>
                Book Your Stay <Icon name="arrow" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div id="policies" />
      <Footer />
    </>
  );
}
