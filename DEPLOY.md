# Deploying Cosmic Park to Render

The blueprint in [render.yaml](render.yaml) provisions all three resources. Read the **Seed the database** step before your demo — it does not happen automatically.

---

## 1. Push the blueprint

```bash
git add render.yaml DEPLOY.md
git commit -m "Add Render blueprint"
git push origin main
```

## 2. Create the Blueprint

Render Dashboard → **New** → **Blueprint** → select `ranjithui/cosmic-park` → **Apply**.

Render reads `render.yaml`, creates the database first, then builds both services. First build takes ~4–6 minutes. `prisma migrate deploy` applies `20260808084530_init` automatically.

## 3. Confirm the API hostname

Render appends a random suffix if `cosmic-park-api` is already taken globally. Check the API service's URL in the dashboard:

- If it is `https://cosmic-park-api.onrender.com` — nothing to do.
- If it differs — update `VITE_API_BASE_URL` in `render.yaml`, push, and **redeploy the static site**. Vite inlines env vars at build time, so a restart alone won't pick up the change.

Verify: `https://<api-host>/api/health` should return `{"status":"ok",...}`.

## 4. Seed the database

Free instances have no shell access, so run the seed from your machine against the **External** connection string (Dashboard → cosmic-park-db → Connections → External Database URL):

```bash
cd apps/api
DATABASE_URL="<external-connection-string>" npm run seed
```

PowerShell:

```powershell
cd apps\api
$env:DATABASE_URL="<external-connection-string>"; npm run seed
```

> **Run this exactly once.** The seed is *not* idempotent. Most of it upserts, but the seasonal rate plans use `createMany({ skipDuplicates: true })` at [seed.js:67](apps/api/prisma/seed.js#L67) and `RatePlan` has only an `@@index`, no unique constraint ([schema.prisma:117](apps/api/prisma/schema.prisma#L117)) — so `skipDuplicates` never fires and every re-run adds three more overlapping rate plans. Since pricing resolves overlaps by `priority`, duplicates won't visibly break quotes, but your admin rate table will fill with copies. This is also why the seed is deliberately kept out of `buildCommand`, which re-runs on every deploy.

Seeded admin login: `admin@cosmicpark.in` / `ChangeMe123!` — **change it before sharing the demo URL.** The admin dashboard is public at `https://<api-host>/admin`.

---

## Free-tier caveats

| Limit | Impact | What to do |
|---|---|---|
| Web service sleeps after 15 min idle | First request takes 30–60s. The static site loads instantly, then the booking flow hangs — which reads as "the site is broken." | Hit `/api/health` ~2 min before demoing, or upgrade the API to Starter ($7/mo). |
| No persistent disk | Everything uploaded through the admin media panel is wiped on redeploy/restart. | For the demo, don't rely on uploaded photos. Commit images to `apps/web/public/` and reference them directly, or move media to Cloudinary/S3. |
| Free Postgres expires after 30 days | Database is deleted, not just suspended. | Fine for a short demo. For anything longer, upgrade the database before day 30. |
| No shell on free instances | Can't run one-off commands server-side. | Use the external connection string from your machine, as in step 4. |

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
