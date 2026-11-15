# Prompt Builder — tab expansion and improvement plan

| | |
|---|---|
| Repo | `D:\gen_fb_post`, `main` @ `819420f` |
| Written | 15 Nov 2026 |
| Status | **Single Product Hero tab implemented 15 Nov 2026** (§7). Everything else is still plan. Estimates are guesses, not measurements. |
| Context | Read `server.js`, `lib/template.js`, `lib/comparison-template.js`, `lib/llm.js`, `lib/db.js`, `public/index.html`, `public/app.js` |

---

## 0. What already exists

**Two tabs: Poster and Product Comparison.**

**The comparison tab already does 2 products.** `public/index.html:122-127` has a 2/3 selector, and `lib/comparison-template.js:90-94` switches between a two-column and three-column layout. I ran it against the live server with ESP32 DevKit V1 vs Arduino UNO R3 and got a 9,347-character prompt back. **So "ESP32 vs UNO" needs no new tab — it works now.**

What the comparison tab does *not* have:

- **No price per product.** Cards carry name, image, 4 features, 5 specs, highlight colour — but no LKR price. The Poster tab has prices; the comparison does not. For a price-led shop that is the biggest single gap on that tab.
- **Max 3 products.** `product_count` is forced to 2 or 3 in the template, the API suggester and the UI.
- **No "which one should I buy" verdict line.** The prompt asks for a comparison but never asks for a recommendation.
- **Brand colours disagree with the Poster tab.** Comparison uses brand orange `#FF6B00`; Poster uses promo `#FF8C00` and cyan `#00E5FF` glow. Two tabs, two palettes.

---

## 1. How a new tab is wired (the six places to touch)

Today `mode` is a single string with an `if/else` in several places. Adding a tab means editing six spots:

| # | File | What is hardcoded now |
|---|---|---|
| 1 | `public/index.html:24-27` | `.tab` buttons and the `#panel-*` divs |
| 2 | `public/app.js:72-79` | `switchMode()` toggles two named tabs and two named panels |
| 3 | `public/app.js:318-325` | `collectState()` / `fillForm()` pick by `mode === "comparison"` |
| 4 | `public/app.js:46-50, 511` | `states`, `currentIds`, and the defaults map in `newDesign()` |
| 5 | `server.js:21` and `:31` | `/api/render` and `/api/suggest` choose the builder |
| 6 | `public/app.js:469-470, 497` | history badge label and the load-back branch |

**Do the refactor first.** Replace the branches with a small registry:

```js
// public/app.js
const MODES = {
  poster:    { label: "Poster",   defaultState: POSTER_DEFAULT,     panel: "panel-poster",    tab: "tab-poster" },
  comparison:{ label: "Compare",  defaultState: COMPARISON_DEFAULT, panel: "panel-comparison",tab: "tab-comparison" },
  // hero:   { label: "Single",   defaultState: HERO_DEFAULT, ... },
};
```

```js
// server.js
const BUILDERS = { poster: buildPrompt, comparison: buildComparisonPrompt, hero: buildHeroPrompt };
const prompt = (BUILDERS[body.mode] || buildPrompt)(body);
```

After that, **each new tab is one template file plus one registry entry** — roughly 20–40 minutes of wiring plus however long the prompt text takes to write. Without the refactor, every tab is another six edits and another place to forget.

The DB needs no migration: `designs.type` is already free text (`lib/db.js:22`).

---

## 2. Proposed tabs

Ranked by what earns money versus what is fun to build. Effort excludes the shared refactor.

| # | Tab | What the user fills | Output | Why it is worth it | Effort |
|---|---|---|---|---|---|
| 1 | **Single Product Hero** | 1 product, price, 3 features, badge, offer | 1:1 poster with one large product | Poster tab is built for 2–4 items; a single hero product is the most common promo a shop runs | 2 h |
| 2 | **Offer / Price Drop** | product, was-price, now-price, % off, end date | 1:1 with strikethrough price | Clearance and flash sales are the recurring retail job; needs a was/now field pair | 2 h |
| 3 | **Bundle / Combo** | 3–4 items, bundle price, "save LKR X" | 1:1 with a wrapped bundle | Kits (starter pack, sensor pack) sell at higher AOV than single parts | 3 h |
| 4 | **New Arrival** | product, arrival date, 3 features | 1:1 "JUST LANDED" | Monthly restock posts; reuses the Hero template with a different badge block | 1 h |
| 5 | **Education / Tutorial cover** | topic, board, difficulty | 16:9 blog + YouTube thumbnail | Feeds the content calendar; different aspect ratio is the point | 3 h |
| 6 | **Mammalia B2B sheet** | product, 6–8 spec rows, no price | 16:9 datasheet-style graphic | Separates `.com` integrator material from `.lk` retail posters | 4 h |

