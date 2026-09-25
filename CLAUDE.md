# CLAUDE.md — Két Sách (working name)

> **What this file is:** the strategic plan. It says *what* we build and *why*.
> It contains **no code and no implementation details.**
>
> **Rules for Claude Code:**
> 1. Read this whole file before writing any code.
> 2. Build only what is in §5 (MVP scope). If something is not listed, ask Nathan first.
> 3. Where a decision is marked **⏳**, use the **default** written next to it. Do not invent a different one.
> 4. Never publish a reading that has not passed the checklist in §8.5.
> 5. *How* things are built (stack, folders, commands, conventions) lives in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Read it before changing code. Phase 0 steps for adding a reading live in [`docs/PHASE0_DATA_GUIDE.md`](docs/PHASE0_DATA_GUIDE.md).

Version 2. Changed after an independent review (see `GRILL_REPORT.md`).

---

## 1. One-line idea

A Vietnamese website. You **open crates** (CS:GO style), **up to 10 a day**. Each crate gives **one short piece of Vietnamese literature** that you can read in **under 10 minutes**.

## 2. Who it is for (⏳ Nathan confirms)

**Default target user:** Vietnamese adults, about 18–35, who studied Văn at school and want a calm, short reading habit before the day starts.

**The honest tension:** almost every piece comes from school textbooks. The product must make these texts feel like a **gift**, not homework. That is why:
- the crate adds surprise,
- the design is calm and adult, not school-like,
- grade labels ("Lớp 8") are **not** shown on cards.

## 3. The daily loop

1. Open the site. See the crate, the topics and the counter.
2. Press **KHAI MỞ KÉT**. The reel spins and stops on one reading.
3. Popup shows what you got, then **Đọc ngay**.
4. Read the piece.
5. Open more if curious, up to 10 crates today. Come back tomorrow for 10 more.

**✅ Decided (Nathan): 10 crates per day per device.**
- The button shows how many are left: **"KHAI MỞ KÉT · Còn X lượt"**.
- After the 10th crate the button changes to **"Mai mở tiếp"**, with a link to **"Xem các bài đã mở hôm nay"**.
- The limit resets at midnight, device local time.
- Why a limit at all: people want to open more than one, but unlimited spins would empty the small pool in one sitting.

## 4. Reference site

We copy the **feel** of **truanayangi.com** (theme "Két hội thợ lùn"). We copy **no** assets, images, sounds or CSS.

| Reference feature | What it does there | Us |
|---|---|---|
| Crate reel | Cards slide fast, slow down, stop under a gold centre line, ~5–6 s. Button text: "KHAI MỞ KÉT" → "ĐANG MỞ KHÓA..." → "KHAI MỞ LẦN NỮA" | ✅ MVP (but "Mai mở tiếp" after the 10th crate of the day) |
| Category tabs | Ăn tối / Đồ uống / Ăn vặt / Món nhậu | ✅ MVP, as **themes** |
| Global counter | "Lượt khai mở: 1.873.712", counts every user | ✅ MVP (defined in §6.3) |
| "Trong kho có gì?" | Grid of every possible item, with rarity label and coloured border | ✅ MVP (defined in §6.4) |
| Result popup | "THƯỜNG · ĐÃ KHAI MỞ", name, image, "TIẾP TỤC". URL changes to a link for that item | ✅ MVP, shows the reading |
| 5 rarity tiers (Thường, Hiếm, Sử thi, Huyền thoại, Cổ vật) | Coloured labels with names | ✅ MVP as **colours only, no names** (§6.5) |
| Level / EXP bar, budget filter, themes, Maps/Grab links, share buttons | Extras | ❌ Not in MVP |

## 5. MVP scope (build only this)

| # | Feature | Notes |
|---|---|---|
| 1 | **Crate spin** | §6.1 |
| 2 | **Theme tabs** | §6.2 |
| 3 | **Open counter** | §6.3 |
| 4 | **"Trong kho có gì?"** | §6.4 |
| 5 | **Reading page** | §7. Not on the reference site, but the product does nothing without it |
| 6 | **No repeats** | The reel only picks pieces this device has not opened yet. Uses browser storage, no accounts |
| 7 | **"Nguồn & bản quyền" page** | List of sources, how copyright was checked, a contact email for removal requests |
| 8 | **Basic analytics** | One privacy-friendly analytics script. No cookies banner needed. See §10 |

