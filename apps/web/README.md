# Cosmic Park — Website (React)

Marketing homepage + full booking flow for the Cosmic Park villa, wired to the
[booking API](../api). Built with **Vite + React + React Router**. Design
language (Fraunces + Karla, forest/clay/sand/cream) is ported from
`../../docs/cosmic-park-wireframe.html`.

## What's here

- **Home** (`/`) — hero, signature features, "a day at Cosmic Park", villa
  glimpse, location, CTA. A quick availability bar deep-links into the booking
  flow. Images/video for each section are pulled from
  `GET /api/media?section=…` and fall back to labelled placeholders until real
  media is uploaded via the admin dashboard.
- **Booking flow** (`/book`) — a 4-step wizard with a live, sticky price
  summary:
  1. **Dates & guests** → `GET /api/availability`
  2. **Choose your stay** → room type + per-night tier breakdown from the API
  3. **Guest details & experiences** → guest form + add-ons (`GET /api/add-ons`)
  4. **Payment** → `POST /api/bookings/hold` (with a live 15-min hold timer),
     then `POST /api/bookings/:id/confirm`
- **Confirmation** (`/confirmation/:id`) → `GET /api/bookings/:id`, rendered as
  a GST invoice.
- **Manage my booking** (`/manage`) — look up a reservation by its booking ID
  (paste the confirmation link) + the email on file, then view or **cancel** it
  (`POST /api/bookings/:id/cancel`), with refund eligibility shown. The email
  check is the reference+email pairing recommended in the API review.
- **Marketing pages** — Gallery (`/gallery`, filterable, media-driven),
  Policies (`/policies`), FAQ (`/faq`, accordion), Our Story (`/story`).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

The dev server proxies `/api` and `/uploads` to the booking API at
`http://localhost:4000` (see `vite.config.js`), so **start the API first**. No
CORS setup needed.

```bash
npm run build      # production bundle → dist/
npm run preview    # serve the build locally
```

### Pointing at a deployed API

Copy `.env.example` → `.env` and set `VITE_API_BASE_URL` to the API origin
(e.g. `https://api.cosmicpark.in`). Leave it blank in local dev to use the proxy.

## Pricing & GST

`src/lib/pricing.js` is the single source of truth for what the guest sees and
pays: 18% GST on room rent, extra-guest charge above base occupancy (16), a
separate refundable ₹25,000 deposit, and a 30% advance — matching
`SITEMAP-and-BOOKING-RULES.md` §2.6 and the wireframe's worked example.

> **Note:** the API currently returns pre-tax totals (its `Booking.taxAmount`
> is `0` and room-rent GST is not applied server-side). This app displays the
> correct GST-inclusive figures on top of the API's subtotal. Once the backend
> applies room GST, keep `pricing.js` aligned with it so the displayed total and
> the stored total agree.

## Structure

```
src/
  lib/          api.js · pricing.js · format.js
  context/      BookingContext.jsx   (cross-step state + API actions)
  components/   Nav · Footer · Icon · Placeholder/Media
    booking/    BookingSummary · StepDates · StepRoom · StepGuest · StepPayment
  pages/        Home · Booking · Confirmation · ManageBooking
                Gallery · Policies · FAQ · Story
  styles/       global.css   (design tokens + components)
```

## Notes on the booking API (found while integrating)

The API's SQLite fallback (README: "set `DB_PROVIDER=sqlite`") does **not** run
as written — Prisma rejects `env()` in the datasource `provider`, and SQLite
doesn't support the schema's `enum`s or `createMany({ skipDuplicates })`.
Postgres is the working target. Payment is also a stub (no gateway), so the
Payment step here confirms directly after a simulated charge — wire a real
gateway (Razorpay/Stripe) and confirm on its success webhook for production.
