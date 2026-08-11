// ============================================================
// Cosmic Park — Local Guide data
//
// Everything the Local Guide page renders comes from this file. The page
// itself hard-codes no place, distance or timing, so the resort can correct
// a fact here and have the map, the cards, the filters, the distance
// explorer and the day planner all follow.
//
// ------------------------------------------------------------
// THE HONESTY RULES THIS FILE FOLLOWS
// ------------------------------------------------------------
// 1. `coords` is only filled in when a coordinate could actually be traced
//    to a source. Where none could be, it stays null and the page shows
//    "Location details to be confirmed by the resort" instead of a pin.
// 2. `precision` says how much to trust the coordinate that IS there:
//      'exact'       — the place itself is mapped at this point
//      'gateway'     — the visitor entrance/gateway you actually drive to,
//                      not the centre of a very large protected area
//      'approximate' — a single third-party listing, good to a few hundred
//                      metres; the page labels it as approximate
//    No entry uses a coordinate we guessed from a description.
// 3. Distances and driving times are NOT stored here. They are computed at
//    runtime from real road routing (see lib/routing.js) starting at the
//    resort. If routing is unavailable the page says so rather than
//    printing a number.
//    The one exception: if the resort measures a drive itself, put it in
//    `measured` and it wins over routing and is labelled as resort-measured.
// 4. `hours` is only stated where sources agree. Where they conflict or are
//    unknown, `hoursNote` carries the caveat and `hours` stays null.
// 5. `notice` is a caveat the guest must see before travelling (access
//    permission, seasonal flow, water safety). It renders as a warning strip
//    on the card — it is never buried.
//
// Photography: each attraction names a `mediaSection`. The resort's admin
// dashboard can upload a photo against that section and it replaces the
// labelled placeholder on the public page. No stock photo is invented for a
// place we do not have a picture of.
// ============================================================

export const RESORT = {
  name: 'Cosmic Park Resort',
  area: 'Anaikatti • Coimbatore',
  lat: 11.124754,
  lng: 76.747696,
};

// Google Maps: a place we have coordinates for is pinned; a place we do not
// is handed to Google as a search string so Google resolves it against its
// own listing rather than us inventing a point.
const gmapsSearch = (a) =>
  a.coords
    ? `https://www.google.com/maps/search/?api=1&query=${a.coords.lat}%2C${a.coords.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.searchQuery)}`;

const gmapsDirections = (a) =>
  `https://www.google.com/maps/dir/?api=1&origin=${RESORT.lat}%2C${RESORT.lng}&destination=` +
  (a.coords ? `${a.coords.lat}%2C${a.coords.lng}` : encodeURIComponent(a.searchQuery)) +
  '&travelmode=driving';

// ------------------------------------------------------------
// Experience categories — drive both the filter chips and the map pins.
// ------------------------------------------------------------
export const CATEGORIES = [
  { id: 'all', label: 'All Places', icon: 'leaf' },
  { id: 'nature', label: 'Nature', icon: 'leaf' },
  { id: 'viewpoints', label: 'Viewpoints', icon: 'pin' },
  { id: 'waterfalls', label: 'Waterfalls', icon: 'pool' },
  { id: 'rivers', label: 'Rivers', icon: 'pool' },
  { id: 'spiritual', label: 'Spiritual', icon: 'spa' },
  { id: 'wildlife', label: 'Wildlife & Birds', icon: 'lawn' },
  { id: 'botanical', label: 'Botanical & Gardens', icon: 'lawn' },
  { id: 'photography', label: 'Photography', icon: 'sun' },
];

