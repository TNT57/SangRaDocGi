# Grill report on CLAUDE.v1.md

Reviewer: independent sub-agent (skeptical reviewer, no prior context beyond the file).
Verification notes by the main session are at the bottom.

> Status: every critical and important issue below is answered in `CLAUDE.md` v2.

## Verdict
The data research is strong. The product plan on top of it is weak. The doc promises "one 10-minute reading every morning", but the data says most pieces take 1–3 minutes and only about 50 have usable text. It never decides whether this is a once-a-day habit or an unlimited slot machine, and those two need different products. There is also a legal blind spot around translations of Hán/Nôm works that sits right inside the example lists.

## Critical issues
1. **Pool is much smaller than it looks.** ~112–121 assumes all 137 have text; only ~50 do. ~10 per topic tab. Unlimited re-spins drain a tab in one sitting. → Set a launch pool size and a time limit for Phase 0.
2. **Once a day, or unlimited spins? Undecided.** The doc describes a morning habit, but copies "KHAI MỞ LẦN NỮA". → Pick one. Suggest one crate per day per device.
3. **"10 minutes" is false for most of the pool.** Mostly short poems and folk tales. "Word" is unclear in Vietnamese (syllables?). 200 wpm is too fast for archaic verse. → Promise "under 10 minutes", show real time, define the unit, measure speed.
4. **Hán/Nôm translations not covered.** Hịch tướng sĩ, Nam quốc sơn hà, Nam Xương, Quang Trung were written in Hán; people read a modern translation. → Translator's death year decides. Store translator per reading.
5. **Hook line breaks the copyright rule** ("from textbooks"). → Nathan writes hooks himself, or drop them.
6. **No success measure, no named user.** → Name the user, add privacy-friendly analytics, set a 30-day target.

## Important issues
1. Repeat-avoidance is needed in MVP (localStorage only), not Phase 2.
2. Rarity contradicts itself across §3/§8/§10. Meaningless colours = fake excitement. → Hide in MVP; colour by topic.
3. Global counter is the only reason for a backend; will show a small number at launch; can be spammed. → Define: counts spins, loaded on page open, no websockets, no fake start number, rate-limit.
4. Inventory grid can kill the surprise and expose the small pool. → Show title/author/topic only; text unlocks after drop.
5. No card design without images. → Design a text card before UI work.
6. Topic system mixes genre ("Dân gian") and theme. → Themes for tabs, genre as a separate field.
7. Archaic Hán-Việt words need footnotes. → Nathan-written footnotes allowed in MVP.
8. Text quality: OCR errors, old spelling, tone-mark style, NFC/NFD, edition differences. → Normalise, review checklist, "reviewed by" field.
9. ~87 texts not online have no plan. → List real sources and effort.
10. US hosting risk is real, not "a few". → US-risk flag per reading.
11. Folk-tale "older retellings" also have authors (Nguyễn Đổng Chi d.1984). → Check reteller, or retell yourself.
12. No takedown process. → "Nguồn & bản quyền" page + contact.
13. Phone reading at 6am: Vietnamese font, ≥18px, line-height ≥1.7, auto dark mode, keep poem line breaks.
14. Heavy content: decide exclude vs content warning.

## Minor issues
- One Chí Phèo test does not prove the citation method; test 3 more.
- "~730 Wikisource reads" is an estimate; label it.
- 5–6 s spin daily gets old; add skip; respect reduced motion.
- Screen readers must hear the result; never colour-only.
- Copy the reference's feel only: no assets, sounds, CSS.
- "Lớp 8" on cards feels like homework.
- Ca dao collections: build sets yourself.
- Check Vietnamese website rules (Decree 147/2024) — probably not applicable.

## Vague lines Claude Code could misread
- "reward, not homework" vs every piece being a textbook text.
- Shareable URL ✅ vs share buttons ❌.
- "Visual only for now" → may build fake rarity.
- "Goes up live" → may build websockets.
- "It stops on one reading" → say the result is chosen first, then the animation lands on it.
- "MVP reading" undefined.
- Hook line "from textbooks" conflicts with §6.3.
- "Tech stack (not decided)" → Claude Code will pick one.

## Hard questions only Nathan can answer
1. Who is the user, and why do they open this?
2. One crate per day, or unlimited?
3. Launch with ~50 readings?
4. Can people read from the inventory without spinning?
5. Is a counter showing "43" OK? Worth a backend?
6. Cut rarity entirely from MVP?
7. Exclude Hán-origin works whose translator died after 1975?
8. Write footnotes and hook lines yourself?
9. What 30-day number means "it works"?
10. Dark or adult pieces: exclude or warn?

---

## Verification by the main session

| Reviewer claim | Checked | Result |
|---|---|---|
| Only ~50 of 137 have text online | Our own Wikisource matching | ✅ Correct (~51 Vietnamese pieces, 4 more are foreign) |
| US risk is real | US–Vietnam copyright proclamation, 23 Dec 1998; Wikisource note on Vietnamese works | ✅ Correct, and **bigger than stated**: a Vietnamese work is free in the US only if it was already free in Vietnam on 23 Dec 1998, meaning the author (and translator) **died in 1947 or earlier**. Nam Cao (1951), Ngô Tất Tố (1954), Nguyễn Huy Tưởng (1960), Nguyễn Bính (1966), Hồ Chí Minh (1969) and Vũ Trọng Phụng (VN term extended to 2020) are likely still protected in the US |
| (Added) Australia — Nathan lives there | National Library of Australia | Authors who died **before 1 Jan 1955** are free in Australia. After that, life + 70 |
| Reviewer said "Vietnam joined Berne 2004" as the restore trigger | US State Dept / proclamation | ⚠️ Minor error: the relevant date is the **23 Dec 1998** proclamation. Conclusion unchanged |
