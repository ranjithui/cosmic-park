import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Media } from '../components/Placeholder.jsx';
import Footer from '../components/Footer.jsx';

const VALUES = [
  { ic: 'leaf', h: 'Nature-led', p: 'Mountain, forest and open sky set the pace. The villa opens outward — to the pool, the lawn, the horizon — not inward to a lobby.' },
  { ic: 'users', h: 'Whole-villa privacy', p: 'One group at a time. No shared corridors, no strangers down the hall — just the people you came with.' },
  { ic: 'dine', h: 'Homely, not hotel', p: 'A home to settle into, with the amenities of a resort. Warm, unhurried, and a little indulgent.' },
];

export default function Story() {
  return (
    <>
      <div className="story-hero">
        <Media
          section="story_hero"
          src="/gallery/cover-aerial-dusk.jpg"
          tag="Photo"
          label="The villa and its setting — hills, forest, open lawn"
        />
      </div>

      <div className="wrap page-body">
        <div className="prose" style={{ margin: '0 auto', textAlign: 'left' }}>
          <p className="eyebrow">Our story</p>
          <h1 style={{ fontSize: 'clamp(2rem,4vw,2.9rem)', fontWeight: 400, marginBottom: '1rem' }}>
            A home in the hills, made for gathering.
          </h1>
          <p>
            Cosmic Park began with a simple idea: that the best trips aren’t spent checking in and out of a
            hotel, but settling into a home together. Eight bedrooms, a private pool, an open lawn and forest
            all around — held for one group at a time.
          </p>
          <p>
            Set in the quiet of Anaikatti, an easy drive from Coimbatore, it’s built for the people you bring
            with you. Reunions and long weekends, birthdays and offsites — the kind of stay where mornings
            start slow over breakfast in the open air and evenings end around a bonfire under the stars.
          </p>
          <p>
            We keep it curator-simple on purpose: no opulence for its own sake, no five-star gloss. Just a
            genuinely lovely home, the amenities of a resort, and the privacy to enjoy them entirely on your
            own terms.
          </p>
        </div>

        <div className="values" style={{ marginTop: 44 }}>
          {VALUES.map((v, i) => (
            <div className="value" key={i}>
              <div className="ic"><Icon name={v.ic} /></div>
              <h3>{v.h}</h3>
              <p>{v.p}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/book" className="btn btn-primary btn-lg">Plan your stay</Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
