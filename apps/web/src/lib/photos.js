// The real photography, copied from /Reduced into public/gallery with the
// filenames normalised. Single source of truth: the gallery renders all of it,
// and the home page picks individual frames out of it by name.

// Which lettered variants exist per bedroom — they are not uniform (3 has no
// base frame, 5–8 stop at b), so the set is listed rather than generated.
const BEDROOM_VARIANTS = {
  1: ['', 'a', 'b', 'c', 'd'],
  2: ['', 'a', 'b', 'c', 'd'],
  3: ['a', 'b', 'c'],
  4: ['', 'a', 'b', 'c', 'd'],
  5: ['', 'a', 'b'],
  6: ['', 'a', 'b'],
  7: ['', 'a', 'b'],
  8: ['', 'a', 'b'],
};

const BEDROOMS = Object.entries(BEDROOM_VARIANTS).flatMap(([n, variants]) =>
  variants.map((v) => ({
    src: `/gallery/bedroom-${n}${v}.jpg`,
    label: `Bedroom ${n}`,
    cat: 'rooms',
  }))
);

// Leading frames carry the span hints, so the grid opens with some rhythm
// rather than 40 identical squares.
const FEATURED = [
  { src: '/gallery/cover-aerial-dusk.jpg', label: 'The villa at dusk, from above', cat: 'views', span: 'wide' },
  { src: '/gallery/outdoor-pool.jpg', label: 'Outdoor pool over the valley', cat: 'pools', span: 'tall' },
  { src: '/gallery/drone.jpg', label: 'Hills and forest from the air', cat: 'views' },
  { src: '/gallery/indoor-pool.jpg', label: 'Indoor pool', cat: 'pools' },
  { src: '/gallery/balcony-view.jpg', label: 'Balcony table over the hills', cat: 'views', span: 'wide' },
  { src: '/gallery/rock-pool.jpg', label: 'Rock pool on the ridge', cat: 'pools' },
  { src: '/gallery/sitting-1.jpg', label: 'Sitting area', cat: 'living' },
  { src: '/gallery/outdoor-sitting.jpg', label: 'Outdoor sitting', cat: 'living', span: 'tall' },
  { src: '/gallery/sitting-2.jpg', label: 'Sitting area', cat: 'living' },
  { src: '/gallery/bathtub.jpg', label: 'Soaking bathtub', cat: 'rooms' },
];

export const PHOTOS = [...FEATURED, ...BEDROOMS];

export const PHOTO_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'rooms', label: 'Bedrooms' },
  { id: 'pools', label: 'Pools' },
  { id: 'living', label: 'Living spaces' },
  { id: 'views', label: 'Views' },
];

// Lookup by filename stem, so a page can ask for a specific frame.
export const photo = (name) => PHOTOS.find((p) => p.src === `/gallery/${name}.jpg`)?.src || '';