**Skip as tabs:** a separate "Story / Reel" tab. Aspect ratio belongs as a **selector on every tab** (1:1, 4:5, 9:16, 16:9), not as a duplicate form. One extra field instead of six duplicated tabs.

**Small wins on the existing Comparison tab** (do these before any new tab):

- add a **price field per card**;
- allow **4 products** — the layout in `lib/comparison-template.js:396-450` extends to four columns with narrower text;
- add one **"best for"** line per product (ESP32: "Wi-Fi projects"; UNO: "first board").

---

## 3. Improvements that matter more than new tabs

### 3.1 Product library (the biggest time saver)

Right now every poster retypes name, description, features and price. Add a `products` table and a picker:

- "Import from library" on each card → name, desc, features, price, default colour fill in;
- "Save to library" on a filled card;
- library edited once when a price changes.

Effect: a repeat poster goes from ~10 minutes of typing to two clicks, and prices stop drifting between designs. `lib/db.js` already shows the SQLite pattern; this is one table and four endpoints.

### 3.2 Claim guard — this one is a correctness fix, not a nicety

`lib/llm.js:120` tells the model to fill specs "only from widely-known facts about the given product names". That is fine for an Arduino UNO. It is **wrong for our own products**: Squirrel, Dolphin, the voice puck and the HMI lid have rules in `Shared\Elephantronics\decisions.md` (D-001 to D-025) — 5 TOPS not 6, "2× GbE, 1 Gbps aggregate", no certification claims, no temperature range beyond 0–50 °C.

A model asked to complete a Squirrel spec block will confidently invent TOPS, ports or certification. Fix:

- a **"Locked facts" toggle** on each product card: when on, AI Suggest may polish wording but never add or change a number;
- a **blocked-claims list** appended to both system prompts ("never write: certified, CE, FCC, dual 1 GbE, 6 TOPS, −40 to +85 °C, Made in Sri Lanka, works with Alexa");
- a warning badge in the output modal when a locked-fact product has an empty spec.

This is cheap (one prompt block plus a checkbox) and it is the difference between a poster that is merely off-brand and one that makes a claim engineering has to retract.

### 3.3 Caption block on the result modal

The poster is only half a Facebook post. After Generate, show a second box: 2–3 caption variants, hashtags, and a first-comment line — generated from the same fields, no extra form. Saves a separate chat round trip every time.

### 3.4 Export and history

- **Copy / download** `.md` and `.txt` next to Copy.
- **Download the JSON** of a design so it can be re-imported.
- **Search and filter** history by type and name — the list is already rendered (`public/app.js:455-508`), it just needs a filter box.
- **Duplicate** a saved design into another tab ("same products, make it a story").

### 3.5 Stop hardcoding shop facts in templates

`lib/template.js:69` hardcodes the WhatsApp number and "FREE OVER RS. 5,000". `lib/comparison-template.js:327` says "Available Now At", the poster says "ORDER NOW". Put phone, free-delivery threshold, URL and CTA in **Settings** and inject them. Otherwise a delivery-policy change means editing prompt strings in two files.

---

## 4. Suggested order

| Phase | Work | Estimate |
|---|---|---|
| 0 | Registry refactor (§1) + shared brand block so both templates use one palette | 4 h |
| 1 | Comparison tab: price field, 4-up, "best for" line | 3 h |
| 2 | Single Product Hero + Offer/Price Drop tabs | 4 h |
| 3 | Product library (§3.1) | 6 h |
| 4 | Claim guard (§3.2) + caption block (§3.3) | 5 h |
| 5 | Bundle tab, Education cover, Mammalia sheet, aspect selector | 8 h |

**Total ≈ 30 h**, spread as you like. Phases 0–2 give the most visible change for ~11 h. Phase 3 is the one you will feel every week.

