# Phase 0 guide — how to put a reading live

Goal (CLAUDE.md §9): **≥ 100 readings pass §8.5, at least 15 per theme.** Run `pnpm data:check` any time to see where you are.

## One-time setup

1. **Allow the data hosts.** The data scripts need `vi.wikisource.org` and `wikimedia.org`. In a Claude Code cloud session, add them to the environment's network allow list. On your own computer nothing is needed.
2. **Measure your reading speed** (§8.4). Time yourself on 5 prose and 5 verse pieces. `pnpm data:syllables` prints how many syllables (tiếng) each piece has. Speed = syllables ÷ minutes. Put the averages in `data/reading-speed.json` and set `"measured": true`.
3. **Set the contact email** in `src/config/site.ts` (`contactEmail`). It shows on the "Nguồn & bản quyền" page for removal requests.

## For each reading

1. **Pick** a piece from `data/candidates.csv` (or the textbooks / *Quốc văn trích diễm*). Check the §8.3 rule first: author **and** translator/reteller died **1947 or earlier**, or anonymous folk.
2. **Create the file** (skip if it exists as a draft):
   `pnpm data:new thu-vinh --title "Thu vịnh" --author "Nguyễn Khuyến" --born 1835 --died 1909 --theme thien-nhien --genre tho --form verse`
3. **Get the text** from Wikisource:
   `pnpm data:fetch "Thu vịnh" --slug thu-vinh --write`
   This stores the source link + revision (item 1) and prints the lines that differ from any text already in the file.
4. **Normalise:** `pnpm data:normalize thu-vinh` (add `--hyphens` for old "nhân-dân" spelling) (item 5).
5. **Proofread** against a second copy or the scan (item 6). Then fill:
   `proofread: { against: "Quốc văn trích diễm, 1925 scan p. 42", by: Nathan, date: 2026-10-01 }`
6. **Decide the content tag** (item 8): `heavy: true` or `heavy: false`.
7. **Fame data** in `data/fame.json`: `textbookCount` (1–3) and `wikiArticle` (the parent work's vi.wikipedia title). Then run `pnpm data:pageviews`.
8. **Optional:** a hook line and footnotes, written by you. Never copy textbook text.
9. **Review** (item 9): `review: { by: Nathan, date: 2026-10-02 }` and `status: published`.
10. `pnpm data:check` → the row shows `LIVE`. Commit.

If a file says `published` but fails any item, **the build stops** on purpose.

## About the 12 drafts already in the repo

They were typed from memory by Claude Code because Wikisource was blocked in the build environment. They exist so the site can be designed and tested. **Treat them as untrusted:** run step 3 (`pnpm data:fetch … --write`) on each and read the differences carefully before step 5.

`nam-quoc-son-ha` is the Hán-Việt reading (phiên âm) only. The well-known verse translation comes from *Việt Nam sử lược* (Trần Trọng Kim, d. 1953), which is **not** safe in the US.

## Long works (§8.4)

Find the most-quoted part in analysis essays, cut at a paragraph or scene break, and find the excerpt **by its text**, not by chapter number. Use `form: prose` and `***` for scene breaks.
