# Architecture — how Két Sách is built

`CLAUDE.md` says **what** and **why**. This file says **how**. Keep both in sync.

## The big picture (one sentence)

A **static website** (every page is a ready-made HTML file) plus **one tiny server function** for the open counter.

Think of it like a printed book shop: the books (readings) are printed ahead of time (the build).
The only "live" thing is a clicker at the door that counts visitors (the counter).

```
src/content/readings/*.md ──► checklist gate ──► static pages ──► Vercel CDN
          (Phase 0 data)      (§8.5, build)       /, /bai/<slug>,
                                                  /nguon-va-ban-quyen
Browser: crate island (Preact) ── localStorage (opened, today's count)
                               └─ /api/counter  ──► Upstash Redis (INCR + rate limit)
                               └─ GoatCounter   (cookieless events)
```

## Choices

| Area | Choice | Why |
|---|---|---|
| Framework | **Astro 7**, `output: 'static'` | Each reading = its own HTML page (link rule §5). Content collections validate every file |
| Interactivity | **One Preact island** (`src/components/CrateApp.tsx`) | Tabs, reel, popup, today list and inventory share one state. The rest of the site is plain HTML |
| Hosting | **Vercel** via `@astrojs/vercel` | US host is fine under "safe everywhere" (§8.3). Free tier is enough |
| Counter | `src/pages/api/counter.ts` (the only non-static route) + **Upstash Redis** | `INCR` is atomic. `@upstash/ratelimit`: 1 per 3 s and 10 per day per visitor. Visitor = salted SHA-256 of IP, never stored raw |
| Device memory | `localStorage`, keys `ketsach:v1:*`, validated on read | No accounts (§5.6). If storage is blocked, it falls back to memory for the visit |
| Analytics | **GoatCounter** (no cookies → no banner) | Custom events for "read to end" (§10). Off when `PUBLIC_GOATCOUNTER_CODE` is empty |
| Fonts | Self-hosted **Literata** (reading) + **Be Vietnam Pro** (UI) | Full Vietnamese diacritics, no calls to font servers |
| Tests | **Vitest** (logic) + **Playwright** (phone-size browser tests) | |
| Poem layout | Each line stays on one row: a small script shrinks the poem only when the longest line is wider than the screen (min 15px on small phones) | Wrapped lines break lục bát alignment |
| Tone marks | **Classic style** (`hòa`, `khỏe`, `thủy`) | §8.5 item 5 needs one style. Change `TONE_STYLE` in `src/lib/text/tone.ts`, then run `pnpm data:normalize` |
| Sound | None | Not in §5. Ask Nathan before adding |

## Folders

```
CLAUDE.md                 strategic plan (no code)
docs/                     this file, Phase 0 guide, deploy guide
data/
  fame.json               textbook count + Wikipedia article + pageviews per reading (rarity input)
  reading-speed.json      Nathan's measured syllables per minute (read time)
  candidates.csv          Phase 0 queue of pieces to prepare
src/
  config/                 site settings, themes, genres, rarity colours + drop chances
  i18n/vi.ts              every UI string (English later = add en.ts)
  content/readings/*.md   one file per reading (front matter + plain text body)
  content.config.ts       collection + schema
  lib/                    pure logic, all unit-tested
    schema.ts             front matter schema
    checklist.ts          §8.5 gate
    copyright.ts          §8.3 rules (VN / AU / US)
    rarity.ts             fame score → colour tier
    picker.ts             chooses the result (before any animation)
    daily.ts              10 per day, local midnight reset
    storage.ts            safe localStorage
    reel.ts               reel geometry + easing
    readings.ts           builds the page data; drops unpublishable readings
    pool.ts               loads the collection (Astro only)
    text/                 syllables, tone style, body parser, read time
    analytics.ts, counter-client.ts
  server/                 counter handler (+ Upstash adapter)
  components/             Card, GenreIcon, CrateApp (island), ReadingBody, BrandMark
  pages/                  index, bai/[slug], nguon-va-ban-quyen, 404, api/counter
  styles/                 global.css (tokens, light + dark), fonts.css
scripts/                  pnpm data:* tools + static server for tests
tests/unit, tests/e2e
```

## Rules the code enforces

1. **Rule 4 (never publish unchecked):** `buildViews()` keeps only readings that pass all 9 checklist items **and** have `status: published`. A file marked `published` that fails the checklist **stops the build**.
2. **Drafts** appear only in `pnpm dev`, Vercel preview deployments (private by default) or a build with `INCLUDE_DRAFTS=1`. Those pages get a yellow "BẢN NHÁP" banner and `noindex`. Never deploy such a build publicly.
3. **Result first:** `pick()` chooses and saves the reading, *then* the reel is built so the winner lands under the gold line.
4. **No tier names:** colours only. Screen readers get "độ hiếm n/5".
5. **Counter:** loaded once, +1 locally, hidden on any error. No polling, no websockets, no fake start.

## Reading file format

```md
---
title: Thu điếu
status: draft            # draft | published
theme: thien-nhien       # one of src/config/themes.ts
genre: tho               # truyen | tho | dan-gian | nghi-luan
form: verse              # prose | verse | luc-bat (lục bát: 6-syllable lines are indented)
authors:
  - { name: Nguyễn Khuyến, born: 1835, died: 1909 }
translators: []          # translator death year counts too (§8.3)
retellers: []            # folk tale retellings have authors
source: { name: Wikisource tiếng Việt, url: https://…, revision: 123456 }
copyright: { vn: free, au: free, us: free }   # may be stricter than the rule, never looser
heavy: false             # "Nội dung nặng" tag; null = not decided
hook: null               # one sentence by Nathan, never from a textbook
proofread: { against: "second copy / scan", by: Nathan, date: 2026-10-01 }
review: { by: Nathan, date: 2026-10-02 }
---
Ao thu lạnh lẽo nước trong veo,
Một chiếc thuyền câu bé tẻo teo.

(blank line = new stanza/paragraph · *** = scene break · [^1] + "[^1]: note" = footnote)
```

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Local site with drafts at http://localhost:4321 |
| `pnpm dev:phone` | Same, reachable from a phone on the same Wi-Fi |
| `pnpm preview:file` | Whole site with drafts packed into one HTML file (`dist-preview/`), for private previews such as a Claude artifact |
| `pnpm preview:site` | Build exactly what production ships and serve it at http://127.0.0.1:4321 |
| `pnpm build` | Production build (published readings only) |
| `pnpm check` | Type checks |
| `pnpm test` | Unit tests |
| `pnpm test:e2e` | Browser tests (builds a draft preview first) |
| `pnpm data:check` | §8.5 table + launch readiness (`--launch` fails if not ready) |
| `pnpm data:new <slug> …` | New draft reading file |
| `pnpm data:fetch "<Wikisource title>" --slug <slug> [--write]` | Download + compare with Wikisource |
| `pnpm data:normalize [--hyphens]` | NFC + tone style (+ fix "nhân-dân") |
| `pnpm data:pageviews` | Fill Wikipedia pageviews in `data/fame.json` |
| `pnpm data:qvtd-fetch` / `pnpm data:qvtd-import [--list]` | Download (cached) and import Quốc văn trích diễm as drafts |
| `pnpm data:syllables [slug]` | Syllable count per reading (for timing your reading speed) |
