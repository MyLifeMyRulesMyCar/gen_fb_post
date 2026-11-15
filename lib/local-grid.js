"use strict";

/**
 * Local four-panel poster renderer.
 *
 * Layout borrowed from `examples/850903018_122121159189421597_6460390237375443997_n.jpg`
 * (the published retail post): left-aligned header with a two-line headline, a skewed
 * badge top right, four equal product panels with a price pill each, a category strip,
 * a three-block CTA band and a bottom strip.
 *
 * Two presets:
 *   clean  — brand.txt palette, clean type, no texture (the Gemini-reference look)
 *   retail — measured colours and grunge texture from that published post
 *
 * Colours for `retail` are sampled from the reference: bg #001028/#001838,
 * panels #000818, blue #055499, red #AF0E06, green #307405, gold #C58C07,
 * badge red #9C0401 over gold #F2A90E, headline gold #F1AA10, CTA orange #E15402,
 * order red #94020D.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { renderWithChrome, SIZES } = require("./local-poster");

const MIME_BY_EXT = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

const PRESETS = {
  clean: {
    bgTop: "#151B2B",
    bgBottom: "#151B2B",
    bloom: "radial-gradient(circle at 50% 26%, rgba(255,107,0,.16) 0%, rgba(255,107,0,0) 46%), radial-gradient(circle at 88% 82%, rgba(42,100,140,.18) 0%, rgba(42,100,140,0) 44%)",
    panelFill: "#182033",
    panelEdge: "#2B3549",
    accents: ["#FF6B00", "#2A648C", "#808080", "#FFFFFF"],
    pillText: "#151B2B",
    headline1: "#FFFFFF",
    headline2: "#FF6B00",
    badge1: { bg: "#FF6B00", fg: "#151B2B" },
    badge2: { bg: "#151B2B", fg: "#FFFFFF" },
    promo: { bg: "#FF6B00", fg: "#151B2B" },
    best: { bg: "#FF6B00", fg: "#151B2B" },
    delivery: { bg: "#182033", fg: "#FFFFFF" },
    order: { bg: "#FF6B00", fg: "#151B2B" },
    url: { bg: "#151B2B", fg: "#FF6B00" },
    tick: true,
    skew: 0,
    grain: 0,
    rough: false,
    headFont: `"Arial Black", "Segoe UI", Arial, sans-serif`,
    bodyFont: `"Segoe UI", "Helvetica Neue", Arial, sans-serif`,
  },
  retail: {
    bgTop: "#001028",
    bgBottom: "#001838",
    bloom: "radial-gradient(circle at 78% 8%, rgba(21,86,160,.55) 0%, rgba(21,86,160,0) 46%), radial-gradient(circle at 18% 92%, rgba(255,107,0,.14) 0%, rgba(255,107,0,0) 40%)",
    panelFill: "#000818",
    panelEdge: "#12283F",
    accents: ["#055499", "#AF0E06", "#307405", "#C58C07"],
    pillText: "#FFFFFF",
    headline1: "#F4F4F4",
    headline2: "#F1AA10",
    badge1: { bg: "#9C0401", fg: "#FFFFFF" },
    badge2: { bg: "#F2A90E", fg: "#141414" },
    promo: { bg: "#F2A90E", fg: "#101820" },
    best: { bg: "#E15402", fg: "#FFFFFF" },
    delivery: { bg: "#001030", fg: "#FFFFFF" },
    order: { bg: "#94020D", fg: "#FFFFFF" },
    url: { bg: "#F2A90E", fg: "#141414" },
    tick: true,
    skew: -4,
    grain: 0.22,
    rough: true,
    headFont: `"Arial Black", Impact, "Segoe UI", sans-serif`,
    bodyFont: `"Segoe UI", "Helvetica Neue", Arial, sans-serif`,
  },
};

function presetOf(name) {
  return PRESETS[String(name || "").trim()] || PRESETS.clean;
}

function esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function listOf(v, max) {
  const arr = Array.isArray(v) ? v : String(v || "").split(/,|\n/);
  return arr
    .map((x) => String(x == null ? "" : x).trim())
    .filter(Boolean)
    .slice(0, max);
}

function dataUri(filePath) {
  if (!filePath) return "";
  try {
    if (!fs.existsSync(filePath)) return "";
    const mime = MIME_BY_EXT[path.extname(filePath).toLowerCase()];
    if (!mime) return "";
    return `data:${mime};base64,${fs.readFileSync(filePath).toString("base64")}`;
  } catch (e) {
    return "";
  }
}

const CAT_ICONS = [
  `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="12" y="12" width="24" height="24" rx="4"/><rect x="19" y="19" width="10" height="10" rx="1.5"/><path d="M18 6v6M26 6v6M18 36v6M26 36v6M6 18h6M6 26h6M36 18h6M36 26h6"/></svg>`,
  `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M10 30v-7a14 14 0 0 1 28 0v7"/><path d="M6 30h6v8H8a2 2 0 0 1-2-2z"/><path d="M42 30h-6v8h4a2 2 0 0 0 2-2z"/><circle cx="24" cy="15" r="2.5"/></svg>`,
  `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M8 22 24 9l16 13"/><path d="M12 22v17h24V22"/><path d="M21 39V28h6v11"/></svg>`,
  `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M24 9 6 18l18 9 18-9z"/><path d="M12 22v9c0 3 5 6 12 6s12-3 12-6v-9"/><path d="M42 18v11"/></svg>`,
  `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M24 6a10 10 0 0 1 7 17c-1 1-1.5 2-1.5 3H18.5c0-1-.5-2-1.5-3A10 10 0 0 1 24 6z"/><path d="M19 30h10M20.5 34h7M22 38h4"/></svg>`,
  `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="24" cy="24" r="4"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M12 12l4 4M32 32l4 4M36 12l-4 4M16 32l-4 4"/></svg>`,
];

function buildGridHtml(data) {
  const d = data || {};
  const [W, H] = SIZES[d.aspect_ratio] || SIZES["1:1"];
  const u = Math.min(W, H) / 1080;
  const p = presetOf(d.style);

  const products = (Array.isArray(d.products) ? d.products : []).slice(0, 4);
  while (products.length < 4) products.push({});

  const headline1 = String(d.headline_1 || "").trim() || "DEVELOPMENT";
  const headline2 = String(d.headline_2 || "").trim() || "BOARDS";
  const promo = String(d.promo || "").trim();
  const promoTag = String(d.promo_tagline || "").trim();
  const badgeTop = String(d.badge_top || "").trim();
  const badgeBottom = String(d.badge_bottom || "").trim();
  const website = String(d.website || "elephantronics.lk").trim();
  const cta = String(d.cta || "ORDER NOW").trim();
  const whatsapp = String(d.whatsapp || "").trim();
  const delivery = String(d.delivery_note || "").trim();
  const best = String(d.best_price || "").trim();
  const hashtags = String(d.hashtags || "").trim();
  const tagline = String(d.tagline || "POWERING YOUR IDEAS").trim();
  const logoUri = dataUri(d.logo_path);

  const panel = (prod, i) => {
    const accent = prod.accent && /^#[0-9a-f]{6}$/i.test(prod.accent) ? prod.accent : p.accents[i % p.accents.length];
    const name = String(prod.name || `PRODUCT ${i + 1}`).trim();
    const desc = String(prod.desc || "").trim();
    const feats = listOf(prod.features, 4);
    const price = String(prod.price || "").trim();
    const priceSize = price.length <= 11 ? 24 : price.length <= 15 ? 21 : 18;
    const photo = dataUri(d["photo_" + (i + 1)]);

    const ticks = feats.length
      ? feats
          .map(
            (f) =>
              `<li><i style="background:${accent}">${p.tick ? "✔" : "•"}</i><span>${esc(f)}</span></li>`
          )
          .join("")
      : `<li><i style="background:${accent}">${p.tick ? "✔" : "•"}</i><span class="muted">add features</span></li>`;

    return `<section class="panel" style="--accent:${accent}">
        <h3 style="color:${accent}">${esc(name)}</h3>
        ${desc ? `<div class="desc">${esc(desc)}</div>` : ""}
        <div class="shot">${
          photo
            ? `<img src="${photo}" alt="" />`
            : `<div class="ph" style="border-color:${accent}66;background:${accent}14">${esc(name)}</div>`
        }</div>
        <ul class="ticks">${ticks}</ul>
        ${
          price
            ? `<div class="price" style="background:${accent};color:${p.pillText};font-size:${priceSize * u}px">${esc(price)}</div>`
            : ""
        }
      </section>`;
  };

  const cats = [
    "PERFECT FOR ARDUINO",
    "ROBOTICS & DRONES",
    "IOT & HOME AUTOMATION",
    "STUDENT PROJECTS",
    "RESEARCH & INNOVATION",
  ];

  const bottomLabels = ["MAKER COMMUNITY", "DIY", "EMBEDDED SYSTEMS", "ROBOTICS", "IOT", "STEM"];

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
  body {
    font-family: ${p.bodyFont};
    background: linear-gradient(180deg, ${p.bgTop} 0%, ${p.bgBottom} 100%);
    color: #FFFFFF;
    position: relative;
  }
  .bloom { position: absolute; inset: 0; background: ${p.bloom}; }
  .frame { position: relative; width: 100%; height: 100%; padding: ${26 * u}px ${24 * u}px ${18 * u}px; display: flex; flex-direction: column; }

  .head { position: relative; flex: 0 0 auto; padding-left: ${6 * u}px; }
  .lockup { display: flex; align-items: center; gap: ${10 * u}px; }
  .logo { height: ${46 * u}px; width: auto; }
  .wordmark { font-size: ${30 * u}px; font-weight: 800; letter-spacing: ${-.5 * u}px; }
  .wordmark .o { color: #FF6B00; }
  .tagline { font-size: ${12 * u}px; letter-spacing: ${4.5 * u}px; color: #C9D1DD; margin-top: ${3 * u}px; text-transform: uppercase; font-weight: 600; }

  h1 { margin-top: ${10 * u}px; line-height: .94; letter-spacing: ${-1 * u}px; text-transform: uppercase; font-family: ${p.headFont}; font-size: ${78 * u}px; }
  h1 span { display: block; }
  h1 .l1 { color: ${p.headline1}; }
  h1 .l2 { color: ${p.headline2}; }
  ${p.rough ? `h1, .promo .p1, .promo .p2 { filter: url(#rough); }` : ""}

  .promo { display: inline-flex; flex-direction: column; align-items: flex-start; margin-top: ${8 * u}px; }
  .promo .p1 {
    background: ${p.promo.bg}; color: ${p.promo.fg};
    font-family: ${p.headFont}; font-size: ${21 * u}px; letter-spacing: ${.3 * u}px;
    padding: ${3 * u}px ${12 * u}px ${4 * u}px; text-transform: uppercase;
    transform: skewX(${p.skew}deg);
  }
  .promo .p2 {
    font-family: ${p.headFont}; font-size: ${26 * u}px; letter-spacing: ${.2 * u}px;
    text-transform: uppercase; margin-top: ${4 * u}px; color: ${p.headline1};
  }

  .badge { position: absolute; top: ${-4 * u}px; right: ${-6 * u}px; transform: rotate(${p.skew}deg); text-align: center; }
  .badge span { display: block; font-family: ${p.headFont}; text-transform: uppercase; box-shadow: 0 ${3 * u}px ${8 * u}px rgba(0,0,0,.45); }
  .badge .b1 { background: ${p.badge1.bg}; color: ${p.badge1.fg}; font-size: ${30 * u}px; padding: ${5 * u}px ${18 * u}px ${6 * u}px; }
  .badge .b2 { background: ${p.badge2.bg}; color: ${p.badge2.fg}; font-size: ${18 * u}px; padding: ${4 * u}px ${16 * u}px ${5 * u}px; margin-top: ${2 * u}px; }

  .panels { flex: 1 1 auto; min-height: 0; display: flex; gap: ${12 * u}px; margin-top: ${14 * u}px; }
  .panel {
    flex: 1; min-width: 0; background: ${p.panelFill};
    border: ${2 * u}px solid var(--accent); border-radius: ${8 * u}px;
    padding: ${10 * u}px ${10 * u}px ${10 * u}px;
    display: flex; flex-direction: column;
  }
  .panel h3 {
    font-family: ${p.headFont}; font-size: ${19 * u}px; text-align: center;
    text-transform: uppercase; letter-spacing: ${.2 * u}px; line-height: 1.05;
    min-height: ${40 * u}px; display: flex; align-items: center; justify-content: center;
  }
  .desc { font-size: ${13.5 * u}px; color: #DCE4EE; text-align: center; margin-top: ${2 * u}px; }
  .shot { flex: 1 1 auto; min-height: ${80 * u}px; display: flex; align-items: center; justify-content: center; margin: ${6 * u}px 0; }
  .shot img { max-width: 100%; max-height: 100%; object-fit: contain; transform: rotate(-2deg); filter: drop-shadow(0 ${8 * u}px ${14 * u}px rgba(0,0,0,.6)); }
  .ph {
    width: 100%; height: 100%; min-height: ${78 * u}px; border: ${2 * u}px dashed; border-radius: ${6 * u}px;
    display: flex; align-items: center; justify-content: center; text-align: center;
    font-size: ${12 * u}px; letter-spacing: ${1 * u}px; text-transform: uppercase;
    color: rgba(255,255,255,.55); padding: 0 ${6 * u}px;
  }
  .ticks { list-style: none; display: flex; flex-direction: column; gap: ${4 * u}px; margin-bottom: ${8 * u}px; }
  .ticks li { display: flex; gap: ${6 * u}px; align-items: flex-start; font-size: ${13.5 * u}px; line-height: 1.2; color: #F2F6FA; }
  .ticks i {
    flex: 0 0 auto; width: ${15 * u}px; height: ${15 * u}px; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    font-style: normal; font-size: ${9 * u}px; color: #FFFFFF; margin-top: ${1 * u}px;
  }
  .ticks .muted { color: rgba(255,255,255,.45); }
  .price {
    font-family: ${p.headFont}; font-size: ${24 * u}px; letter-spacing: ${.3 * u}px;
    text-align: center; padding: ${4 * u}px ${4 * u}px ${5 * u}px; border-radius: ${6 * u}px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .cats {
    flex: 0 0 auto; display: flex; margin-top: ${10 * u}px;
    background: ${p.panelFill}; border: 1px solid ${p.panelEdge}; border-radius: ${8 * u}px;
    overflow: hidden;
  }
  .cat { flex: 1; display: flex; align-items: center; justify-content: center; gap: ${7 * u}px; padding: ${8 * u}px ${4 * u}px; }
  .cat + .cat { border-left: 1px solid ${p.panelEdge}; }
  .cat svg { width: ${26 * u}px; height: ${26 * u}px; color: #FFFFFF; flex: 0 0 auto; }
  .cat span { font-size: ${10.5 * u}px; letter-spacing: ${.4 * u}px; line-height: 1.15; text-transform: uppercase; color: #E8EEF6; }

  .triband { flex: 0 0 auto; display: flex; gap: ${10 * u}px; margin-top: ${10 * u}px; }
  .triband > div { border-radius: ${8 * u}px; display: flex; align-items: center; justify-content: center; text-align: center; padding: ${8 * u}px ${10 * u}px; }
  .best {
    flex: 1; background: ${p.best.bg}; color: ${p.best.fg};
    font-family: ${p.headFont}; font-size: ${19 * u}px; text-transform: uppercase; line-height: 1.1;
  }
  .delivery { flex: 1.5; background: ${p.delivery.bg}; color: ${p.delivery.fg}; flex-direction: column; }
  .delivery .d1 { font-family: ${p.headFont}; font-size: ${19 * u}px; text-transform: uppercase; }
  .delivery .d2 { font-size: ${13 * u}px; letter-spacing: ${.8 * u}px; margin-top: ${2 * u}px; }
  .order { flex: 1.2; background: ${p.order.bg}; color: ${p.order.fg}; flex-direction: column; padding: 0; overflow: hidden; }
  .order .o1 { width: 100%; font-family: ${p.headFont}; font-size: ${22 * u}px; text-transform: uppercase; padding: ${6 * u}px 0 ${4 * u}px; }
  .order .o2 { width: 100%; background: ${p.url.bg}; color: ${p.url.fg}; font-family: ${p.headFont}; font-size: ${19 * u}px; padding: ${3 * u}px 0 ${4 * u}px; }

  .bottom { flex: 0 0 auto; display: flex; align-items: center; gap: ${8 * u}px; margin-top: ${9 * u}px; }
  .wa { display: flex; align-items: center; gap: ${7 * u}px; background: ${p.delivery.bg}; border: 1px solid ${p.panelEdge}; border-radius: ${8 * u}px; padding: ${5 * u}px ${10 * u}px; }
  .wa .dot { width: ${24 * u}px; height: ${24 * u}px; border-radius: 50%; background: #17A247; display: flex; align-items: center; justify-content: center; }
  .wa .dot svg { width: ${15 * u}px; height: ${15 * u}px; color: #FFFFFF; }
  .wa .num { font-family: ${p.headFont}; font-size: ${16 * u}px; color: #FFFFFF; white-space: nowrap; }
  .wa .lab { font-size: ${9.5 * u}px; letter-spacing: ${1.2 * u}px; color: #C9D1DD; }
  .labs { flex: 1; display: flex; justify-content: space-between; }
  .lab { display: flex; flex-direction: column; align-items: center; gap: ${2 * u}px; flex: 1; }
  .lab svg { width: ${22 * u}px; height: ${22 * u}px; color: #FFFFFF; opacity: .9; }
  .lab span { font-size: ${8.5 * u}px; letter-spacing: ${.3 * u}px; text-transform: uppercase; color: #C9D1DD; text-align: center; line-height: 1.1; }

  .tags { flex: 0 0 auto; margin-top: ${6 * u}px; text-align: center; font-size: ${11 * u}px; color: #B9C4D2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .grain { position: absolute; inset: 0; opacity: ${p.grain}; mix-blend-mode: overlay; pointer-events: none; }
</style></head>
<body>
  <div class="bloom"></div>
  ${
    p.rough
      ? `<svg width="0" height="0" style="position:absolute"><filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${3.5 * u}" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`
      : ""
  }
  <div class="frame">
    <div class="head">
      <div class="lockup">
        ${logoUri ? `<img class="logo" src="${logoUri}" alt="" />` : ""}
        <span class="wordmark"><span class="o">Elephant</span>ronics</span>
      </div>
      <div class="tagline">${esc(tagline)}</div>
      <h1><span class="l1">${esc(headline1)}</span><span class="l2">${esc(headline2)}</span></h1>
      <div class="promo">
        ${promo ? `<span class="p1">${esc(promo)}</span>` : ""}
        ${promoTag ? `<span class="p2">${esc(promoTag)}</span>` : ""}
      </div>
      <div class="badge">
        ${badgeTop ? `<span class="b1">${esc(badgeTop)}</span>` : ""}
        ${badgeBottom ? `<span class="b2">${esc(badgeBottom)}</span>` : ""}
      </div>
    </div>

    <div class="panels">${products.map((prod, i) => panel(prod, i)).join("")}</div>

    <div class="cats">
      ${cats.map((c, i) => `<div class="cat">${CAT_ICONS[i]}<span>${esc(c)}</span></div>`).join("")}
    </div>

    <div class="triband">
      ${best ? `<div class="best">${esc(best)}</div>` : ""}
      <div class="delivery">
        <span class="d1">Island-wide delivery</span>
        ${delivery ? `<span class="d2">${esc(delivery)}</span>` : ""}
      </div>
      <div class="order">
        <div class="o1">${esc(cta)}</div>
        <div class="o2">${esc(website)}</div>
      </div>
    </div>

    <div class="bottom">
      ${
        whatsapp
          ? `<div class="wa"><div class="dot"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.6-.1-1.3-.5-2.7-1.4-3.8-2.9-.9-1.2-1.3-2.2-1.3-3 0-.6.4-1.3.8-1.6.2-.2.4-.3.6-.3h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.5l-.4.5c-.1.2-.2.3 0 .5.4.7 1 1.4 1.7 1.9.4.2.6.3.8.1l.6-.6c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.2.3.4 0 .1 0 .4-.2.6z"/></svg></div><div><div class="lab">WHATSAPP</div><div class="num">${esc(whatsapp)}</div></div></div>`
          : ""
      }
      <div class="labs">
        ${bottomLabels
          .map((l, i) => `<div class="lab">${CAT_ICONS[i]}<span>${esc(l)}</span></div>`)
          .join("")}
      </div>
    </div>

    ${hashtags ? `<div class="tags">${esc(hashtags)}</div>` : ""}
  </div>
  ${
    p.grain
      ? `<svg class="grain" xmlns="http://www.w3.org/2000/svg"><filter id="grainf"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/></filter><rect width="100%" height="100%" filter="url(#grainf)"/></svg>`
      : ""
  }
</body></html>`;
}

async function renderGrid(data) {
  const d = data || {};
  const [W, H] = SIZES[d.aspect_ratio] || SIZES["1:1"];
  const html = buildGridHtml(d);

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "grid-"));
  const htmlFile = path.join(work, "poster.html");
  const outFile = path.join(work, "poster.png");
  fs.writeFileSync(htmlFile, html, "utf8");

  try {
    await renderWithChrome(htmlFile, outFile, W, H);
    return { pngPath: outFile, width: W, height: H, html };
  } finally {
    try {
      fs.rmSync(htmlFile, { force: true });
    } catch (e) {
      /* best effort */
    }
  }
}

module.exports = { renderGrid, buildGridHtml, PRESETS };
