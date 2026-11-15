# Art direction — Elephantronics social posters

Derived from the two Gemini reference images in `D:\gen_fb_post\examples\`, which are the
look the app must reproduce. Colours below were sampled from the PNGs, not guessed.
Proportions are estimated by eye from the rendered images and are marked as such.

Brand rules still come from `D:\elephantronics-com\brand.txt` (five colours, two-colour
wordmark, "POWERING YOUR IDEAS", no confirmed typeface). Where the reference departs from
that palette, the departure is listed under **Deviations** and needs a decision.

---

## 1. Reference A — product comparison infographic

File: `examples/Gemini_Generated_Image_b36ja4b36ja4b36j.png`, 1024 × 1024, square feed post.

### Measured palette

| Role | Hex | Sampled from |
| --- | --- | --- |
| Page background | `#0F1626` | 38 % of pixels; flat field around the panels |
| Panel fill | `#1A2131` | inside the product cards |
| Panel edge | `#2B3549` | 1.5 px card border, slightly lighter than fill |
| Badge / glow orange | `#FD8F2D` | discount badge border, sampled as a solid 4–7 px run |
| Brand orange (headline "VS", url) | `#FF6B00` | wordmark and `elephantronics.lk` |
| Headline white | `#FFFFFF` | `ARDUINO UNO` / `ESP32` |
| Body text | `#E8ECF3` | feature lines |
| Muted text | `#9AA3B2` | "POWERING YOUR IDEAS" tagline |
| Product 1 accent | steel blue `#2A648C` | spec pills and check boxes on the left card |
| Product 2 accent | orange `#FF6B00` | spec pills and check boxes on the right card |

The background is not pure black: it is a navy field with a soft orange bloom behind the
badge and a cool bloom on the left and right edges, plus a faint grid of 1 px traces that
fades out towards the middle.

### Anatomy, top to bottom

1. **Logo lockup, centred** — reversed elephant mark beside the two-colour wordmark
   (`Elephant` in `#FF6B00`, `ronics` in white), then the letter-spaced tagline
   `POWERING YOUR IDEAS` in `#9AA3B2`.
2. **Headline** — one line, all caps, heavy grotesque, product names white and the `VS`
   in brand orange. No shadow box, only a soft drop shadow.
3. **Sub-line** — one sentence, sentence case, `#E8ECF3`, roughly half the headline size.
   Says what the choice is about ("choose the right board for your project"), not a spec.
4. **Discount badge** — centred rounded rectangle with a 3 px `#FD8F2D` border, a second
   outer glow ring, and a gradient fill from `#FFC089` → `#FD8F2D` → `#FF6B00` used as
   text (`background-clip: text`). Caption sits under the number in small caps, white.
   The badge is the only element with a glow.
5. **Two product panels** — equal width, ~24 px gap, rounded 18 px corners. Each holds:
   - a product image area (~200 px tall) with a drop shadow, no frame;
   - the product name, centred, all caps, same heavy face as the headline but ~45 % size;
   - a two-column block: **left** a check list of 4 short benefits with a filled rounded
     square tick in the product accent; **right** a stack of 4 spec pills, right aligned,
     solid accent fill, white 600-weight text, 7 px radius.
6. **Footer** — centred three-line block: `ORDER NOW` (heavy caps), `Available Now At`
   (regular), then the domain in heavy brand orange with an orange glow.
7. **Category icon row** — two icon+label stacks at each bottom corner, stroke icons in
   brand orange, 12–13 px labels in `#C9D1DD`. Left pair names the two products being
   compared, right pair names the category ("Robotics", "Electronics Components").

### Reading rules the reference implies

- Contrast comes from **fill**, not from borders: panels are one step lighter than the
  background, pills are solid accent, ticks are solid accent with dark glyphs.
- Only two accents per poster (one per product), plus brand orange for the wordmark,
  `VS`, badge and domain. Nothing else is coloured.
- Everything is centred except the two lists inside each panel, which are left/right
  aligned towards the panel edges.
- All copy is short: 1 headline, 1 sub-line, 4 benefits, 4 specs per product.

---

## 2. Reference B — three-column SBC banner

File: `examples/Gemini_Generated_Image_k01u42k01u42k01u.jpg`, 1376 × 768, landscape banner.

Same navy field (`#101020` family) with the same orange bloom, but laid out as a rail plus
three columns separated by thin vertical rules.

- **Left rail (~20 % width)** — three-line headline in heavy caps: `CHOOSE THE` (white),
  `RIGHT SBC` (orange), then a smaller white sub-line and a third line of category words
  separated by orange bullets (`IoT • AIoT • EDGE AI`). Reversed elephant mark sits below
  the copy, with the wordmark under it and `elephantronics.lk` beneath that.
