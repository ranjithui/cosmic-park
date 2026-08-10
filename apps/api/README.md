# Cosmic Park — Booking System (Backend + Admin Dashboard)

Node/Express REST API + Prisma/PostgreSQL schema + a dependency-free admin
dashboard, covering rooms, rates, availability, bookings, guests, and a
media library (images/video) for every section of the site.

## ⚠️ Verification status — read this first

Every `.js` file in this project has been syntax-checked (`node --check`)
and `npm install` completes cleanly. **The Prisma schema itself has not
been machine-validated or run against a live database** — the sandbox this
was built in blocks Prisma's engine-binary CDN (`binaries.prisma.sh`), so
`prisma generate` / `prisma migrate` / `prisma validate` all fail there
with a 403, regardless of flags. I did a manual review of the schema
(relation directions, join-table keys, enum/Decimal usage) and found no
issues, but you should run the steps below yourself before trusting this
in anything beyond local dev — normal machines will not hit this CDN block.

```bash
npm install
npx prisma generate      # should succeed on a normal network
npx prisma migrate dev --name init
npm run seed
npm run dev
```

If `prisma generate` fails for you too, it's a real problem worth
reporting back — in this sandbox it was purely the CDN allowlist.

## Stack

- **Node.js + Express** — REST API
- **Prisma + PostgreSQL** — schema/ORM (swap `DB_PROVIDER=sqlite` in `.env`
  for local prototyping without Postgres — see note below)
- **Vanilla HTML/CSS/JS admin dashboard** — no build step, served as
  static files at `/admin`
- **Multer** — image/video upload handling
- **JWT** — admin auth
- **node-cron** — background job to release expired holds

### On SQLite

The schema uses `@db.Decimal(10, 2)` on money fields, which is a
Postgres-specific native type annotation. If you switch `DB_PROVIDER` to
`sqlite`, remove the `@db.Decimal(...)` annotations first (SQLite has no
native decimal type — Prisma will map `Decimal` to a `DECIMAL`-affinity
column automatically without the annotation). Postgres is the intended
production target given the amounts involved.

## Setup

```bash
cp .env.example .env
# edit .env: set a real DATABASE_URL, JWT_SECRET, etc.

npm install
npx prisma migrate dev --name init
npm run seed        # creates admin user + sample Cosmic Park villa data
npm run dev
```

Server: `http://localhost:4000`
Admin dashboard: `http://localhost:4000/admin`
Seeded admin login: `admin@cosmicpark.in` / `ChangeMe123!` — **change this
immediately**, it's a seed default, not a secret.

## Database schema — design notes

