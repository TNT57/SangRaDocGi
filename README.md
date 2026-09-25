# Két Sách

Mở két, nhận một áng văn Việt ngắn, đọc dưới 10 phút. Tối đa 10 két mỗi ngày.

A Vietnamese reading site: open a crate (CS:GO style) and get one short public-domain piece of Vietnamese literature.

- **What and why:** [`CLAUDE.md`](CLAUDE.md) (the plan) and [`GRILL_REPORT.md`](GRILL_REPORT.md) (the review it answers)
- **How it is built:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Adding readings (Phase 0):** [`docs/PHASE0_DATA_GUIDE.md`](docs/PHASE0_DATA_GUIDE.md)
- **Going live:** [`docs/DEPLOY.md`](docs/DEPLOY.md)

## Get a link

Import this repo at **vercel.com/new** and press Deploy. Nothing else is needed. Details and optional counter/analytics: [`docs/DEPLOY.md`](docs/DEPLOY.md).

## See it on your computer first (about 5 minutes)

1. **Install Node.js** (one time): download the "LTS" version from https://nodejs.org and install it.
2. **Open a terminal** (Mac: Terminal app · Windows: PowerShell) and run:

   ```sh
   git clone https://github.com/TNT57/SangRaDocGi.git
   cd SangRaDocGi
   git checkout tnt57/zen-pascal-7jgwmq
   corepack enable        # turns on pnpm (comes with Node). On Mac, if it asks: sudo corepack enable
   pnpm install
   pnpm dev
   ```

3. Open **http://localhost:4321** in your browser. You see the full site with the 12 draft readings (yellow "BẢN NHÁP" banner).
   Edit any file and the page updates by itself. Stop with `Ctrl + C`.

**On your phone:** run `pnpm dev:phone` instead of `pnpm dev`. It prints a "Network" address like `http://192.168.1.20:4321`. Open it on a phone connected to the **same Wi-Fi**.

**One-file preview:** `pnpm preview:file` packs the whole site (with drafts) into `dist-preview/ket-sach-preview.html`. Double-click it, or ask Claude to publish it as a private artifact to view it inside the Claude app.

**See exactly what Vercel will publish** (only reviewed readings, so today an empty vault): `pnpm preview:site`, then open http://127.0.0.1:4321.

To reset your opened crates and daily count: open the browser's developer tools → Application → Local Storage → delete the `ketsach:v1:*` keys (or use a private window).

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
