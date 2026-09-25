# Két Sách

Mở két, nhận một áng văn Việt ngắn, đọc dưới 10 phút. Tối đa 10 két mỗi ngày.

A Vietnamese reading site: open a crate (CS:GO style) and get one short public-domain piece of Vietnamese literature.

- **What and why:** [`CLAUDE.md`](CLAUDE.md) (the plan) and [`GRILL_REPORT.md`](GRILL_REPORT.md) (the review it answers)
- **How it is built:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Adding readings (Phase 0):** [`docs/PHASE0_DATA_GUIDE.md`](docs/PHASE0_DATA_GUIDE.md)
- **Going live:** [`docs/DEPLOY.md`](docs/DEPLOY.md)

## Get a link

Import this repo at **vercel.com/new** and press Deploy. Nothing else is needed. Details and optional counter/analytics: [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Run it

Needs Node 22.12+ and pnpm.

```sh
pnpm install
pnpm dev          # http://localhost:4321 — shows draft readings with a "BẢN NHÁP" banner
```

## Check it

```sh
pnpm check        # types
pnpm test         # unit tests
pnpm test:e2e     # phone-size browser tests
pnpm data:check   # which readings pass the §8.5 checklist, and launch readiness
```

## Status

The site (all 8 MVP features in CLAUDE.md §5) is built and tested. The **reading pool is not ready**: the 12 readings in `src/content/readings/` are unreviewed drafts, so a production build currently ships an empty vault on purpose. See the Phase 0 guide.

Inspired by the feel of [truanayangi.com](https://truanayangi.com). No code, images, sounds or CSS were copied.