// ------------------------------------------------------------
// The eight destinations.
// ------------------------------------------------------------
export const ATTRACTIONS = [
  {
    id: 'sacon',
    n: '01',
    name: 'Sálim Ali Centre for Ornithology & Natural History',
    shortName: 'Sálim Ali Centre (SACON)',
    kicker: 'Birds • Nature • Research',
    categories: ['nature', 'wildlife', 'photography'],
    coords: { lat: 11.092713, lng: 76.786721 },
    precision: 'exact',
    source: 'OpenStreetMap — node 7538289733, tagged as a research institute',
    searchQuery: 'Salim Ali Centre for Ornithology and Natural History, Anaikatti, Coimbatore',
    hours: {
      monday: '09:10–17:30',
      tuesday: '09:10–17:30',
      wednesday: '09:10–17:30',
      thursday: '09:10–17:30',
      friday: '09:10–17:30',
      saturday: 'Verify before visiting',
      sunday: 'Closed',
    },
    hoursNote: 'Saturday opening is unconfirmed. Sunday is closed.',
    description:
      'Discover the world of birds, biodiversity and natural history at the Sálim Ali Centre for Ornithology and Natural History, set in Anaikatti at the foothills of the Nilgiri Biosphere Reserve.',
    tags: ['Bird Watching', 'Biodiversity', 'Nature & Research', 'Nature Photography'],
    notice:
      'SACON is a research and conservation institution, not a conventional tourist attraction. Visitor access may require prior permission — please confirm with the centre, or ask us to check for you, before you plan the trip.',
    primaryCta: 'Check Visitor Access',
    duration: '2–3 hrs',
    bestTime: ['morning'],
    mediaSection: 'guide_sacon',
  },
  {
    id: 'silent-valley',
    n: '02',
    name: 'Silent Valley National Park',
    shortName: 'Silent Valley National Park',
    kicker: 'Wildlife • Rainforest • Safari',
    categories: ['nature', 'wildlife', 'photography'],
    // The park itself is a very large protected area with no public road to
    // its interior. Mukkali is the Kerala Forest Department's visitor
    // gateway — the point you actually drive to — so that is what is pinned
    // and routed to, and the card says so.
    coords: { lat: 11.064427, lng: 76.540062 },
    precision: 'gateway',
    gatewayLabel: 'Mukkali — the Forest Department visitor gateway',
    source: 'OpenStreetMap — Mukkali village node; the park interior is not publicly drivable',
    searchQuery: 'Silent Valley National Park entrance, Mukkali, Mannarkkad, Palakkad, Kerala',
    hours: { all: '08:00–13:00 (entry window at the Mukkali check post)' },
    hoursNote:
      'Park opening hours are not the same as safari or vehicle availability. Bus/jeep slots into the park are limited and allotted by the Forest Department.',
    description:
      'Step into one of the last remaining pristine tropical rainforests of the Western Ghats. Silent Valley is a completely different experience from the resort — deep forest, extraordinary biodiversity, birdlife, and quiet.',
    tags: ['Rainforest', 'Birding', 'Safari', 'Nature', 'Photography'],
    notice:
      'Entry, vehicle slots and trekking programmes are controlled by the Kerala Forest Department and change through the year. Confirm availability and timings before you leave — best done a day ahead.',
    recommendation: 'Best as an early-morning, full-day excursion. Leave the resort at first light.',
    primaryCta: 'Plan Silent Valley Visit',
    duration: 'Full day',
    bestTime: ['morning'],
    mediaSection: 'guide_silent_valley',
  },
  {
    id: 'anuvavi-temple',
    n: '03',
    name: 'Arulmigu Anuvavi Subramaniar Temple',
    shortName: 'Anuvavi Subramaniar Temple',
    kicker: 'Temple • Spiritual • Heritage',
    categories: ['spiritual', 'viewpoints', 'photography'],
    coords: { lat: 11.057017, lng: 76.848835 },
    precision: 'exact',
    source: 'Two independent listings agree on this point (Periya Thadagam / Kanuvai, Coimbatore)',
    searchQuery: 'Arulmigu Anuvavi Subramaniar Temple, Periya Thadagam, Coimbatore',
    hours: null,
    hoursNote:
      'Published darshan timings differ between sources — please confirm before you set out. Expect a climb of roughly 250 steps to the main shrine.',
    description:
      'A hill temple on the route towards Anaikatti, dedicated to Lord Murugan and reached by a stepped climb through the Marudamalai foothills. A quiet spiritual stop with the Western Ghats as its backdrop.',
    tags: ['Temple', 'Spiritual', 'Hills', 'Architecture'],
    highlight: 'A scenic spiritual stop before heading deeper towards Anaikatti.',
    primaryCta: 'Explore Temple',
    duration: '1–2 hrs',
    bestTime: ['morning', 'evening'],
    mediaSection: 'guide_anuvavi_temple',
  },
  {
    id: 'anaikatti-viewpoint',
    n: '04',
    name: 'Anaikatti Hill View Point',
    shortName: 'Anaikatti Hill View Point',
    kicker: 'Viewpoint • Photography • Sunset',
    categories: ['viewpoints', 'photography', 'nature'],
    coords: { lat: 11.102, lng: 76.775 },
    precision: 'approximate',
    source: 'A single local-operator listing — good to a few hundred metres, not surveyed',
    searchQuery: 'Anaikatti view point, Anaikatti, Coimbatore',
    hours: { all: 'Open access roadside stop' },
    hoursNote: 'No gate and no ticket — but avoid unfamiliar hill roads after dark.',
    description:
      'A scenic stop along the Anaikatti route where the surrounding hills fall away into a natural backdrop — the easiest photograph of the drive, and a good place to simply stand for a while.',
    tags: ['Photography', 'Mountain Views', 'Sunset', 'Road Trip'],
    highlight: 'Perfect for a quick photo stop.',
    primaryCta: 'Find Viewpoint',
    duration: '30–45 min',
    bestTime: ['afternoon', 'evening'],
    photoLed: true,
    mediaSection: 'guide_anaikatti_viewpoint',
  },
  {
    id: 'maranatty-falls',
    n: '05',
    name: 'Maranatty Waterfalls',
    shortName: 'Maranatty Waterfalls',
    kicker: 'Waterfall • Adventure • Nature',
    categories: ['waterfalls', 'nature', 'photography'],
    // Listed only by street address (Chittoor, Dam Post, Agali, Attappadi).
    // No coordinate could be traced to a source, so none is invented.
    coords: null,
    precision: 'unverified',
    areaLabel: 'Chittoor / Dam Post, Agali, Attappadi, Kerala',
    source: 'Address only — no coordinate could be verified',
    searchQuery: 'Maranatty Waterfalls, Chittoor, Agali, Attappadi, Kerala',
    hours: null,
    hoursNote: 'Daylight hours only. There is no mobile signal at the falls.',
    description:
      'Venture deeper into the Anaikatti–Attappadi landscape to find Maranatty Waterfalls, tucked into the rugged beauty of the Western Ghats. The last stretch is on foot — around twenty minutes from where vehicles stop.',
    tags: ['Waterfall', 'Nature', 'Photography', 'Adventure'],
    notice:
      'Water flow and access vary sharply with the weather and with local conditions. Verify accessibility before travelling, and do not attempt the approach in heavy rain.',
    primaryCta: 'Plan Your Visit',
    duration: 'Half day',
    bestTime: ['morning', 'afternoon'],
    mediaSection: 'guide_maranatty_falls',
  },
  {
    id: 'parappanthara',
    n: '06',
    name: 'Parappanthara River View Point',
    shortName: 'Parappanthara River View Point',
    kicker: 'River • Scenic Drive • Photography',
    categories: ['rivers', 'photography', 'nature', 'viewpoints'],
    coords: null,
    precision: 'unverified',
    areaLabel: 'Kunthipuzha riverside, Padavayal, Agali, Attappadi, Kerala',
    source: 'Address only — no coordinate could be verified',
    searchQuery: 'Parappanthara River View Point, Padavayal, Agali, Attappadi, Kerala',
    hours: null,
    hoursNote:
      'At least one listing has shown this point as temporarily closed. Check its current status before making the drive.',
    description:
      'A peaceful riverside stretch on the Anaikatti–Attappadi route, where the Kunthipuzha runs wide and shallow over rock. This is for guests who want the drive as much as the destination — a quieter side of the Western Ghats.',
    tags: ['River', 'Scenic Drive', 'Photography', 'Nature'],
    contextNote: 'Local sources place it roughly 25 km from Anaikatti; the road distance from the resort is measured live above.',
    recommendation: '½ day scenic drive',
    primaryCta: 'Explore Route',
    duration: 'Half day',
    bestTime: ['morning', 'afternoon'],
    mediaSection: 'guide_parappanthara',
  },
  {
    id: 'nilgiri-nature-park',
    n: '07',
    name: 'Nilgiri Biosphere Nature Park',
    shortName: 'Nilgiri Biosphere Nature Park',
    kicker: 'Botanical Garden • Biodiversity • Nature',
    categories: ['botanical', 'nature', 'wildlife', 'photography'],
    // Consistently addressed to Thuvaipathy village on the Anaikatti road,
    // but no mapped coordinate could be traced. Hours, however, are well
    // corroborated, so they are stated.
    coords: null,
    precision: 'unverified',
    areaLabel: 'Thuvaipathy village, Anaikatti Road, Coimbatore 641108',
    source: 'Address and hours corroborated by several listings; no coordinate verified',
    searchQuery: 'Nilgiri Biosphere Nature Park, Anaikatti, Coimbatore',
    hours: {
      monday: '09:00–17:00',
      tuesday: 'Closed',
      wednesday: '09:00–17:00',
      thursday: '09:00–17:00',
      friday: '09:00–17:00',
      saturday: '09:00–17:00',
      sunday: '09:00–17:00',
    },
    closedDay: 2, // Tuesday — 0 = Sunday
    hoursNote: 'Closed every Tuesday. Ticketing has often been cash-only — carry some.',
    description:
      'A botanical garden given over to the flora and biodiversity of the Nilgiri Biosphere region, with an extensive plant collection, a butterfly garden and conservation-focused landscaping across its grounds.',
    tags: ['Botanical Garden', 'Plants', 'Biodiversity', 'Photography', 'Family'],
    highlight: 'A relaxed nature experience that suits families and plant lovers equally.',
    primaryCta: 'Explore Garden',
    duration: '2–3 hrs',
    bestTime: ['morning', 'afternoon'],
    mediaSection: 'guide_nilgiri_park',
  },
  {
    id: 'river-bathing',
    n: '08',
    name: 'River Bathing Point',
    shortName: 'River Bathing Point',
    kicker: 'River • Relaxation • Nature',
    categories: ['rivers', 'nature', 'photography'],
    coords: null,
    precision: 'unverified',
    areaLabel: 'River access points around Anaikatti',
    source: 'No specific point could be verified',
    searchQuery: 'river bathing point near Anaikatti, Coimbatore',
    hours: null,
    hoursNote: 'Daylight hours only.',
    description:
      'Slow down beside the water and take in the refreshing side of Anaikatti — a natural stop for guests who want river, greenery and an unhurried hour outdoors.',
    tags: ['River', 'Relaxation', 'Photography', 'Family'],
    // Deliberately worded so nothing here reads as permission to swim.
    notice:
      'We do not claim that swimming or bathing is officially permitted at any river point near the resort. Check local conditions and safety before entering the water, keep children within reach, and never enter a river after rain upstream.',
    primaryCta: 'Find River Point',
    duration: '1–2 hrs',
    bestTime: ['afternoon', 'evening'],
    mediaSection: 'guide_river_bathing',
  },
].map((a) => ({ ...a, mapsUrl: gmapsSearch(a), directionsUrl: gmapsDirections(a) }));

