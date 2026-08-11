// ============================================================
// Road distance + driving time, measured rather than guessed.
//
// The Local Guide spec is explicit that distances must never be invented or
// eyeballed, so nothing on the page carries a hard-coded kilometre figure.
// Every number comes from a real routing engine (OSRM, the public
// OpenStreetMap router — free and key-less) asked for a driving route that
// starts at the resort.
//
// When the router cannot be reached, we deliberately show nothing at all.
// A missing distance is honest; a made-up one is not.
//
// Two caveats we surface in the UI rather than hide:
//  • OSRM's durations come from road classification, so on Ghat roads they
//    read optimistically. The page labels the time as a routing estimate.
//  • A place with no verified coordinate cannot be routed to at all, and is
//    reported as 'unlocated' so the card can say so.
// ============================================================

const OSRM = 'https://router.project-osrm.org/route/v1/driving';
const CACHE_KEY = 'cp-routes-v1';

// One session-scoped cache so a guest flipping between filters, the planner
// and the distance explorer does not re-ask the router for the same leg.
const memory = new Map();

function loadCache() {
  if (memory.size) return;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) Object.entries(JSON.parse(raw)).forEach(([k, v]) => memory.set(k, v));
  } catch {
    /* private mode / disabled storage — the in-memory map still works */
  }
}

function saveCache() {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(memory)));
  } catch {
    /* nothing we can do, and nothing that should break the page */
  }
}

const key = (points) => points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(';');

/**
 * Drive a route through the given points (2 or more) and return
 * `{ km, min }`, or null if the router could not answer.
 */
export async function route(points, signal) {
  if (!Array.isArray(points) || points.length < 2 || points.some((p) => !p)) return null;
  loadCache();
  const k = key(points);
  if (memory.has(k)) return memory.get(k);

  const path = points.map((p) => `${p.lng},${p.lat}`).join(';');
  let res;
  try {
    res = await fetch(`${OSRM}/${path}?overview=false&alternatives=false`, { signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    return null;
  }
  if (!res.ok) return null;

  let data;
  try {
    data = await res.json();
  } catch {
    return null;
  }
  if (data?.code !== 'Ok' || !data.routes?.length) return null;

  const r = data.routes[0];
  const value = { km: r.distance / 1000, min: Math.round(r.duration / 60) };
  memory.set(k, value);
  saveCache();
  return value;
}

/** Format for display. Under 10 km we keep one decimal; beyond that it is noise. */
export const formatKm = (km) => (km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`);

export const formatMin = (min) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
};

/**
 * The state one attraction's distance can be in. Kept as an explicit union so
 * every consumer has to deal with "we don't know" rather than defaulting to 0.
 *   'loading'   — the router has been asked
 *   'ok'        — real road figures, `km` and `min` are set
 *   'measured'  — figures the resort measured itself, `km` and `min` are set
 *   'unlocated' — the place has no verified coordinate, so nothing to route to
 *   'unavailable' — the router could not be reached
 */
export const DISTANCE_STATES = ['loading', 'ok', 'measured', 'unlocated', 'unavailable'];