---

## 5. Risks and things that will bite

- **Template drift.** Each template is a 5–15 KB string. Without a shared brand/CTA block, the third tab will be a third palette. Factor the fixed parts out before adding tabs 3 and 4.
- **History badge styling** is CSS per type (`.type-badge.comparison`); new types need a neutral default or they look unstyled.
- **`fillForm()` reruns on every tab switch** and rebuilds DOM cards — fine for 2 tabs, still fine for 6, but stop re-rendering on every keystroke if you add live preview.
- **AI Suggest shapes are per-mode** in `lib/llm.js` (two near-identical functions). A third mode means a third copy; refactor to one function taking a field schema.
- **Free models drift.** `openrouter/free` silently changes which model answers; a prompt tuned today can render differently next week. Pin a named model for production posters.
- **No tests.** There is no test suite. At minimum add a smoke test that calls `/api/render` for every registered mode and asserts non-empty output — that catches a broken registry in one second.

---

## 6. Recommendation

1. **Do not build a "2-product compare" tab — it exists.** Verify it once with ESP32 vs UNO, then add the missing price field and the "best for" line.
2. **Refactor to a mode registry first** (Phase 0). Every later tab then costs minutes, not an afternoon.
3. **Build three tabs: Single Product Hero, Offer/Price Drop, Bundle.** Those match what the shop actually posts.
4. **Build the product library and the claim guard next.** They save time every week and they stop the tool inventing specs for our own hardware.
5. **Treat aspect ratio as a field, not a tab.**

---

## 7. Implemented: Single Product Hero (15 Nov 2026)

Added as a third tab, sharing the Poster tab's brand system and typography.

| File | Change |
|---|---|
| `lib/hero-template.js` | new — one-product 1:1 hero prompt: kicker, big product name, one-line description, large price with optional struck-through was-price, up to 4 feature chips, angled badge, commercial footer |
| `server.js` | `BUILDERS` / `SUGGESTERS` registries replace the `if/else`; `/api/render` and `/api/suggest` now dispatch by mode |
| `lib/llm.js` | `suggestHero()` — polishes kicker/description/badge/CTA and may polish existing features, but is told never to add a feature, price or spec |
| `public/index.html` | `#tab-hero` button and `#panel-hero` form |
| `public/app.js` | `HERO_DEFAULT`, hero collect/fill/render, `MODES` array in `switchMode`, `TYPE_LABELS`, `DEFAULTS`, hero branch in `suggest()` |
| `public/styles.css` | `.tabs` wraps, `.type-badge.hero` in gold |

Verified: `/api/render` hero returns a 5.2 KB prompt with price, was-price, badge and all four features; the tab renders and Generate works in the browser; poster and comparison still render; a saved design round-trips with `type = hero`.

Known gap: AI Suggest can still propose a marketing-sounding feature sentence, and the free model occasionally returns a `?` where a non-breaking space belongs (seen once in "240?MHz"). The claim guard in §3.2 is still not built.

---

## 8. Implemented: Generate Image tab (15 Nov 2026)

A fourth tab that writes finished poster PNGs into `output/`, with two renderers behind one switch.

| File | Change |
|---|---|
| `lib/local-poster.js` | new — builds the poster as HTML/CSS from the hero fields and screenshots it with headless Chrome at 1:1 (1080×1080), 4:5, 9:16, 16:9, 3:2 or 2:3 |
| `lib/gemini-image.js` | new — Gemini `generateContent` image client: prompt plus up to 3 reference images (logo, product photo), `responseModalities: ["IMAGE"]`, `imageConfig.aspectRatio` |
| `server.js` | `POST /api/poster` (local), `POST /api/image` (Gemini), `GET /api/assets` (brand files under `BRAND_ROOT`), `GET /api/images` (output folder), `GET /api/gemini/check` (key + model reachability), `/output` static mount, `outputName()` shared save naming |
| `public/index.html` | `#tab-image`, `#panel-image`, provider radios, poster field set, `#btn-to-image` in the prompt modal |
| `public/app.js` | `IMAGE_DEFAULT`, `collectImage`/`fillImage`, `applyProvider`, `renderPosterFromState`, `generateImageFromState`, `loadAssets`, `loadGallery`, copy-from-hero |
| `public/styles.css` | provider cards, gallery grid, result preview |
| `.gitignore`, `.env.example` | `output/` ignored; `GEMINI_API_KEY`, `GEMINI_IMAGE_MODEL`, `BRAND_ROOT`, `GEMINI_PROXY` documented |

