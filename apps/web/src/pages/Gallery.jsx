import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Footer from '../components/Footer.jsx';
import { PHOTOS, PHOTO_FILTERS } from '../lib/photos.js';

export default function Gallery() {
  const [filter, setFilter] = useState('all');
  const tiles = filter === 'all' ? PHOTOS : PHOTOS.filter((t) => t.cat === filter);

  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title="A look around Cosmic Park"
        sub={`Every room and shared space, photographed on the property — ${PHOTOS.length} frames across the eight bedrooms, the pools, the living spaces and the views.`}
      />
      <div className="wrap page-body">
        <div className="gallery-filters" role="group" aria-label="Filter gallery">
          {PHOTO_FILTERS.map((f) => (
            <button
              key={f.id}
              className={filter === f.id ? 'on' : ''}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="gallery-grid">
          {tiles.map((t, i) => (
            <div key={t.src} className={'ph shot ' + (t.span || '')}>
              <img
                className="media-img"
                src={t.src}
                alt={t.label}
                /* the first screenful is worth fetching eagerly; the rest of the
                   40 frames wait until they are scrolled near */
                loading={i < 6 ? 'eager' : 'lazy'}
                decoding="async"
              />
              <span className="shot-cap">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