export const byId = (id) => ATTRACTIONS.find((a) => a.id === id);

// ------------------------------------------------------------
// "What kind of day are you looking for?" — each tile filters the list.
// ------------------------------------------------------------
export const EXPERIENCES = [
  {
    id: 'nature-day',
    icon: 'leaf',
    title: 'A Day in Nature',
    blurb: 'Birds, biodiversity and forest, at an unhurried pace.',
    places: ['sacon', 'nilgiri-nature-park', 'silent-valley'],
  },
  {
    id: 'waterfalls',
    icon: 'pool',
    title: 'Chasing Waterfalls',
    blurb: 'Falling water and the walk in to reach it.',
    places: ['maranatty-falls', 'river-bathing'],
  },
  {
    id: 'photo-drive',
    icon: 'sun',
    title: 'Photography Drive',
    blurb: 'Hill light, river bends and roads worth stopping on.',
    places: ['anaikatti-viewpoint', 'parappanthara', 'river-bathing'],
  },
  {
    id: 'spiritual',
    icon: 'spa',
    title: 'Spiritual Escape',
    blurb: 'A stepped hill temple and a quiet hour.',
    places: ['anuvavi-temple'],
  },
  {
    id: 'scenic-roads',
    icon: 'car',
    title: 'Hills & Scenic Roads',
    blurb: 'The Anaikatti–Sholayur–Attappadi run, taken slowly.',
    places: ['anaikatti-viewpoint', 'parappanthara', 'maranatty-falls'],
  },
  {
    id: 'family',
    icon: 'users',
    title: 'Family Nature Day',
    blurb: 'Gentle ground, shade and something for every age.',
    places: ['nilgiri-nature-park', 'river-bathing', 'anaikatti-viewpoint'],
  },
];