**Output layout.** Every run writes `output/<timestamp>_<slug>.png` plus a matching `.txt` sidecar holding the settings, the exact prompt or field values, and for local renders the source HTML. The folder is gitignored but served at `/output/...` so the gallery and preview work.

**Brand assets.** `/api/assets` walks `BRAND_ROOT` (default `D:\elephantronics-com`), skipping `dist`, `node_modules` and `.git`: 68 images, 12 of them logos. The logo picker ranks `logo-reversed.png` first because it is the white mark for dark backgrounds; `elephantronics-logo.png` has a baked-in white background and looks wrong on navy. `logo-primary.png` (transparent, blue mark) also works.

**Local renderer internals.** Design unit `u = min(W,H)/1080`, so no ratio overflows. Palette is `#151B2B` navy, `#FF6B00` orange, `#FFD700` gold price, `#00E5FF` chip ticks, grey secondary text, matching `brand.txt`. Tall canvases get a larger headline and a 520u photo cap. The logo and photo are inlined as base64 data URIs, so Chrome never touches the network, and it runs with a throwaway `--user-data-dir` so the user's Chrome profile is untouched.

**Known limitation: Gemini image generation is blocked by quota, not by code.** The stored key reaches the API (200 on `/v1beta/models`, 64 models, 6 image models) but every image model returns `429 RESOURCE_EXHAUSTED` with `free_tier … limit: 0`. Free-tier keys get zero image requests, so billing must be enabled on that project. The OpenRouter key is also at 0 credits, so it is not a substitute. The tab reports that in plain words instead of a raw error.

**Network note.** Google API hosts are unreachable directly from this machine. `lib/gemini-image.js` probes `127.0.0.1:7890`, `:7891` and `:10809` (Clash/V2Ray defaults) and tunnels only the Gemini call through the first open one, leaving OpenRouter direct. Override with `GEMINI_PROXY`. Passing an undici `ProxyAgent` to Node's built-in `fetch` fails with `UND_ERR_INVALID_ARG`; the client therefore imports `fetch` from the installed `undici` so the dispatcher belongs to the same copy.

Verified: 1:1, 4:5, 9:16 and 16:9 renders with and without a product photo; UI copy-from-hero, render, preview and gallery; sidecar contents; Gemini quota error surfaces as one readable sentence. Four test PNGs sit in `output/`.

**Brand palette now follows `D:\elephantronics-com\brand.txt` (15 Nov 2026).** brand.txt defines exactly five colours — Orange `#FF6B00`, Deep Navy `#151B2B`, Dark Blue `#182033`, White `#FFFFFF`, Grey `#808080` — plus "clean, bold typography" and the wordmark rule "Elephant orange, ronics white". The templates did not match it:

| Drift | Was | Now |
|---|---|---|
| Background | `#0B0F19` and pure black | `#151B2B` navy, `#182033` panels |
| Tech accent | cyan glow `#00E5FF` | orange `#FF6B00` on PCB line work |
| Prices | gold `#FFD700` | orange `#FF6B00` |
| Promo strip | `#FF8C00` | `#FF6B00` |
| Badge | red top, yellow bottom, lightning bolt | solid orange, navy text |
| Typography | "distressed / rough texture" | clean bold sans-serif, no texture |
| Product accents | Blue, Red, Green, Yellow, Purple, Cyan, Orange | Orange, White, Grey only |
| Comparison `ronics` | "dark charcoal / near-black" on navy | white `#FFFFFF` |
| Comparison lighting | "subtle blue accent" | orange only |

Touched: `lib/template.js`, `lib/hero-template.js`, `lib/comparison-template.js`, `public/app.js` (`COLORS` / `COLOR_HEX` reduced to the three brand accents), `lib/local-poster.js` (price, chip ticks and URL pill recoloured).

Old saved designs may still carry `highlight_color: "Blue"`; the templates now normalise any non-brand accent to Orange rather than passing it to the model. The local renderer takes the same accent, applied to the kicker and the feature-chip ticks, and the image tab copies it from the Hero tab along with the rest of the fields.