**Link rule:** every reading has its **own URL** (so it can be opened again and shared by copying the link). **No** share buttons.

## 6. How each MVP feature behaves

### 6.1 Crate spin
- **The result is chosen first.** Then the animation is built to land on it. The animation never decides the result.
- Pick rule: random among pieces in the chosen theme that this device has **not** opened yet.
- When a device has opened everything in a theme: show "Bạn đã mở hết chủ đề này" and suggest another theme.
- When a device has opened **everything in the whole pool**: the crate still works, but it picks from already-opened pieces and the popup says **"Đã mở trước đây"**. The button must never be dead.
- Daily limit: 10 crates per device (§3).
- Spin length ~5 s. If the user prefers reduced motion, skip the animation and show the result directly.
- Screen readers must hear the result.

### 6.2 Theme tabs
- Tabs are **themes**, not genres. Genre (story, poem, folk, essay) is a separate label on the card.
- A **"Tất cả"** tab is the default.
- Every reading has exactly **one** theme. Nathan decides edge cases.
- **⏳ Default themes** (Nathan confirms after tagging):

| Chủ đề | Examples |
|---|---|
| Thiên nhiên | Thu điếu, Qua Đèo Ngang, Đây thôn Vĩ Dạ |
| Đất nước & lịch sử | Hịch tướng sĩ, Nam quốc sơn hà, Thánh Gióng |
| Thân phận con người | Lão Hạc, Hai đứa trẻ, Chuyện người con gái Nam Xương |
| Tiếng cười | Thầy bói xem voi, Lễ xướng danh khoa Đinh Dậu, Hạnh phúc của một tang gia |
| Tình cảm | Gió lạnh đầu mùa, Kiều ở lầu Ngưng Bích |

### 6.3 Open counter
- **What it counts:** total crates opened by all users. Spins, not reads.
- **When it updates:** loaded once when the page opens, then +1 locally after your own spin. **No live updates, no websockets.**
- **No fake starting number.** If it says 43 at launch, it says 43.
- Basic protection against spam (limit counts per visitor).
- If the counter service is down, hide the counter. The rest of the site must still work.
- This is the **only** part of the MVP that needs a server.

### 6.4 "Trong kho có gì?" (inventory)
- Shows **every** reading in the pool as a text card: **title, author, rarity colour, theme label, genre icon, read time**.
- **Not opened yet** → card is dimmed, and there is **no way to read it** from here. You must open it from the crate.
- **Already opened** → card is bright and you can read it again.
- Top line: **"Đã mở X / Y"**. This turns the small pool into a collection to complete.

### 6.5 Rarity (✅ Decided: CS:GO colours, no names)
- **Colours only.** No tier names anywhere in the UI.
- Rarity = **fame**, measured from outside data, never from our own taste or an AI:
  1. **Textbook count**: how many of the 3 textbook series include the piece (1–3). Tested: 91 pieces in 1 series, 31 in 2, 12 in 3.
  2. **Wikipedia pageviews** of the *parent work* (12 months). Excerpts inherit their parent (e.g. *Trao duyên* → *Truyện Kiều*). Tested: only ~31 of 136 pieces match an article automatically, so Nathan maps the rest by hand once, in Phase 0.
  3. Optional later: how many analysis essays quote it (the *Chí Phèo* method).
- **Fame score** = textbook count + log(pageviews). Rank the whole pool, then cut:

| Colour | Hex | Share of pool | Drop chance |
|---|---|---|---|
| 🟦 Blue | #4b69ff | bottom ~50% | 55% |
| 🟪 Purple | #8847ff | next ~25% | 25% |
| 🩷 Pink | #d32ce6 | next ~15% | 13% |
| 🟥 Red | #eb4b4b | next ~7% | 5% |
| 🟨 Gold | #ffd700 | top ~3% | 2% |

