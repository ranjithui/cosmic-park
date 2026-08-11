import { useEffect, useState } from 'react';
import { RESORT } from '../data/attractions.js';
import { route } from './routing.js';

// Resolve "how far is it, really" for a list of attractions, all measured
// from the resort. Returns a map of attraction id → distance state (see
// DISTANCE_STATES in routing.js). Nothing here ever fabricates a figure:
// a place with no verified coordinate resolves to 'unlocated', and a router
// that will not answer resolves to 'unavailable'.
//
// Requests go out two at a time. The public OSRM instance is a courtesy
// service and eight simultaneous calls from every page load is not courteous;
// two keeps the first cards populated within a moment anyway.
const CONCURRENCY = 2;

export default function useDistances(attractions) {
  const [distances, setDistances] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const initial = {};
    attractions.forEach((a) => {
      if (a.measured) initial[a.id] = { state: 'measured', ...a.measured };
      else if (!a.coords) initial[a.id] = { state: 'unlocated' };
      else initial[a.id] = { state: 'loading' };
    });
    setDistances(initial);

    const queue = attractions.filter((a) => a.coords && !a.measured);
    let next = 0;

    const worker = async () => {
      while (active && next < queue.length) {
        const a = queue[next++];
        let result = null;
        try {
          result = await route([RESORT, a.coords], controller.signal);
        } catch (err) {
          if (err.name === 'AbortError') return;
        }
        if (!active) return;
        setDistances((prev) => ({
          ...prev,
          [a.id]: result ? { state: 'ok', ...result } : { state: 'unavailable' },
        }));
      }
    };

    Promise.all(Array.from({ length: CONCURRENCY }, worker));

    return () => {
      active = false;
      controller.abort();
    };
    // The attraction list is a module constant, so this runs once.
  }, [attractions]);

  return distances;
}