Orange fills (badge, URL button, promo strip) use **Deep Navy text**, not white: white on `#FF6B00` measures 2.9:1, below the 3:1 floor for large bold text, while navy measures 5.9:1. WhatsApp green stays only for the WhatsApp platform mark, which is a third-party logo rather than a brand accent.

Verified: all three `/api/render` prompts now contain exactly `#151B2B #182033 #FF6B00 #FFFFFF #808080` and no other hex; a Blue/Cyan accent sent to the comparison tab renders as Orange; the swatch rows on all three tabs show Orange/White/Grey; poster, hero and comparison still render in the browser.

---

## 9. Comparison-poster layout (reference art)

`docs/ART-DIRECTION.md` records the measured palette and the anatomy of both reference images in `examples/`. This section covers only what changed in code.

New: `lib/local-comparison.js` renders the square comparison infographic — centred logo lockup, one-line headline with an orange `VS`, glowing discount badge, two accent-bordered panels with 4 ticked benefits and 4 spec pills each, footer CTA and a row of four stroke category icons. Background is the reference navy `#0F1626` with the orange bloom and the fading trace grid; panels are `#1A2131`.

`POST /api/poster` now takes `layout: "comparison"` and reads `comparison_title`, `comparison_subtitle`, `discount_amount`, `discount_text`, `photo_1`, `photo_2` and a `products[]` array of `{ name, accent, features[], specs[] }`. Both photo fields are validated against `BRAND_ROOT`, exactly like `logo_path`. Any other `layout` value keeps the existing single-product path, so old saved designs still render.

The Image tab gained a **Single product / Product comparison** switch inside the Poster text card, a `Copy from Comparison tab` button, and two product blocks (name, accent, photo, features, specs, all comma separated). The render button relabels itself.

Accents: `Orange`, `Steel Blue`, `Grey`, `White`. Steel Blue `#2A648C` is a deliberate fourth accent taken from the reference so the two panels differ. Decided 15 Nov 2026: comparisons only; the single-product renderer, the Hero tab and all three prompt templates stay on Orange / White / Grey.

Limits: two products only (the three-column banner layout is not built), no claim guard, and prices in the badge/panels are free text.

Verified 15 Nov 2026: API render of a 1080×1080 comparison PNG plus sidecar, then the same render driven through the Image tab in a browser with 0 page errors.

---

## 10. Four-panel retail poster (reference C)

Third reference, `examples/850903018_122121159189421597_6460390237375443997_n.jpg`, is a downloaded Facebook post rather than a Gemini render, so it is the retail page's current published style. Measurements and anatomy are in `docs/ART-DIRECTION.md` §3.

New: `lib/local-grid.js` renders that layout with two presets.

- `clean` (default) — brand colours, clean type, no texture. Accents cycle Orange → Steel Blue → Grey → White.
- `retail` — the measured post palette (blue `#055499`, red `#AF0E06`, green `#307405`, gold `#C58C07`, badge red `#9C0401` over gold, CTA orange `#E15402`), tilted badge slabs, and a grain overlay plus an SVG displacement filter so the headline has the rough edge.

`POST /api/poster` takes `layout: "grid"` with `style`, `headline_1`, `headline_2`, `promo`, `promo_tagline`, `badge_top`, `badge_bottom`, `best_price`, `hashtags`, `photo_1`–`photo_4` and up to four `products[]` of `{ name, desc, features[], price, accent }`. Photos are validated against `BRAND_ROOT` like every other path.

The Image tab gets a third layout radio (**Four-product grid**), a style select, a **Copy from Poster tab** button that maps that tab's four products, headline, promo and badge text, and four editable panels (name, variant line, features, price, accent, photo).

Price pills auto-shrink at 11 and 15 characters so "LKR 4,700 ONLY" fits a quarter-width panel.

Verified 15 Nov 2026: both presets rendered through the API and through the Image tab in a browser (`local four-panel 1080x1080`, 0 page errors), switching back to single product restores that path.

Two fixes found while testing: the launcher's node process is not matched by a `gen_fb_post` command-line filter, so restarting the server must kill the PID that owns port 3000 (otherwise the old code keeps serving and renders silently go to the wrong layout); and the render button label is now reset through `applyLayout()` rather than hard-coded, so it stays correct after a render.

