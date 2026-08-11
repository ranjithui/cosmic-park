import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RESORT } from '../../data/attractions.js';

// ============================================================
// The interactive local map.
//
// Leaflet over CARTO's muted "Voyager" basemap — the standard OSM raster
// style is far too saturated to sit inside an editorial page, and CARTO's is
// free for this kind of use with attribution. No API key, no account.
//
// Markers are divIcons (HTML, styled in global.css) rather than Leaflet's
// default pin images: it keeps the numbering, the gold resort marker and the
// dimmed-when-filtered state all in CSS, and sidesteps Leaflet's well-known
// broken-image-path problem under a bundler.
//
// Only attractions with a verified coordinate get a pin. The ones without are
// counted in a footnote instead of being dropped somewhere plausible.
// ============================================================

const TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const resortIcon = () =>
  L.divIcon({
    className: 'gm-icon-wrap',
    html: '<span class="gm-pin gm-pin-resort"><span class="gm-pin-dot"></span></span><span class="gm-pin-label">Cosmic Park Resort</span>',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const placeIcon = (a, selected) =>
  L.divIcon({
    className: 'gm-icon-wrap',
    html:
      `<span class="gm-pin gm-pin-place${selected ? ' on' : ''}${
        a.precision === 'approximate' || a.precision === 'gateway' ? ' approx' : ''
      }">${a.n}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

export default function GuideMap({ attractions, selectedId, onSelect }) {
  const holder = useRef(null);
  const map = useRef(null);
  const markers = useRef(new Map());

  // --- create once -------------------------------------------------------
  useEffect(() => {
    if (map.current || !holder.current) return undefined;
    const m = L.map(holder.current, {
      center: [RESORT.lat, RESORT.lng],
      zoom: 11,
      scrollWheelZoom: false, // a map that eats the page scroll is a nuisance
      attributionControl: true,
    });
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(m);
    L.marker([RESORT.lat, RESORT.lng], { icon: resortIcon(), zIndexOffset: 1000 })
      .addTo(m)
      .bindTooltip('Cosmic Park Resort — your starting point', { direction: 'top', offset: [0, -14] });
    // Wheel zoom only once the guest has clicked into the map.
    m.on('click', () => m.scrollWheelZoom.enable());
    m.on('mouseout', () => m.scrollWheelZoom.disable());
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      markers.current.clear();
    };
  }, []);

  // --- sync markers to the filtered list ---------------------------------
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const wanted = new Set(attractions.filter((a) => a.coords).map((a) => a.id));

    markers.current.forEach((marker, id) => {
      if (!wanted.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    });

    attractions
      .filter((a) => a.coords)
      .forEach((a) => {
        let marker = markers.current.get(a.id);
        if (!marker) {
          marker = L.marker([a.coords.lat, a.coords.lng], { icon: placeIcon(a, a.id === selectedId) })
            .addTo(m)
            .bindTooltip(a.shortName, { direction: 'top', offset: [0, -16] })
            .on('click', () => onSelect(a.id));
          markers.current.set(a.id, marker);
        } else {
          marker.setIcon(placeIcon(a, a.id === selectedId));
        }
      });

    // Frame the resort plus whatever is on screen, so filtering to a single
    // far-off place does not leave the guest looking at empty forest.
    const points = [[RESORT.lat, RESORT.lng], ...attractions.filter((a) => a.coords).map((a) => [a.coords.lat, a.coords.lng])];
    if (points.length > 1 && !selectedId) {
      m.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 13 });
    }
  }, [attractions, selectedId, onSelect]);

  // --- fly to the selected place -----------------------------------------
  useEffect(() => {
    const m = map.current;
    if (!m || !selectedId) return;
    const a = attractions.find((x) => x.id === selectedId);
    if (!a?.coords) return;
    m.flyToBounds(L.latLngBounds([[RESORT.lat, RESORT.lng], [a.coords.lat, a.coords.lng]]), {
      padding: [60, 60],
      maxZoom: 14,
      duration: 0.8,
    });
    markers.current.get(a.id)?.openTooltip();
  }, [selectedId, attractions]);

  const unpinned = attractions.filter((a) => !a.coords).length;

  return (
    <div className="gm">
      <div className="gm-canvas" ref={holder} role="application" aria-label="Map of places to explore near Cosmic Park Resort" />
      <div className="gm-legend">
        <span className="gm-key">
          <i className="gm-swatch resort" aria-hidden="true" /> Cosmic Park Resort
        </span>
        <span className="gm-key">
          <i className="gm-swatch verified" aria-hidden="true" /> Verified location
        </span>
        <span className="gm-key">
          <i className="gm-swatch approx" aria-hidden="true" /> Approximate / gateway point
        </span>
        {unpinned > 0 && (
          <span className="gm-key muted">
            {unpinned} {unpinned === 1 ? 'place is' : 'places are'} not pinned — location to be confirmed by the resort
          </span>
        )}
      </div>
    </div>
  );
}