- **Three columns** — each starts with an orange tier label and a white application line
  (`LOW BUDGET —` / `IoT & EMBEDDED`), then a large product render mid-column with small
  scene illustrations around it (a plant sensor, a gauge cluster, robot arms, an AI core),
  then a caption at the bottom naming the use case ("Home automation", "Industrial
  monitoring", "Local AI computing").
- **Bottom right** — a small framed product shot with a caption and a
  `* Reference comparison` footnote. That footnote is the honesty marker: the product
  shown is a competitor, said out loud.

This banner is the correct shape for a **3-way** comparison or a category explainer; the
square reference is the correct shape for a **2-way** comparison.

---

## 3. Reference C — four-board retail poster

File: `examples/850903018_122121159189421597_6460390237375443997_n.jpg`, 1024 × 1024.
This one is **not** a Gemini render: it is a downloaded Facebook post, so it is the
retail page's current house style, not a concept.

### Measured palette

| Role | Hex | Where |
| --- | --- | --- |
| Background navy, top | `#001028` | header field |
| Background navy, lower | `#001838` | behind the panels |
| Panel fill | `#000818` – `#001020` | inside each product panel |
| Panel 1 accent | blue `#055499` | border, tick marks, price pill |
| Panel 2 accent | red `#AF0E06` | same |
| Panel 3 accent | green `#307405` | same |
| Panel 4 accent | gold `#C58C07` | same |
| Headline white | distressed white | `DEVELOPMENT` |
| Headline gold | `#F1AA10` | `BOARDS` |
| Skewed badge, upper slab | red `#9C0401` | `4 BOARDS.` |
| Skewed badge, lower slab | gold `#F2A90E` | `UNLIMITED PROJECTS!` |
| Promo band | gold `#F2A90E`, navy text | `4 POWERFUL BOARDS.` |
| Best-price block | orange `#E15402` | bottom-left |
| Order-now block | red `#94020D` | bottom-right |
| URL band | gold, dark text | `elephantronics.lk` |
| WhatsApp mark only | green `#17A247` | bottom-left icon |

Background carries a blue circuit/ray graphic fading down from the top right, not the
orange bloom of the other two references.

### Anatomy

1. **Header, left-aligned** — reversed elephant + two-colour wordmark and
   `POWERING YOUR IDEAS` at ~40 px, then a two-line distressed headline
   (`DEVELOPMENT` white, `BOARDS` gold) filling the left half.
2. **Skewed badge, top right** — two parallelogram slabs stacked and tilted ~4°, red over
   gold, plus a lightning-bolt icon; the only element with a hard shadow.
3. **Promo band** — a gold bar with a right-slanted end, navy bold text, sitting under the
   headline; the second line is white distressed caps with a rocket emoji.
4. **Four equal panels** — 4 columns, ~14 px gaps, ~222 px wide (21.7 % of canvas) and
   ~385 px tall (37.6 %), each framed by a 2 px accent border and a dark fill. Inside, top
   to bottom: product name in accent colour, parenthesised variant line (`(CH340)`),
   tilted product photo, 3–4 tick lines in the accent colour, then a solid accent price
   pill spanning the panel width with a large white price and small `ONLY`.
5. **Category strip** — one dark bar with five white line-icon cells divided by thin rules
   (`PERFECT FOR ARDUINO`, `ROBOTICS & DRONES`, `IOT & HOME AUTOMATION`,
   `STUDENT PROJECTS`, `RESEARCH & INNOVATION`).
6. **Three-block band** — orange best-price guarantee, navy island-wide delivery with the
   free-over threshold, red order-now block with the domain on a gold sub-band.
7. **Bottom strip** — WhatsApp number against a green mark, then six small uppercase
   icon labels (maker community, DIY, embedded systems, robotics, IoT, STEM).
8. **Hashtag line** — one row of 11 hashtags along the bottom edge.

### Style conflict this reference creates

Reference C is the style the brand work deliberately moved away from. It uses distressed
texture, skewed slabs, an emoji, and **six** accent colours (blue, red, green, gold,
orange, WhatsApp green) against the five in `brand.txt`. It is also the layout the app's
original Poster tab defaults were written for (`4 SENSORS.` / `UNLIMITED PROJECTS!`).

So the app now has two possible retail looks: the clean Gemini-style art that was just
approved, or this published grunge style. The structural borrowings — four equal panels,
per-panel accent, price pill in the panel, category strip, three-block CTA band — are
style-neutral and can be built either way. Which look governs retail posts is a decision
for the user, recorded in §6.

---

## 4. What the app now reproduces

`lib/local-comparison.js` renders the square comparison layout from the same data the
Comparison tab already collects, plus two photos and an optional badge:

| Reference element | Implemented |
| --- | --- |
| Navy field + orange bloom + fading grid | yes (`radial-gradient` + `repeating-linear-gradient` with a radial mask) |
| Centred lockup with real logo file + tagline | yes, logo comes from `BRAND_ROOT` via `/api/assets` |
| One-line heavy headline with orange `VS` | yes, font size steps down at 18 / 23 / 30 characters |
| Glowing double-border badge with gradient text | yes, badge is omitted entirely when no discount text is given |
| Two panels with accent border | yes, 2 px accent overlay at 35 % opacity |
| Ticked benefit list | yes, 4 max, tick glyph is the dark navy on the accent fill |
| Solid spec pills | yes, 4 max, right aligned |
| Footer CTA / "Available Now At" / domain | yes |
| Category icon row | yes, four stroke icons drawn inline so no font or file is needed |
| Product renders | **not** reproduced — photos come from brand assets or show a dashed placeholder |

Wired end to end: the Image tab has a **Single product / Product comparison** switch,
`POST /api/poster` takes `layout: "comparison"`, and `GET /api/images` picks up the result
in `D:\gen_fb_post\output`. Verified 15 Nov 2026 through the UI (0 page errors, 1080×1080
PNG plus `.txt` sidecar).

`lib/local-grid.js` renders reference C's four-panel layout with two presets:

| Reference C element | `clean` preset | `retail` preset |
| --- | --- | --- |
| Header: logo, wordmark, tagline, two-line headline | yes, brand navy field with an orange bloom | yes, `#001028`→`#001838` field with a blue bloom |
| Skewed two-slab badge, top right | straight slabs, orange over navy | 4° tilt, red `#9C0401` over gold `#F2A90E` |
| Promo band under the headline | solid orange bar | gold bar, skewed end |
| Four panels with accent border, name, variant, photo, ticks, price pill | accent cycles Orange → Steel Blue → Grey → White | accent cycles blue → red → green → gold, white pill text |
| Category strip, 5 cells | same, brand typeset | same |
| Three-block CTA band | orange / navy / orange | orange `#E15402` / navy / red `#94020D` with gold url band |
| WhatsApp number, six icon labels, hashtag row | yes | yes |
| Grunge texture and displaced type | none | grain overlay at 0.22 + an SVG displacement filter on the headline |

Both presets render at 1:1, 4:5, 9:16 and 16:9, consume `photo_1`–`photo_4`, and take an
optional per-panel accent from the panel's own select.

---

## 5. Deviations from `brand.txt`

1. **Steel Blue `#2A648C` is a fourth accent, comparisons only.** `brand.txt` allows five
   colours (`#FF6B00`, `#151B2B`, `#182033`, `#FFFFFF`, `#808080`). The reference uses a
   second product accent so the two panels read as a comparison rather than as two ads;
   blue is the only colour that does that without competing with orange. Decided
   15 Nov 2026: keep it, but only in the comparison renderer. The single-product and
   Hero tabs stay on Orange / White / Grey, and the prompt templates are unchanged.
2. **Panel navy differs from brand navy.** Panels are `#1A2131` and the field is `#0F1626`
   because the reference separates card from background by a subtle step; brand navy
   `#151B2B` sits between the two and is used as the base in the single-product renderer.
3. **No confirmed typeface.** The reference is a heavy grotesque. The renderer uses
   `Arial Black` with `Impact` and `Segoe UI` fallbacks, all at negative tracking, because
   `brand.txt` names no font. Swap the stack once a font is licensed.
4. **Glow.** Glow, gradients and bloom are not in `brand.txt`. They are borrowed from the
   reference; they are used only on the badge, the domain and the background bloom.
5. **The `retail` preset deliberately breaks the palette.** It adds blue `#055499`, red
   `#AF0E06`, green `#307405` and gold `#C58C07`, plus grunge type, tilted slabs and a
   rocket-free text-only promo. That is the published retail post's style, kept as an
   opt-in preset at the user's request (15 Nov 2026), not as a new brand standard. The
   `clean` preset remains the default and is what the prompt templates describe.

---

## 6. Gaps before this can ship as a real post

- Product photos: the panels need cut-out renders on transparent or dark backgrounds.
  `brand.txt` has none, so the renderer falls back to a dashed labelled box.
- Three-way comparison (the banner layout, reference B) is not implemented.
- No claim guard: nothing stops a user typing "6 TOPS" on a Base Squirrel or a
  "dual 1 GbE" line. Decisions D-012 to D-025 are still prose only.
- Prices typed into the badge, panels or pills are free text, so a made-up figure can go
  out looking like a real price. The reference's "LKR 950" style values in our tests are
  placeholders copied from the published post, not confirmed prices.
- The `retail` preset has no accent-contrast check: grey names on the dark panel sit near
  3:1, which is fine for a heading but not for body copy.
- AI-generated background art (AI Horde, Cloudflare) cannot be used as a panel photo yet:
  `photo_path` only accepts files under `BRAND_ROOT`. Until that changes, generated art
  stays a separate image rather than a layer under a finished poster.