// ------------------------------------------------------------
// Suggested day trips. `stops` are attraction ids; the page adds the resort
// at both ends and totals the real drive time between them.
// ------------------------------------------------------------
export const DAY_TRIPS = [
  {
    id: 'anaikatti-essentials',
    length: 'Half day',
    title: 'Anaikatti Essentials',
    blurb: 'Temple, hill view and botanical garden — the short, easy introduction to the area.',
    stops: ['anuvavi-temple', 'anaikatti-viewpoint', 'nilgiri-nature-park'],
    note: 'The Nature Park is closed on Tuesdays — swap it for the river on a Tuesday.',
  },
  {
    id: 'river-viewpoint-drive',
    length: 'Half day',
    title: 'River & Viewpoint Drive',
    blurb: 'Scenic roads, a river and a long look at the hills. Photography first, schedule second.',
    stops: ['anaikatti-viewpoint', 'parappanthara', 'river-bathing'],
    note: 'Confirm Parappanthara is open before you commit to the drive.',
  },
  {
    id: 'western-ghats-adventure',
    length: 'Full day',
    title: 'Western Ghats Adventure',
    blurb: 'An early departure for Silent Valley, forest time, and a river or viewpoint stop on the way back.',
    stops: ['silent-valley', 'parappanthara'],
    note: 'Silent Valley timings and access rules must be confirmed before departure. Leave at first light — the Mukkali entry window closes at 1:00 PM.',
  },
];

