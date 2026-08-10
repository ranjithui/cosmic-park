# Deploying Cosmic Park to Render

The blueprint in [render.yaml](render.yaml) provisions and configures all three resources. There is nothing to fill in by hand.

---

## Deploy

Render Dashboard → **New** → **Blueprint** → select `ranjithui/cosmic-park` → **Apply**.

Do *not* use **New → Web Service** — that form ignores `render.yaml` and would create a single unconfigured service.

Render reads the blueprint, creates the database first, then builds both services. First build takes ~4–6 minutes. Along the way it automatically:

- generates `JWT_SECRET` and injects `DATABASE_URL` from the database
- applies the `20260808084530_init` migration (`prisma migrate deploy`)
- seeds the demo data — villa, amenities, seasonal rate plans, add-ons, admin user
- resolves the web app's `VITE_API_BASE_URL` to the API's real hostname, whatever suffix Render assigns it

## Verify

1. `https://<api-host>/api/health` → `{"status":"ok",...}`
2. Open the static site and run a booking for **2026-12-26 → 2026-12-29**. Festive-tier pricing means the rate plans seeded correctly.

## Change the admin password

The admin dashboard is public at `https://<api-host>/admin` and a fresh database seeds with `admin@cosmicpark.in` / `ChangeMe123!`. **Change it before sharing the demo URL.**

Free instances have no shell and the API has no change-password endpoint, so the password is rotated through an env var:

1. Render Dashboard → `cosmic-park-api` → **Environment**
2. Set **`ADMIN_PASSWORD`** to the password you want
3. **Save** — Render redeploys, and the seed resets the login to that value

`ADMIN_PASSWORD` is declared `sync: false` in the blueprint, so the value lives only in Render, never in git. While it is set, every deploy re-applies it — so change it in the dashboard, not in the admin UI, or the next deploy will overwrite your change. Leave it unset and the seed won't touch an existing password at all.

## Re-seeding

The seed is idempotent and runs on every deploy, so demo data can't go missing. Records are matched by natural key — email, slug, name — and updated in place rather than duplicated. It never deletes anything, so real bookings made during a demo survive a redeploy.

To wipe and start clean, drop the database in the Render dashboard and re-apply the blueprint.

---

## Free-tier caveats

| Limit | Impact | What to do |
|---|---|---|
| Web service sleeps after 15 min idle | First request takes 30–60s. The static site loads instantly, then the booking flow hangs — which reads as "the site is broken." | Hit `/api/health` ~2 min before demoing, or upgrade the API to Starter ($7/mo). |
| No persistent disk | Everything uploaded through the admin media panel is wiped on redeploy/restart. | For the demo, don't rely on uploaded photos. Commit images to `apps/web/public/` and reference them directly, or move media to Cloudinary/S3. |
| Free Postgres expires after 30 days | Database is deleted, not just suspended. | Fine for a short demo. For anything longer, upgrade the database before day 30. |
| No shell on free instances | Can't run one-off commands server-side. | Nothing needed — migrations and seeding run in the build. For ad-hoc queries, use the external connection string from your machine. |

## Upgrading for a live demo

Set `plan: starter` on the API service in `render.yaml` and push. That removes the sleep and enables shell access. Add a persistent disk too if you want uploads to survive:

```yaml
    disk:
      name: uploads
      mountPath: /opt/render/project/src/uploads
      sizeGB: 1
```

The mount path must match where `UPLOAD_DIR` resolves — multer builds it from `process.cwd()` at [upload.js:7](apps/api/src/middleware/upload.js#L7), and Render's Node working directory is `/opt/render/project/src`.

## Notes

- **CORS** is wide open (`app.use(cors())` at [app.js:10](apps/api/src/app.js#L10)), so the static site on a different origin works without config. Tighten it to the web origin before this goes anywhere near production.
- **The admin dashboard** is served same-origin by the API (`const API = ''`), so it needs no separate deployment or env var.
- **Rate limiting** uses in-memory storage, which is correct here — a single instance, not a serverless fleet.
