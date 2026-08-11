import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Media } from '../components/Placeholder.jsx';
import Footer from '../components/Footer.jsx';
import GuideMap from '../components/guide/GuideMap.jsx';
import useDistances from '../lib/useDistances.js';
import { formatKm, formatMin, route } from '../lib/routing.js';
import {
  ATTRACTIONS,
  CATEGORIES,
  DAY_TRIPS,
  EXPERIENCES,
  INTERESTS,
  RESORT,
  RESPONSIBLE,
  TIME_SLOTS,
  byId,
} from '../data/attractions.js';

// ============================================================
// Explore Near Cosmic Park Resort — the local guide.
//
// The page holds three pieces of state and everything else is derived:
//   category   which experience filter is active (drives map AND cards)
//   selected   which attraction is open in the split-screen detail panel
//   plan       the guest's answers in "Plan Your Day"
//
// No distance, drive time or opening hour is written into this file. Facts
// live in data/attractions.js; road figures are measured at runtime by
// lib/routing.js. Where a fact could not be verified the page says so out
// loud rather than filling the gap with something plausible.
// ============================================================

const RESORT_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${RESORT.lat}%2C${RESORT.lng}`;

// ------------------------------------------------------------
// Small shared pieces
// ------------------------------------------------------------

// The one place a distance is turned into words. Every state of "we don't
// know" gets its own sentence, so a blank is never mistaken for zero.
function Distance({ d, compact }) {
  if (!d || d.state === 'loading') {
    return <span className="dist loading">Measuring the drive…</span>;
  }
  // Deliberately not "location to be confirmed" — the note below the card
  // already says that, and saying it twice reads as a template rather than a
  // fact. This slot answers only "how far", so it says only that.
  if (d.state === 'unlocated') {
    return <span className="dist unknown">Distance not yet measured</span>;
  }
  if (d.state === 'unavailable') {
    return <span className="dist unknown">Distance unavailable right now</span>;
  }
  return (
    <span className="dist">
      <b>{formatKm(d.km)}</b>
      <span className="dot" aria-hidden="true">•</span>
      <b>{formatMin(d.min)}</b> drive
      {!compact && (
        <span className="dist-src">
          {d.state === 'measured' ? ' measured by the resort' : ' by road, from the resort'}
        </span>
      )}
    </span>
  );
}

// How much to trust the pin. Shown wherever a place appears on the map.
function PrecisionNote({ a }) {
  if (a.precision === 'exact') return null;
  if (a.precision === 'gateway') {
    return (
      <p className="precision">
        <Icon name="pin" /> Routed to {a.gatewayLabel}. The park interior is not reachable by private vehicle.
      </p>
    );
  }
  if (a.precision === 'approximate') {
    return (
      <p className="precision">
        <Icon name="pin" /> Approximate position — accurate to a few hundred metres. Confirm with us before you set out.
      </p>
    );
  }
  return (
    <p className="precision unverified">
      <Icon name="pin" /> Location details to be confirmed by the resort.
      {a.areaLabel && <> Known area: {a.areaLabel}.</>}
    </p>
  );
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// Seven rows of "09:10–17:30" is a wall of the same string. Runs of identical
// days collapse into "Monday–Friday", which is how anyone would actually say
// it, and leaves the exceptions — the closed day, the unconfirmed one —
// standing out as their own line.
function groupHours(hours) {
  if (hours.all) return [['Every day', hours.all]];
  const rows = [];
  DAY_ORDER.filter((d) => hours[d]).forEach((day) => {
    const last = rows[rows.length - 1];
    if (last && last.value === hours[day]) last.to = day;
    else rows.push({ from: day, to: null, value: hours[day] });
  });
  return rows.map((r) => [r.to ? `${cap(r.from)}–${cap(r.to)}` : cap(r.from), r.value]);
}

function Hours({ a }) {
  const rows = a.hours ? groupHours(a.hours) : null;
  return (
    <div className="hours">
      <h5>
        <Icon name="cal" /> Timings
      </h5>
      {rows ? (
        <ul>
          {rows.map(([d, v]) => (
            <li key={d} className={/closed/i.test(v) ? 'closed' : undefined}>
              <span>{d}</span>
              <b>{v}</b>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">Timings to be confirmed — please check before you travel.</p>
      )}
      {a.hoursNote && <p className="hours-note">{a.hoursNote}</p>}
    </div>
  );
}

// Three actions, and each one goes where its label promises.
//   Get Directions      → Google Maps, resort → destination
//   Open in Google Maps → the place itself, so the guest can read Google's
//                         own hours and reviews rather than take ours on trust
//   the named CTA       → us. Access permission, safari slots, whether the
//                         falls are running: those are questions for the front
//                         desk, and pretending a link can answer them would be
//                         the dishonest option.
const askUrl = (a) =>
  `https://wa.me/919876543210?text=${encodeURIComponent(
    `Hi Cosmic Park — I'm interested in visiting ${a.name}. Could you help me confirm access and timings?`
  )}`;

function Actions({ a, className = '' }) {
  return (
    <div className={'guide-actions ' + className}>
      <a className="btn btn-primary" href={a.directionsUrl} target="_blank" rel="noreferrer">
        Get Directions <Icon name="arrow" />
      </a>
      <a className="btn btn-ghost" href={a.mapsUrl} target="_blank" rel="noreferrer">
        Open in Google Maps
      </a>
      <a className="ask-link" href={askUrl(a)} target="_blank" rel="noreferrer">
        <Icon name="wa" /> {a.primaryCta} — ask the resort
      </a>
    </div>
  );
}

// ------------------------------------------------------------
// Section 2 — the split-screen map + list
// ------------------------------------------------------------
function MapExplorer({ places, selectedId, onSelect, distances, category, onClearCategory }) {
  const selected = places.find((p) => p.id === selectedId) || null;
  const activeCat = CATEGORIES.find((c) => c.id === category);

  return (
    <div className="gm-split">
      <div className="gm-list">
        <div className="gm-list-head">
          <p className="eyebrow">{places.length} places</p>
          <h3>Everything within reach</h3>
          {category !== 'all' && (
            <button type="button" className="g-chip-clear" onClick={onClearCategory}>
              Filtered by {activeCat?.label} <Icon name="close" />
            </button>
          )}
        </div>

        <ol className="gm-items">
          {places.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className={'gm-item' + (a.id === selectedId ? ' on' : '')}
                aria-pressed={a.id === selectedId}
                onClick={() => onSelect(a.id === selectedId ? null : a.id)}
              >
                <span className="gm-n">{a.n}</span>
                <span className="gm-item-body">
                  <b>{a.shortName}</b>
                  <span className="gm-kick">{a.kicker}</span>
                  <Distance d={distances[a.id]} compact />
                </span>
                <Icon name="arrow" />
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="gm-side">
        <GuideMap attractions={places} selectedId={selectedId} onSelect={onSelect} />

        {selected && (
          <div className="gm-detail">
            <button type="button" className="gm-detail-close" aria-label="Close details" onClick={() => onSelect(null)}>
              <Icon name="close" />
            </button>
            <p className="eyebrow">{selected.kicker}</p>
            <h4>{selected.name}</h4>
            <Distance d={distances[selected.id]} />
            <p className="gm-detail-copy">{selected.description}</p>
            <PrecisionNote a={selected} />
            {selected.hours?.all && (
              <p className="gm-detail-hours">
                <Icon name="cal" /> {selected.hours.all}
              </p>
            )}
            {selected.hours && !selected.hours.all && (
              <p className="gm-detail-hours">
                <Icon name="cal" /> Weekdays {selected.hours.monday}
                {selected.hours.sunday && ` · Sunday ${selected.hours.sunday}`}
              </p>
            )}
            {!selected.hours && <p className="gm-detail-hours muted">Timings to be confirmed before you travel.</p>}
            <div className="tag-row">
              {selected.tags.map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
            {selected.notice && (
              <p className="notice small">
                <Icon name="alert" /> {selected.notice}
              </p>
            )}
            <Actions a={selected} />
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Section 5 — the place cards
// ------------------------------------------------------------
function PlaceCard({ a, d, selected, onSelect }) {
  return (
    <article
      id={`place-${a.id}`}
      className={'place' + (selected ? ' on' : '') + (a.photoLed ? ' photo-led' : '')}
    >
      <div className="place-media">
        <Media
          section={a.mediaSection}
          tag="Photo"
          label={a.shortName}
          className="place-img"
        />
        <span className="place-n">{a.n}</span>
      </div>

      <div className="place-body">
        <p className="eyebrow">{a.kicker}</p>
        <h3>{a.name}</h3>
        <Distance d={d} />
        <p className="place-copy">{a.description}</p>

        {a.highlight && (
          <p className="place-highlight">
            <Icon name="check" /> {a.highlight}
          </p>
        )}
        {a.recommendation && (
          <p className="place-rec">
            <span>Recommended</span> {a.recommendation}
          </p>
        )}
        {a.contextNote && <p className="place-context muted small">{a.contextNote}</p>}

        <div className="tag-row">
          {a.tags.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>

        <PrecisionNote a={a} />
        <Hours a={a} />

        {a.notice && (
          <p className="notice">
            <Icon name="alert" /> {a.notice}
          </p>
        )}

        <Actions a={a} />
        {/* Only offered when there is actually a pin to jump to. */}
        {a.coords && (
          <button type="button" className="place-locate" onClick={() => onSelect(a.id)}>
            Show on the map above <Icon name="pin" />
          </button>
        )}
      </div>
    </article>
  );
}

// ------------------------------------------------------------
// Section 8 — the radial distance explorer
// ------------------------------------------------------------
function DistanceExplorer({ distances, onSelect }) {
  const n = ATTRACTIONS.length;
  return (
    <div className="radial-wrap">
      <div className="radial" role="list">
        <div className="radial-core">
          <Icon name="pin" />
          <b>Cosmic Park Resort</b>
          <span>{RESORT.area}</span>
        </div>
        {[1, 2].map((ring) => (
          <span key={ring} className={`radial-ring r${ring}`} aria-hidden="true" />
        ))}
        {ATTRACTIONS.map((a, i) => {
          // Evenly spaced around the circle, starting at the top.
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          const x = 50 + Math.cos(angle) * 39;
          const y = 50 + Math.sin(angle) * 39;
          const d = distances[a.id];
          return (
            <button
              type="button"
              role="listitem"
              key={a.id}
              className={'radial-node' + (d?.state === 'unlocated' ? ' unknown' : '')}
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => onSelect(a.id)}
            >
              <span className="radial-n">{a.n}</span>
              <span className="radial-name">{a.shortName}</span>
              <span className="radial-dist">
                {!d || d.state === 'loading'
                  ? 'measuring…'
                  : d.state === 'ok' || d.state === 'measured'
                    ? `${formatKm(d.km)} • ${formatMin(d.min)}`
                    : d.state === 'unlocated'
                      ? 'to be confirmed'
                      : 'unavailable'}
              </span>
            </button>
          );
        })}
      </div>

      {/* The ring is decorative on a phone; the same figures read better as a
          plain table, so that is what small screens get. */}
      <ul className="radial-list">
        {ATTRACTIONS.map((a) => {
          const d = distances[a.id];
          return (
            <li key={a.id}>
              <span className="radial-n">{a.n}</span>
              <b>{a.shortName}</b>
              <Distance d={d} compact />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------
// Section 7 — day trips, with a real total drive measured through the stops
// ------------------------------------------------------------
function DayTrip({ trip }) {
  const stops = trip.stops.map(byId).filter(Boolean);
  const locatable = stops.filter((s) => s.coords);
  const [total, setTotal] = useState({ state: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    if (locatable.length === 0) {
      setTotal({ state: 'unlocated' });
      return () => controller.abort();
    }
    // Resort → each locatable stop in order → back to the resort.
    route([RESORT, ...locatable.map((s) => s.coords), RESORT], controller.signal)
      .then((r) => setTotal(r ? { state: 'ok', ...r } : { state: 'unavailable' }))
      .catch((err) => {
        if (err.name !== 'AbortError') setTotal({ state: 'unavailable' });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id]);

  return (
    <article className="trip">
      <div className="trip-head">
        <span className="trip-len">{trip.length}</span>
        <h3>{trip.title}</h3>
        <p>{trip.blurb}</p>
      </div>

      <ol className="trip-route">
        <li className="anchor">
          <span className="trip-dot" aria-hidden="true" />
          Cosmic Park Resort
        </li>
        {stops.map((s) => (
          <li key={s.id}>
            <span className="trip-dot" aria-hidden="true" />
            <a href={`#place-${s.id}`}>{s.shortName}</a>
            {!s.coords && <span className="flag">location TBC</span>}
          </li>
        ))}
        <li className="anchor">
          <span className="trip-dot" aria-hidden="true" />
          Return to Cosmic Park Resort
        </li>
      </ol>

      <div className="trip-foot">
        <div className="trip-total">
          <span className="eyebrow">Driving, round trip</span>
          <b>
            {total.state === 'loading'
              ? 'Measuring…'
              : total.state === 'ok'
                ? `${formatKm(total.km)} • ${formatMin(total.min)}`
                : total.state === 'unlocated'
                  ? 'Available once stops are confirmed'
                  : 'Unavailable right now'}
          </b>
          {total.state === 'ok' && locatable.length < stops.length && (
            <span className="muted small">
              Covers the {locatable.length} of {stops.length} stops with a confirmed location. Time on foot and at each
              stop is extra.
            </span>
          )}
          {total.state === 'ok' && locatable.length === stops.length && (
            <span className="muted small">Driving only — time spent at each stop is extra.</span>
          )}
        </div>
        {trip.note && (
          <p className="notice small">
            <Icon name="alert" /> {trip.note}
          </p>
        )}
      </div>
    </article>
  );
}