---

## 11. Free image providers (15 Nov 2026)

Gemini image models stay at `limit: 0` until billing is enabled, and the OpenRouter key has 0 credits. So the Image tab now offers four providers, chosen with the radio row above the prompt.

| Provider | Cost | Key | Output | Time | Logo / product photo |
|---|---|---|---|---|---|
| Local render (default) | free | none | 1080 px in any ratio, exact brand layout | 1–3 s | yes, real files, inlined |
| BytePlus Seedream | paid per image | `BYTEPLUS_API_KEY` | 2K (2048 px and up) | 10–40 s | no, prompt only |
| AI Horde | free | none (anonymous) | 576 px typical, 512 px floor | 40 s – 5 min queue | no |
| Gemini | paid | Gemini key + billing | up to 1024 px, strongest prompt following | 20–60 s | yes, up to 3 reference images |
| Cloudflare Workers AI | free 10,000 neurons/day | free account + token | 1024 px `flux-1-schnell` | 5–20 s | no |

**What each one is actually for.** The local renderer builds the finished poster: real logo, real typography, headline, price, CTA, exact pixels. AI Horde and Cloudflare make pictures, not layouts — they cannot place the logo or set type, so their output is background or mood art that still needs the poster around it. That distinction drives the labels in the UI: the Horde card says it ignores the logo and photo inputs.

**AI Horde (`lib/horde-image.js`).** Anonymous key is literally `0000000000`, no signup, no card. The anonymous allowance is not fixed: under load AI Horde lowers the biggest image it will accept and we measured 697, 640 then 576 px within a day, answering `403` with the pixel limit in the message. So the client sends a ladder per aspect ratio (640→576→512 for 1:1, 576×704→512×640→448×576 for 4:5, and so on) and steps down a rung on `403` instead of failing. Sizes must be multiples of 64; `429` means "2 per 1 second" and is retried once after 2.5 s. Anonymous work also false-positives the NSFW filter on plain product photos and returns a black `CENSORED` placeholder, so `generations[0].censored` triggers a re-queue, at most three times, rather than saving a dead image. Set `HORDE_API_KEY` for priority and full size.

**Cloudflare Workers AI (`lib/cf-image.js`).** `flux-1-schnell` at 1024 px, about 58 neurons per render at 4 steps, so roughly 170 images a day on the free plan (resets 00:00 UTC). Needs `CF_ACCOUNT_ID` and `CF_API_TOKEN` from a free account — no card. Untested here because those two values are not in the vault yet; the endpoint shape is from the current Cloudflare docs.

**BytePlus ModelArk / Seedream (`lib/byteplus-image.js`, added 15 Nov 2026).** The strongest option for poster art because Seedream handles in-image text far better than the free models. `POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations`, `Authorization: Bearer`, `response_format: "url"`, `watermark: false`.

- Size floor: Seedream 5.x rejects `1K` and `512x512`, and an explicit `WxH` must total at least 3,686,400 px, so the client sends 2048×2048 (1:1), 1728×2160 (4:5), 1440×2560 (9:16), 2560×1440 (16:9), 2352×1568 (3:2) and 1568×2352 (2:3) — each just above the floor. `sizeFor()` re-checks the floor so a future edit cannot slip under it.
- Model IDs on this account, from `GET /api/v3/models`: `dola-seedream-5-5-261028`, `dola-seedream-5-0-pro-260628`, `dola-seedream-5-0-flash-260915`, `seedream-5-0-260128`, `seedream-4-5-251128`, `seedream-4-0-250828`. Default is `seedream-5-0-260128`, overridable with `BYTEPLUS_IMAGE_MODEL`.
- Key: `BYTEPLUS_API_KEY`, read from the environment and never written to a sidecar.
- Errors are translated: `401 AuthenticationError` → wrong or truncated key; `ModelNotOpen` → the model is not activated on the account, with the console step; `QuotaExceeded`/`AccountOverdue` → billing.

State at time of writing: the key is valid (the API reports account `3003776439`) and the endpoint is reachable without a proxy, but **all six image models return `ModelNotOpen`** — nothing has been activated in the ModelArk console. Activation is a console click plus terms acceptance, so it is a user step; once done, no code change is needed. Pricing per image was not checked and is not quoted anywhere.

