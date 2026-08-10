# Cosmic Park

Private 8-bedroom villa in Anaikatti, Coimbatore — booked as one whole-villa
retreat. This repo holds the whole product: the guest-facing website, the
booking API + admin dashboard, and the source specs.

```
cosmic-park/
├── apps/
│   ├── web/     React site — homepage + full booking flow + manage booking
│   └── api/     Node/Express + Prisma/PostgreSQL REST API + admin dashboard
├── docs/        Sitemap & booking rules, and the original clickable wireframe
├── HOW-TO-RUN.txt
└── package.json (convenience scripts)
```

## Quick start

Two processes: the **API** (port 4000) and the **website** (port 5173). Start
the API first. See [HOW-TO-RUN.txt](HOW-TO-RUN.txt) for the detailed walkthrough.

```bash
# 1. install both apps
npm run install:all

# 2. set up + run the API  (needs PostgreSQL — see apps/api/README.md)
cp apps/api/.env.example apps/api/.env      # then edit DATABASE_URL + JWT_SECRET
npm --prefix apps/api run prisma:generate   # or: cd apps/api && npx prisma generate
cd apps/api && npx prisma migrate dev --name init && cd ../..
npm run seed
npm run dev:api

# 3. in a second terminal — run the website
npm run dev:web        # http://localhost:5173
```

The website proxies `/api` and `/uploads` to the API at `localhost:4000` in dev
(no CORS setup). For a deployed build set `VITE_API_BASE_URL` — see
[apps/web/README.md](apps/web/README.md).

## The two apps

| | Folder | Docs |
|---|---|---|
| **Website** (React + Vite) | [`apps/web`](apps/web) | [apps/web/README.md](apps/web/README.md) |
| **Booking API** (Express + Prisma) | [`apps/api`](apps/api) | [apps/api/README.md](apps/api/README.md) |

## Specs

- [docs/SITEMAP-and-BOOKING-RULES.md](docs/SITEMAP-and-BOOKING-RULES.md) — sitemap, booking model, pricing tiers, GST, cancellation
- [docs/cosmic-park-wireframe.html](docs/cosmic-park-wireframe.html) — the original clickable wireframe the site is built from

## Known gaps (carried from the API review)

- The API stores pre-tax totals (`Booking.taxAmount` is `0`; room-rent GST not
  applied server-side). The website computes and displays the correct
  GST-inclusive figures — keep `apps/web/src/lib/pricing.js` aligned once the
  backend applies GST.
- Booking `confirm`/`cancel`/`modify` are unauthenticated (UUID only); the
  website's Manage-booking screen adds a client-side email check on top.
- No payment gateway (the `Payment` model is a stub); the website's payment step
  is a clearly-labelled demo that confirms directly.
- The API README's `DB_PROVIDER=sqlite` shortcut doesn't run as written
  (Prisma rejects `env()` in `provider`; SQLite rejects the schema's enums and
  `createMany({ skipDuplicates })`). PostgreSQL is the working target.