// ------------------------------------------------------------
// Section 9 — Plan Your Day
//
// The rules the recommender must not break:
//   • never suggest a place on its weekly closing day
//   • never suggest a place outside the part of day it actually suits
//   • never suggest a place whose timings we could not verify without
//     saying so on the card itself
// ------------------------------------------------------------
function buildPlan(startSlot, interest, dayOfWeek, distances) {
  const order = TIME_SLOTS.map((t) => t.id);
  const slots = order.slice(order.indexOf(startSlot));

  const eligible = ATTRACTIONS.filter((a) => a.categories.includes(interest)).filter(
    (a) => a.closedDay !== dayOfWeek
  );

  const used = new Set();
  return slots.map((slot) => {
    const pick = eligible
      .filter((a) => !used.has(a.id) && a.bestTime.includes(slot))
      // Nearest first — an afternoon slot should not send anyone 60 km out.
      .sort((x, y) => {
        const dx = distances[x.id];
        const dy = distances[y.id];
        const kx = dx?.km ?? Infinity;
        const ky = dy?.km ?? Infinity;
        return kx - ky;
      })[0];
    if (pick) used.add(pick.id);
    return { slot, pick };
  });
}

function Planner({ distances, onSelect }) {
  const [slot, setSlot] = useState('morning');
  const [interest, setInterest] = useState('nature');
  const today = new Date().getDay();
  const plan = useMemo(() => buildPlan(slot, interest, today, distances), [slot, interest, today, distances]);
  const closedToday = ATTRACTIONS.filter((a) => a.closedDay === today);

  return (
    <div className="planner">
      <div className="planner-controls">
        <fieldset>
          <legend>
            <span className="g-step">Step 1</span> When are you starting?
          </legend>
          <div className="g-opt-row">
            {TIME_SLOTS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={'g-opt' + (slot === t.id ? ' on' : '')}
                aria-pressed={slot === t.id}
                onClick={() => setSlot(t.id)}
              >
                <Icon name={t.icon} />
                <b>{t.label}</b>
                <span>{t.sub}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <span className="g-step">Step 2</span> What are you in the mood for?
          </legend>
          <div className="g-opt-row wrap">
            {INTERESTS.map((i) => (
              <button
                key={i.id}
                type="button"
                className={'g-chip' + (interest === i.id ? ' on' : '')}
                aria-pressed={interest === i.id}
                onClick={() => setInterest(i.id)}
              >
                {i.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="planner-out">
        <p className="eyebrow">Your day, roughly</p>
        {closedToday.length > 0 && (
          <p className="planner-closed">
            <Icon name="cal" /> Closed today: {closedToday.map((a) => a.shortName).join(', ')} — left out of this plan.
          </p>
        )}
        <ol className="planner-steps">
          {plan.map(({ slot: s, pick }) => {
            const meta = TIME_SLOTS.find((t) => t.id === s);
            return (
              <li key={s}>
                <span className="planner-when">{meta.label}</span>
                {pick ? (
                  <div className="planner-pick">
                    <button type="button" className="linkish" onClick={() => onSelect(pick.id)}>
                      {pick.shortName}
                    </button>
                    <span className="muted small">
                      {pick.duration} · <Distance d={distances[pick.id]} compact />
                    </span>
                    {!pick.hours && (
                      <span className="flag">timings to confirm</span>
                    )}
                  </div>
                ) : (
                  <div className="planner-pick empty">
                    <span className="muted">
                      Nothing in that interest suits this part of the day — an evening back at the resort is the honest
                      answer.
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <p className="planner-foot muted small">
          Built from the timings and closures we have been able to verify, and from live road distances. Please confirm
          on the day — hill roads, weather and forest rules all change faster than any page.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// The page
// ============================================================
export default function LocalGuide() {
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);

  const distances = useDistances(ATTRACTIONS);

  const places = useMemo(
    () => (category === 'all' ? ATTRACTIONS : ATTRACTIONS.filter((a) => a.categories.includes(category))),
    [category]
  );

  // Selecting from anywhere on the page brings the map into view and opens
  // that place's detail panel — the map is the spine of the guide.
  const selectAndReveal = useCallback((id) => {
    setSelected(id);
    setCategory((c) => {
      const a = byId(id);
      return a && c !== 'all' && !a.categories.includes(c) ? 'all' : c;
    });
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // A place filtered out from under the selection should not stay selected.
  useEffect(() => {
    if (selected && !places.some((p) => p.id === selected)) setSelected(null);
  }, [places, selected]);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      {/* ---------- HERO ---------- */}
      <div className="guide-hero">
        <Media
          section="guide_hero"
          src="/gallery/drone.jpg"
          tag="Photo"
          label="The hills and forest around Anaikatti"
          className="guide-hero-media"
        />
        <div className="guide-hero-overlay">
          <div className="wrap guide-hero-inner">
            <p className="eyebrow">Cosmic Local Guide</p>
            <h1>Explore Anaikatti Beyond the Resort</h1>
            <p className="lede">
              Nature, hills, rivers, waterfalls and hidden experiences — all within reach from Cosmic Park Resort.
            </p>
            <div className="hero-cta">
              <button className="btn btn-primary btn-lg" onClick={() => scrollTo('guide-map')}>
                Explore Places <Icon name="arrow" />
              </button>
              <a className="btn btn-outline btn-lg" href={RESORT_MAPS_URL} target="_blank" rel="noreferrer">
                Open Resort Location
              </a>
            </div>
            <p className="guide-hero-loc">
              <Icon name="pin" /> <b>Cosmic Park Resort</b> <span>{RESORT.area}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ---------- INTERACTIVE LOCAL MAP ---------- */}
      <section id="guide-map" ref={mapRef}>
        <div className="wrap">
          <div className="section-head split">
            <div>
              <p className="eyebrow">Your gateway to the wild beauty of Anaikatti</p>
              <h2>
                Eight places,
                <br />
                one starting point
              </h2>
            </div>
            <p>
              Every distance below is measured by road from the resort gate, not estimated. Pick a place on the list or
              a marker on the map to see the drive.
            </p>
          </div>

          <MapExplorer
            places={places}
            selectedId={selected}
            onSelect={setSelected}
            distances={distances}
            category={category}
            onClearCategory={() => setCategory('all')}
          />
        </div>
      </section>

      {/* ---------- THE ANAIKATTI EXPERIENCE ---------- */}
      <section className="anaikatti">
        <div className="wrap">
          <div className="editorial">
            <div className="editorial-lead">
              <Media
                section="guide_editorial_lead"
                src="/gallery/cover-aerial-dusk.jpg"
                tag="Photo"
                label="The Western Ghats at dusk, seen from above the resort"
                className="ed-img tall"
              />
            </div>
            <div className="editorial-copy">
              <p className="eyebrow">The Anaikatti Experience</p>
              <h2>
                Where the road starts
                <br />
                to feel like an escape
              </h2>
              <p>
                Anaikatti is where the road from Coimbatore begins to feel like an escape into the Western Ghats. From
                peaceful rivers and forest landscapes to hill viewpoints, temples, botanical gardens and waterfalls,
                Cosmic Park Resort places you close to some of the region's most memorable experiences.
              </p>
              <p className="muted">
                Most of what follows is within an hour of the gate. Some of it — Silent Valley, the Attappadi
                waterfalls — asks for a full day and an early start. All of it is better with the timings checked the
                morning you go.
              </p>
            </div>
            <div className="editorial-support">
              <Media
                section="guide_editorial_a"
                src="/gallery/rock-pool.jpg"
                tag="Photo"
                label="Water and rock in the hills near the resort"
                className="ed-img"
              />
              <Media
                section="guide_editorial_b"
                src="/gallery/balcony-view.jpg"
                tag="Photo"
                label="The hills, from the resort balcony"
                className="ed-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FILTERS + FEATURED PLACES ---------- */}
      <section id="places">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Featured places</p>
            <h2>Filter by the kind of day you want</h2>
            <p>Choosing a category filters the cards below and the markers on the map above at the same time.</p>
          </div>

          <div className="filter-row" role="group" aria-label="Filter places by experience">
            {CATEGORIES.map((c) => {
              const count =
                c.id === 'all' ? ATTRACTIONS.length : ATTRACTIONS.filter((a) => a.categories.includes(c.id)).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={'g-chip' + (category === c.id ? ' on' : '')}
                  aria-pressed={category === c.id}
                  disabled={count === 0}
                  onClick={() => setCategory(c.id)}
                >
                  <Icon name={c.icon} />
                  {c.label}
                  <span className="g-chip-n">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="places">
            {places.map((a) => (
              <PlaceCard
                key={a.id}
                a={a}
                d={distances[a.id]}
                selected={a.id === selected}
                onSelect={selectAndReveal}
              />
            ))}
          </div>

          {places.length === 0 && (
            <p className="center-state muted">Nothing in that category yet — try another filter.</p>
          )}
        </div>
      </section>

      {/* ---------- CHOOSE YOUR EXPERIENCE ---------- */}
      <section className="day">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Choose your experience</p>
            <h2>What kind of day are you looking for?</h2>
            <p>Each tile pulls the matching places to the top of the guide.</p>
          </div>

          <div className="exp-grid">
            {EXPERIENCES.map((e) => (
              <button
                key={e.id}
                type="button"
                className="exp-tile"
                onClick={() => {
                  const first = e.places.map(byId).find(Boolean);
                  setCategory('all');
                  if (first) selectAndReveal(first.id);
                }}
              >
                <span className="exp-ic">
                  <Icon name={e.icon} />
                </span>
                <h3>{e.title}</h3>
                <p>{e.blurb}</p>
                <span className="exp-places">
                  {e.places
                    .map(byId)
                    .filter(Boolean)
                    .map((p) => p.shortName)
                    .join(' · ')}
                </span>
                <span className="exp-go">
                  Show these <Icon name="arrow" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- SUGGESTED DAY TRIPS ---------- */}
      <section id="day-trips">
        <div className="wrap">
          <div className="section-head split">
            <div>
              <p className="eyebrow">Suggested day trips</p>
              <h2>
                Three routes,
                <br />
                measured end to end
              </h2>
            </div>
            <p>
              Round-trip driving time is routed through the stops in order, starting and finishing at the resort. Time
              spent at each place is on top of that.
            </p>
          </div>

          <div className="trips">
            {DAY_TRIPS.map((t) => (
              <DayTrip key={t.id} trip={t} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- DISTANCE EXPLORER ---------- */}
      <section className="explorer">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Distance explorer</p>
            <h2>How far is your next adventure?</h2>
            <p>Live road distances from the resort gate. Nothing here is an estimate typed in by hand.</p>
          </div>
          <DistanceExplorer distances={distances} onSelect={selectAndReveal} />
        </div>
      </section>

      {/* ---------- PLAN YOUR DAY ---------- */}
      <section id="plan">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Plan your day</p>
            <h2>Tell us when and what, and we'll shape the day</h2>
            <p>
              Recommendations respect opening hours, weekly closures, travel time from the resort and how long each
              place deserves.
            </p>
          </div>
          <Planner distances={distances} onSelect={selectAndReveal} />
        </div>
      </section>

      {/* ---------- TRAVEL RESPONSIBLY ---------- */}
      <section className="responsibly">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Before you go</p>
            <h2>Travel responsibly</h2>
            <p>These hills are a working forest and a home to people and wildlife long before they were a view.</p>
          </div>
          <ul className="resp-grid">
            {RESPONSIBLE.map((r) => (
              <li key={r}>
                <Icon name="leaf" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- RESORT CTA ---------- */}
      <div className="guide-cta">
        <Media
          section="guide_cta"
          src="/gallery/outdoor-pool.jpg"
          tag="Photo"
          label="The pool at Cosmic Park Resort, looking out over the hills"
          className="guide-cta-media"
        />
        <div className="guide-cta-overlay">
          <div className="wrap guide-cta-inner">
            <h2>
              Stay close to nature.
              <br />
              Explore beyond the ordinary.
            </h2>
            <p>
              After a day of hills, rivers, forests and waterfalls, return to the comfort of Cosmic Park Resort.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" to="/book">
                Book Your Stay <Icon name="arrow" />
              </Link>
              <Link className="btn btn-outline btn-lg" to="/#villa">
                Explore the Resort
              </Link>
              <a className="btn btn-outline btn-lg" href="tel:+919876543210">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
