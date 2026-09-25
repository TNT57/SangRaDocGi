# Deploy guide — get a link in 3 steps

The repo is already set up for Vercel (`vercel.json`, pinned pnpm, adapter, automatic site URL).
**No settings are required** to get a working link.

## Get the link (about 3 minutes)

1. Go to **vercel.com/new** and sign in with GitHub.
2. **Import** `TNT57/SangRaDocGi`. If it is not in the list, click "Adjust GitHub App Permissions" and allow this repo.
3. Leave everything as it is and press **Deploy**. When it finishes you get a link like `https://sang-ra-doc-gi.vercel.app`.

Every later `git push` redeploys by itself.

### What the link shows today

- **Production link:** only readings that pass the §8.5 checklist (CLAUDE.md rule 4). Right now none do, so it shows a calm "Kho đang được chuẩn bị" page. It fills up as you publish readings (see `PHASE0_DATA_GUIDE.md`).
- **Preview links** (from other branches or pull requests): show the drafts with a yellow "BẢN NHÁP" banner. Vercel keeps preview links private (you must be logged in) by default.
- Want the drafts on the production link anyway, e.g. to show a friend? Vercel → Project → Settings → Environment Variables → add `INCLUDE_DRAFTS` = `1` → Redeploy. ⚠️ This goes against rule 4 (unreviewed texts in public). Remove it before you share the link widely.

## Optional: turn on the open counter (5 minutes)

Without this the site works, the counter is just hidden.

1. Vercel project → **Storage** → **Create Database** → **Upstash for Redis** (free) → connect it to this project.
   This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
2. Settings → Environment Variables → add `COUNTER_SALT` = any long random text.
3. **Redeploy.** Check `https://<your-link>/api/counter` → `{"count":0}`.

## Optional: turn on analytics (3 minutes)

1. Create a free site at **goatcounter.com**, e.g. code `ketsach`.
2. Add environment variable `PUBLIC_GOATCOUNTER_CODE` = `ketsach` → **Redeploy**.
3. What you will see (CLAUDE.md §10):
   - `open`: crates opened per day
   - `read-end/<slug>` compared with visits to `/bai/<slug>`: % read to the end (the most important number)
   - `first-visit` and `return-d1 … return-d7`: devices that come back within 7 days

## Optional: your own domain

Vercel → Settings → Domains → add it. Canonical links follow automatically (or set `SITE_URL`).

## Before the real launch

- `pnpm data:check --launch` passes (100 readings, 15 per theme, reading speed measured, contact email set, fame data complete).
- ⏳ 30-day target written down (CLAUDE.md §10).
- Decree 147/2024 check (CLAUDE.md §13).
