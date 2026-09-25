# Deploy guide

> **Do not deploy publicly until at least one reading passes §8.5.** A normal build ships only published readings, so an early deploy shows an empty vault ("Kho đang được chuẩn bị").
> Never deploy a build made with `INCLUDE_DRAFTS=1` to a public URL (CLAUDE.md rule 4).

## 1. Vercel project (about 5 minutes, one time)

1. On vercel.com → **Add New… → Project** → import `TNT57/SangRaDocGi`.
2. Framework preset: **Astro** (auto-detected). Build command `pnpm build`, output handled by the adapter.
3. Every push to the main branch then deploys automatically. Pull requests get preview URLs.

## 2. Counter storage (Upstash Redis, free tier)

1. In the Vercel project → **Storage → Create → Upstash (Redis)** → connect it to the project.
   This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` for you.
2. Add one more environment variable: `COUNTER_SALT` = any long random string.
3. Redeploy. Check `https://<your-site>/api/counter` → `{"count":0}`.

If these are missing, the API answers 503 and the site simply hides the counter.

## 3. Analytics (GoatCounter, free, no cookies)

1. Create a site at goatcounter.com, e.g. code `ketsach`.
2. Add `PUBLIC_GOATCOUNTER_CODE=ketsach` in Vercel → redeploy.
3. Events you will see (CLAUDE.md §10):
   - `open` → crates opened per day
   - `read-end/<slug>` ÷ pageviews of `/bai/<slug>` → % read to the end (the most important number)
   - `first-visit` and `return-d1 … return-d7` → share of devices that come back within 7 days

## 4. Domain and site URL

Add your domain in Vercel → Domains, then set `SITE_URL=https://your-domain` (used for canonical links).

## Before launch checklist

- `pnpm data:check --launch` passes (100 readings, 15 per theme, speed measured, contact email set, fame data complete).
- ⏳ 30-day target written down (CLAUDE.md §10).
- Decree 147/2024 check (CLAUDE.md §13).