// ------------------------------------------------------------
// Plan Your Day — the planner matches on these.
// ------------------------------------------------------------
export const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', sub: 'Before noon', icon: 'sun' },
  { id: 'afternoon', label: 'Afternoon', sub: 'Noon to 4 PM', icon: 'run' },
  { id: 'evening', label: 'Evening', sub: 'After 4 PM', icon: 'fire' },
];

export const INTERESTS = [
  { id: 'nature', label: 'Nature' },
  { id: 'waterfalls', label: 'Waterfalls' },
  { id: 'spiritual', label: 'Temple' },
  { id: 'photography', label: 'Photography' },
  { id: 'rivers', label: 'River' },
  { id: 'wildlife', label: 'Wildlife' },
  { id: 'botanical', label: 'Family' },
];

export const RESPONSIBLE = [
  'Respect forest and wildlife regulations at every stop.',
  'Carry your litter back with you — there are no bins on these roads.',
  'Do not feed, chase or call out to birds and animals.',
  'Follow the instructions of forest staff and local authorities.',
  'Never enter restricted or unmarked forest areas.',
  'Check the weather before setting out for a waterfall.',
  'Check river conditions before going anywhere near the water.',
  'Confirm attraction timings on the day you travel, not the week before.',
  'Some locations need prior permission — ask us and we will check.',
  'Avoid unfamiliar forest and hill roads after dark.',
];