Note on the vault: `request_api_key` silently skips a name that is already saved, returning `"saved"` without showing the form. To replace a key, its name must be free, and a vault key can only be deleted by the user in Server settings → Vault, so the BytePlus key was saved under a new name (`BYTEPLUS_API_KEY`) rather than reusing `ARK_API_KEY`.

**Pollinations was tested and rejected.** `image.pollinations.ai/prompt/...` served one anonymous 512 px image, then every later call returned `402 Payment Required` at any size or model. Not a dependable path.

**Storage.** `/api/image` now saves by returned mime type — `.webp` from AI Horde, `.jpg` from Cloudflare, `.png` from Gemini — and the sidecar records `provider`, resolved `size`, and `queue_wait_s`. `/api/images` and the gallery accept png, jpg, jpeg and webp.

**UI.** Four provider radios; `applyProvider()` shows the prompt card for every non-local provider, hides the Gemini model field unless Gemini is chosen, relabels the button (Generate with AI Horde / Cloudflare), and restores that label after a run. Status text is per provider, so a 1–5 minute Horde queue is not mistaken for a hang, and the saved message reports the queue seconds.

Verified 15 Nov 2026: AI Horde rendered through `/api/image` twice and once through the Image tab in a browser; a `576x576 @ 20 steps` webp landed in `output/` with a sidecar, the gallery listed it first, 0 page errors. The 640 px rung was refused and the ladder stepped to 576 without an error. One earlier run came back censored and the retry logic was added because of it.

**Still missing.** Generated art cannot yet be fed back in as the poster's product photo — `photo_path` is validated against `BRAND_ROOT`. Allowing an `output/` image as the photo, so a Horde background can sit under a local-rendered headline, is the next useful step.

## 12. Kimi as the text engine (15 Nov 2026)

Kimi was offered for image generation. It cannot do that: the platform's model list is `kimi-k3.1-pro`, `kimi-k3.1-pro-highspeed` and `kimi-k3` only, every one of them text-out with image and video as *input* (vision understanding), and the feature index has no image-generation section or endpoint. Kimi writes copy; it cannot draw.

It is, however, the first working text model on this machine, so AI Suggest now runs on it.

**Which host the key belongs to.** `https://api.moonshot.ai/v1` answers `401` with this key, `https://api.kimi.com/v1` answers `404`; `https://api.moonshot.cn/v1` works and lists the two current models. The default is therefore the `.cn` host, overridable with `KIMI_BASE_URL`; the model is `KIMI_MODEL`, default `kimi-k3.1-pro`.

**Wiring (`lib/llm.js`).** A small provider table replaces the hard-coded OpenRouter call. Providers are tried in order — Kimi when `KIMI_API_KEY` is set, then OpenRouter — and the first reply wins, so the 0-credit OpenRouter key stays as a fallback instead of the only path. Both speak the same OpenAI-compatible shape, including `response_format: {type:"json_object"}`, so the three suggesters are unchanged. Errors are translated before they reach the UI: `401/403` key rejected, `402` needs payment, `429` rate-limited or out of credit, `404` model not offered. `/api/settings` now reports `has_kimi`, `kimi_model` and `text_provider`; the sidebar has a Kimi key field (`kimi_api_key`), and the logon launcher loads `KIMI_API_KEY` from the vault.

**Account limits, read from `GET /v1/users/me`.** Free group: 3 requests per minute, 1 concurrent request, 500k tokens per minute, 1.5M tokens per day. The same response reports `user_state: "organization_suspended"` even while calls succeed, so treat that flag as unreliable until the console says otherwise; what it does show is that three calls inside one minute get an empty-bodied `429`, and the client now says so in words instead of dumping the status code.

**Verified.** `POST /api/suggest` returned real copy twice, once for Single Product Hero (kicker, description, badge, CTA plus four polished features) and once for Poster (two product descriptions). Through the browser on the Hero tab, AI Suggest filled the description and toasted "Fields updated." with 0 page errors; the sidebar reads "Kimi key is set — kimi-k3.1-pro writes the copy."

**Still open.** The claim guard from §3 is not built, so Kimi can still propose a feature sentence for our own hardware that nobody measured; and the three-per-minute free limit means a rapid series of clicks hits a `429` — the message explains it, nothing retries automatically.