- Drop chances are **softer than CS:GO** (gold is 0.26% there). With 10 crates a day, 2% means about one gold every 5 days.
- Because of the no-repeat rule, rare pieces still reach every user eventually. They just come later, as a reward for coming back.
- Screen readers get the tier as hidden text (e.g. "độ hiếm 5/5"). The UI shows colour only.
- Sanity check from the test: the top of the list was *Nam quốc sơn hà, Bình Ngô đại cáo, Chí Phèo, Chuyện người con gái Nam Xương, Thánh Gióng, Lão Hạc*. That matches what most Vietnamese readers would call famous.

### 6.6 Card design (decide before any UI work)
The reference uses food photos. We have no images. A card is **text only**: title, author, rarity colour (border and glow), theme label, genre icon, read time. Design this card first. It is used in the reel, the popup and the inventory.

## 7. Reading page

- Title, author (with years), source, read time, theme.
- **Font:** full Vietnamese diacritics support. Body text at least 18px, line height at least 1.7.
- **Dark mode** follows the phone setting automatically. (This is reading comfort, not a "theme switcher".)
- **Poems keep their line breaks.** Lục bát keeps its indentation.
- **Footnotes** for hard Hán-Việt words are allowed. Nathan writes them. **Never copy textbook footnotes.**
- **Hook line** (one sentence on why it's worth reading) is optional. Nathan writes it. **Never copy textbook text.**
- Heavy content gets a small **"Nội dung nặng"** tag before "Đọc ngay". (⏳ default)
- Footer: source link, "Nguồn & bản quyền" link.

## 8. Data — the most important part

**Quality of the product = quality of the data.** Phase 0 (data) comes before UI.

### 8.1 Where pieces come from

We never judge on our own which part of a book is good. We use pieces **humans already chose**.

| Source | Role |
|---|---|
| Vietnamese school textbooks (SGK Ngữ văn 6–12, 3 series) | The **selection**: experts chose these excerpts |
| *Quốc văn trích diễm* (Dương Quảng Hàm, 1925) | A second expert selection: 182 short pieces, mostly 1–4 min |
| vi.wikisource.org | The **text**: free public-domain texts with an API |
| Student analysis essays | A **signal only**, to find the most-quoted part of a long work. Never published |

### 8.2 What we have (measured)

| Step | Count |
|---|---|
| Textbook entries, 3 series, grades 6–12 | 760 |
| Unique pieces | ~628 |
| Free under **Vietnamese** law (author died 1975 or earlier, or folk) | **137** |
| …of which the text is already online (Wikisource) | **~51** |
| Locked (modern authors) | ~380 |
| Foreign (translation rights unclear) | ~106 |

Inside the 137: 25 stories/excerpts · 26 folk tales/fables/chèo · 73 poems/verse · 13 essays/documents.

**Realistic launch pool:**

| Rule used (§8.3) | Pieces with text now | Readings (short poems not combined) |
|---|---|---|
| Vietnam only | ~51 | ~51 |
| **Safe everywhere (default)** | ~24 confirmed, plus ~13 that depend on the translator or reteller | **~24–37** |

So with the default rule, textbooks alone **do not reach** the launch target (§9). *Quốc văn trích diễm* (compiled by Dương Quảng Hàm, d. 1946, from old authors) is the planned top-up: 182 short pieces. First sort only: Phase 0 confirms each piece.

**The 10-a-day problem:** an active user opens 10 readings a day. With ~30 readings they see everything on **day 3**. With ~200 (textbooks + *Quốc văn trích diễm*) they last about **3 weeks**. The pool size is now the biggest risk in the project.

Wikisource numbers beyond textbooks (~730 extra reads) are **estimates** and are not planned for the MVP.

### 8.3 Copyright — three countries, three answers

Nathan lives in **Australia**. The site may be hosted in the **US**. The texts are **Vietnamese**. Each country has a different rule:

| Author (and translator) died | Vietnam | Australia | United States |
|---|---|---|---|
| **1947 or earlier** | ✅ Free | ✅ Free | ✅ Free |
| 1948 – 1954 | ✅ Free | ✅ Free | ⚠️ Likely protected |
| 1955 – 1975 | ✅ Free | ⚠️ Likely protected | ⚠️ Likely protected |

Why: Australia frees authors who died **before 1955**. The US protects a Vietnamese work unless it was already free in Vietnam on **23 Dec 1998**, which means the author died in 1947 or earlier.

Examples:
- **Safe everywhere:** Thạch Lam (d. 1942), Hàn Mặc Tử (1940), Bích Khê (1946), Phan Bội Châu (1940), Nguyễn Khuyến, Tú Xương, Nguyễn Du, Hồ Xuân Hương. *Truyền kỳ mạn lục* in the Trúc Khê translation (translator d. 1947).
- **VN + AU only:** Nam Cao (1951), Ngô Tất Tố (1954), Trần Trọng Kim translations (1953). Also Vũ Trọng Phụng: his Vietnamese term was extended to 2020, so he is likely protected in the US.
- **VN only:** Nguyễn Huy Tưởng (1960), Nguyễn Bính (1966), Hồ Chí Minh (1969).

**⏳ Decision: which rule does the MVP follow?**
**Default: "safe everywhere" only** (author and translator died 1947 or earlier, or folk with a safe reteller). Add the other groups only after asking a lawyer. *This is not legal advice.*

Other rules:
- **Translations count.** Hán works (*Hịch tướng sĩ*, *Nam quốc sơn hà*, *Truyền kỳ mạn lục*, *Hoàng Lê nhất thống chí*) are read in translation. The **translator's** death year decides too.
- **Folk tales:** the tale is free, but every *retelling* has an author. The textbook wording is locked. Nguyễn Đổng Chi (d. 1984) is locked. Use a retelling whose author died in time, or Nathan retells it himself.
- **Ca dao / tục ngữ sets:** build our own sets. Don't copy a compiler's selection.
- **Credit** is always shown (author, translator, source). Credit is required, but credit is **not** permission.
- **Removal:** any valid request is handled within **7 days**, via the "Nguồn & bản quyền" page.

### 8.4 Cutting rules

- **Promise "under 10 minutes"**, not "10 minutes". Show the real read time on every card.
- **Unit:** Vietnamese words are counted as **syllables (tiếng)**, split by spaces.
- **Reading speed:** measure it. Nathan times himself on 5 prose pieces and 5 verse pieces, then uses the real averages. Verse and old texts will be slower.
- **Short poems (4–8 lines):** ✅ Decided: **one poem = one crate. Do not combine.** Short pieces fit the 10-crates-a-day style.
- **Long works:** find the part with the most quotes in analysis essays, and cut there. Tested once on *Chí Phèo*: the best 11-min part holds 49% of all quotes. **Test on 3 more works before trusting this method.**
- **Find excerpts by their text, not by chapter number.** Editions number chapters differently (*Tức nước vỡ bờ*: chapter XVIII in textbooks, XIX on Wikisource).
- Always cut at a paragraph or scene break.

### 8.5 Checklist — a reading may go live only if:

1. The text comes from a free source, and the link is stored.
2. Author + death year are stored. Translator + death year too, if any. Copyright flags are stored for VN / AU / US.
3. It passes the MVP copyright rule (§8.3).
4. It has one theme and one genre.
5. Unicode is normalised. One tone-mark style is used everywhere. Old hyphenated spelling ("nhân-dân") is modernised.
6. It was proofread against a second copy or the scan (OCR errors are common).
7. The real read time is measured.
8. It has a content tag if needed.
9. Nathan reviewed it (name + date stored).

### 8.6 The ~86 free pieces with no online text

Not needed for the MVP. For each one, later: find a real source (scans on archive.org, old printed collections), estimate the effort, and put it in a queue. Don't type from textbooks: that copies the textbook edition and notes.

## 9. Phases

| Phase | Goal | Done when |
|---|---|---|
| **0. Data** (⏳ time limit: 4 weeks) | Build the launch pool | **≥ 100 readings pass §8.5, at least 15 per theme.** (10 crates a day means 40 would last only 4 days.) This **needs** *Quốc văn trích diễm* (§8.2) |
| **1. MVP** | The 8 items in §5 | A stranger on a phone can open a crate, read, and come back tomorrow for a new piece |
| 2. Polish | Better fame data (essay quote counts), footnotes for all, more pieces | — |
| 3. Grow | English toggle, pieces beyond textbooks, EXP/levels | — |

Build order inside Phase 1: **card design → reading page → spin → inventory → counter.** The reading page matters more than the animation.

## 10. How we know it works

| Metric | Why |
|---|---|
| Crates opened per day | Is anyone using it? |
| % of opens that reach the end of the reading | Do people actually read, or only spin? **The most important number** |
| % of users who come back within 7 days | Is it a habit? |

⏳ 30-day target: Nathan sets it before launch. (Example: 50 users who come back at least 3 times.)

## 11. Tech constraints (not a stack choice)

- Readings are prepared in Phase 0 and shipped as **static content**. No database for texts.
- Only the counter needs a small server-side piece.
- UI strings are kept in one place, so English can be added later without a rewrite.
- ✅ Framework and hosting: **decided by Claude Code** (Nathan delegated this on 2026-09-25). Static site on a US host, which is fine under the "safe everywhere" rule (§8.3). Details in `docs/ARCHITECTURE.md`.

## 12. Not now (do not build)

Accounts, login, EXP/levels, rarity tier *names*, badges, theme switcher, share buttons, English toggle, ratings, comments, AI features, payments, push notifications.

## 13. Risks

| Risk | Plan |
|---|---|
| Pool too small (**biggest risk** with 10 crates a day) | Launch threshold of 100. Add *Quốc văn trích diễm* in Phase 0. No repeats until the pool is empty. "Đã mở X / Y" collection. Grow the pool every week after launch |
| Copyright mistake | §8.3 rule + §8.5 checklist + removal page |
| Feels like homework | Adult design, no grade labels on cards, hook lines, crate surprise |
| Only spinning, not reading | Track "read to end". Improve the reading page first |
| Bad text quality | Proofread step in §8.5 |
| Spin gets boring | Rarity colours and softened odds. Reduced motion skip |
| Dark content at 6 am | "Nội dung nặng" tag |
| Vietnamese website rules (Decree 147/2024) | Probably do not apply to a free reading site. Check before launch |

## 14. Decisions for Nathan

Claude Code uses the default until Nathan changes it.

| # | Decision | Default |
|---|---|---|
| 1 | Crates per day | ✅ **Decided: 10 per day per device** |
| 2 | Copyright rule for MVP | ✅ **Decided: safe everywhere** (author and translator died ≤ 1947). Smaller pool, so *Quốc văn trích diễm* is needed |
| 3 | Target user | Adults 18–35 who studied Văn |
| 4 | Final theme list | The 5 in §6.2 |
| 5 | Short poems | ✅ **Decided: one poem per crate, not combined** |
| 6 | Heavy content | Allowed, with "Nội dung nặng" tag. Adult pieces (e.g. *Làm đĩ*) excluded |
| 7 | Who writes hook lines and footnotes | Nathan, optional in MVP |
| 8 | Phase 0 time limit | 4 weeks |
| 9 | 30-day success target | Nathan sets before launch |
| 10 | Framework and hosting | ✅ **Decided (delegated to Claude Code): Astro static site + one serverless counter, hosted on Vercel.** See `docs/ARCHITECTURE.md` |

## 15. Glossary

| Term | Meaning |
|---|---|
| Két | The crate |
| Khai mở | To open the crate |
| Trong kho | The pool of all readings |
| Bài đọc / reading | What one crate gives you |
| Theme / Chủ đề | The tab a reading belongs to |
| Genre | Story, poem, folk, essay. A label, not a tab |
| Safe everywhere | Free in Vietnam, Australia and the US |
| SGK | Sách giáo khoa, school textbook |