- **RoomType vs Room**: `RoomType` is the sellable category ("Whole Villa
  8BR"); `Room` is the physical bookable unit. For Cosmic Park today
  there's one `RoomType` and one `Room` (the whole villa), but this lets
  you later sell individual bedrooms, or add a second villa, without a
  schema change.
- **Availability is computed, not stored.** There's no `Availability`
  table listing free/booked dates — a date range is available if no
  `CONFIRMED` or non-expired `HELD` `BookingItem` overlaps it, and no
  `AvailabilityBlock` (owner block-out / maintenance) overlaps it. This
  avoids a materialized calendar drifting out of sync with bookings.
  Overlap convention: `checkIn < otherCheckOut AND checkOut > otherCheckIn`,
  `checkOut` exclusive — same-day turnover (one guest checks out the same
  date another checks in) is allowed.
- **Rates**: `RoomType.basePrice` is the fallback nightly rate.
  `RatePlan` rows override it for a date range (Off-Peak / Peak /
  Festive). Overlapping rate plans are resolved by `priority` (highest
  wins) in `pricing.service.js`, not enforced at the DB level.
- **Booking lifecycle**: `HELD → CONFIRMED → (CANCELLED | COMPLETED)`.
  A hold has `holdExpiresAt`; a cron job (`src/utils/holdCleanup.js`)
  runs every minute and auto-cancels expired holds so the room frees up.
- **Media** is one generic table (`section` + optional `roomTypeId`)
  instead of one table per site section — the admin dashboard's Media
  tab uploads images/video tagged by section (hero, gallery, each
  amenity, itinerary time-of-day blocks, or a specific room type) and
  the public site queries `GET /api/media?section=hero` etc.
- **Cancellation policy is a placeholder.** `booking.service.js →
  cancelBooking()` computes a `refundEligibility` field using the draft
  tiers from the earlier content brief (full refund 14+ days out,
  partial 7–14 days, none inside 7) — this is explicitly flagged in a
  code comment as needing sign-off from the property owner before it's
  treated as real policy.

## Concurrency

Prisma has no `SELECT ... FOR UPDATE`. `createHold()` and
`modifyBooking()` wrap the availability re-check + write in a
`Serializable` transaction, so two simultaneous requests for the same
room/dates can't both succeed — Postgres fails the loser with a
serialization error, which surfaces as a `409`. For high-traffic
production use, a Postgres advisory lock keyed on `roomId` would be
cheaper than retrying failed serializable transactions — noted in
`booking.service.js`.

## REST API

All endpoints are mounted under `/api`. Admin-only endpoints require
`Authorization: Bearer <token>` from `POST /api/auth/login`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/availability?checkIn=&checkOut=&guests=` | public | Search available room types for a date range |
| POST | `/api/bookings/hold` | public | Create a temporary hold (default 15 min) |
| POST | `/api/bookings/:id/confirm` | public | Confirm a held booking (post-payment) |
| POST | `/api/bookings/:id/cancel` | public | Cancel a held or confirmed booking |
| PATCH | `/api/bookings/:id` | public | Modify dates/room/guest count |
| GET | `/api/bookings/:id` | public | Fetch one booking (confirmation page) |
| GET | `/api/bookings?status=&q=&page=` | admin | List/search/filter bookings |
| GET | `/api/room-types` | public | List room types + amenities + media |
| GET | `/api/room-types/:id` | public | Room type detail incl. rooms + rate plans |
| POST / PATCH | `/api/room-types` | admin | Manage room types |
| POST | `/api/room-types/:id/rooms` | admin | Add a physical room unit |
| POST | `/api/rooms/:id/block` | admin | Block out dates (maintenance/owner use) |
| GET / POST / PATCH / DELETE | `/api/rate-plans` | admin | Manage seasonal rates |
| GET | `/api/guests`, `/api/guests/:id` | admin | Guest directory + booking history |
| GET | `/api/media?section=&roomTypeId=` | public | Fetch images/video for a site section |
| POST | `/api/media/upload` | admin | Upload image/video (multipart, field `file`) |
| PATCH / DELETE | `/api/media/:id` | admin | Reorder, retitle, move section, remove |
| GET | `/api/add-ons` | public | Add-on catalog (e.g. Bonfire Experience) |
| POST / PATCH | `/api/add-ons` | admin | Manage add-ons |
| GET | `/api/admin/dashboard/summary` | admin | Stats for the dashboard home tab |
| POST | `/api/auth/login` | public | Admin login → JWT |

### Example: check availability → hold → confirm

```bash
curl "http://localhost:4000/api/availability?checkIn=2026-12-20&checkOut=2026-12-23&guests=12"

curl -X POST http://localhost:4000/api/bookings/hold \
  -H "Content-Type: application/json" \
  -d '{
    "roomTypeId": "<id from availability response>",
    "roomId": "<availableRoomIds[0] from availability response>",
    "checkIn": "2026-12-20",
    "checkOut": "2026-12-23",
    "totalGuests": 12,
    "guest": { "firstName": "Rennie", "lastName": "Priya", "email": "rennie@example.com", "phone": "9999999999" },
    "addOns": [{ "addOnId": "<bonfire add-on id>", "quantity": 8 }]
  }'
# → returns booking with status HELD and a 15-minute window

curl -X POST http://localhost:4000/api/bookings/<bookingId>/confirm \
  -H "Content-Type: application/json" -d '{}'
```

## Admin dashboard

Static site at `/admin` (no framework/build step):
- **Dashboard** — active holds, confirmed bookings, arrivals in next 7
  days, guest count, revenue this month
- **Bookings** — search/filter by status or guest, confirm/cancel inline
- **Rooms & Rates** — room type overview, seasonal rate plan CRUD
- **Media** — upload images/video tagged by section (hero, gallery, each
  amenity, itinerary blocks, room type), reorder, delete — this is where
  "image/video changes in all sections" from the brief lives
- **Add-ons** — manage the add-on catalog (bonfire, etc.)

## What's intentionally out of scope for this scaffold

- Payment gateway integration (Razorpay/Stripe) — `Payment` model exists
  but nothing calls a gateway; wire up webhooks to call `confirmBooking()`
  on successful payment
- Email/SMS confirmation sending
- Guest-facing self-service booking-lookup auth (currently any request
  with the booking UUID can view it — fine since UUIDs aren't guessable,
  but production should pair booking lookup with an email/reference
  check)
- Refund processing (the cancellation policy computes eligibility but
  doesn't move money)
- Rate limiting is minimal (one limiter on `/api/bookings`) — tune for
  your actual traffic
