"use strict";

/**
 * Local comparison-infographic renderer.
 *
 * Reproduces the layout of `examples/Gemini_Generated_Image_b36ja4b36ja4b36j.png`:
 * centred logo lockup, "A VS B" headline, discount badge, two product panels
 * with feature lists and spec pills, then the commercial footer.
 *
 * Colours are sampled from that reference: background #0F1626, panels #1A2131,
 * glow orange #FD8F2D over brand orange #FF6B00, steel blue #2A648C for the
 * first product. Product photos are optional; without one the panel shows a
 * labelled placeholder.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { renderWithChrome, SIZES } = require("./local-poster");

const MIME_BY_EXT = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

const ACCENTS = {
  Orange: { solid: "#FF6B00", pill: "#C2560F", soft: "rgba(255,107,0,.18)" },
  "Steel Blue": { solid: "#2A648C", pill: "#2A648C", soft: "rgba(42,100,140,.22)" },
  White: { solid: "#FFFFFF", pill: "#3A4356", soft: "rgba(255,255,255,.14)" },
  Grey: { solid: "#808080", pill: "#4A5262", soft: "rgba(128,128,128,.20)" },
};

function accentOf(name) {
  return ACCENTS[String(name || "").trim()] || ACCENTS.Orange;
}

function esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

const ICON = {
  board: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="7" y="12" width="34" height="24" rx="3"/><rect x="14" y="19" width="10" height="10" rx="1.5"/><circle cx="33" cy="21" r="2"/><circle cx="33" cy="28" r="2"/></svg>`,
  chip: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="14" y="14" width="20" height="20" rx="2"/><path d="M19 14V8M24 14V8M29 14V8M19 40v-6M24 40v-6M29 40v-6M14 19H8M14 24H8M14 29H8M40 19h-6M40 24h-6M40 29h-6"/></svg>`,
  robot: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="11" y="17" width="26" height="19" rx="4"/><circle cx="19" cy="26" r="2.2"/><circle cx="29" cy="26" r="2.2"/><path d="M24 17V11M24 11h-4M24 11h4"/><path d="M17 36v4M31 36v4"/></svg>`,
  plug: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 8v10M30 8v10"/><path d="M13 18h22v6a11 11 0 0 1-11 11 11 11 0 0 1-11-11z"/><path d="M24 35v7"/></svg>`,
};

function buildComparisonHtml(data) {
  const d = data || {};
  const [W, H] = SIZES[d.aspect_ratio] || SIZES["1:1"];
  const u = Math.min(W, H) / 1080;

  const a = d.products && d.products[0] ? d.products[0] : {};
  const b = d.products && d.products[1] ? d.products[1] : {};
  const nameA = String(a.name || "PRODUCT 1").trim();
  const nameB = String(b.name || "PRODUCT 2").trim();
  const accentA = accentOf(a.accent || a.highlight_color);
  const accentB = accentOf(b.accent || b.highlight_color || "Steel Blue");

  const title = String(d.comparison_title || "").trim() || `${nameA} VS ${nameB}`;
  const subtitle = String(d.comparison_subtitle || "").trim();
  const discountAmount = String(d.discount_amount || "").trim();
  const discountText = String(d.discount_text || "").trim();
  const cta = String(d.cta || d.cta_text || "BUILD • CREATE • INNOVATE").trim();
  const website = String(d.website || "elephantronics.lk").trim();
  const tagline = String(d.tagline || "POWERING YOUR IDEAS").trim();

  const logoUri = dataUri(d.logo_path);
  const photoA = dataUri(d.photo_1);
  const photoB = dataUri(d.photo_2);

  /* "ARDUINO UNO VS ESP32" — the separator is orange in the reference. */
  let headlineHtml;  const vsMatch = title.match(/^(.*?)\s+vs\.?\s+(.*)$/i);
  if (vsMatch) {
    headlineHtml = `${esc(vsMatch[1])} <span class="vs">VS</span> ${esc(vsMatch[2])}`;
  } else {
    const words = title.split(/\s+/);
    if (words.length > 1) {
      const cut = Math.ceil(words.length / 2);
      headlineHtml = `${esc(words.slice(0, cut).join(" "))} <span class="vs">${esc(words.slice(cut).join(" "))}</span>`;
    } else {
      headlineHtml = esc(title);
    }
  }

  const panel = (p, accent, photoUri, fallbackName) => {    const feats = (Array.isArray(p.features) ? p.features : String(p.features || "").split(/,|\n/))
      .map((f) => String(f || "").trim())
      .filter(Boolean)
      .slice(0, 4);
    const specs = (Array.isArray(p.specs) ? p.specs : String(p.specs || "").split(/,|\n/))
      .map((s) => String(s || "").trim())
      .filter(Boolean)
      .slice(0, 4);
    const featRows = feats.length
      ? feats
          .map((f) => `<li><i style="background:${accent.solid};color:#0F1626">✓</i><span>${esc(f)}</span></li>`)
          .join("")
      : `<li><i style="background:${accent.solid};color:#0F1626">✓</i><span class="muted">add features</span></li>`;
    const specRows = specs
      .map((s) => `<li style="background:${accent.pill}">${esc(s)}</li>`)
      .join("");
    const photo = photoUri
      ? `<img src="${photoUri}" alt="${esc(fallbackName)}" />`
      : `<div class="ph" style="border-color:${accent.solid}55;background:${accent.soft}">${esc(fallbackName)}</div>`;

    return `<section class="panel" style="--accent:${accent.solid};--soft:${accent.soft}">
        <div class="photo">${photo}</div>
        <h3>${esc(p.name || fallbackName)}</h3>
        <div class="cols">
          <ul class="feats">${featRows}</ul>
          <ul class="specs">${specRows || '<li style="background:' + accent.pill + '">add specs</li>'}</ul>
        </div>
      </section>`;
  };

  // keep the headline on one line: shrink as the title gets longer
  const titleLen = title.length;
  const titleSize = titleLen <= 18 ? 72 : titleLen <= 23 ? 62 : titleLen <= 30 ? 52 : 44;

  const badge = discountAmount
    ? `<div class="badge">
        <div class="amount">${esc(discountAmount)}</div>
        ${discountText ? `<div class="badge-caption">${esc(discountText)}</div>` : ""}
      </div>`
    : "";

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
  body {
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    background: #0F1626;
    color: #FFFFFF;
    position: relative;
  }
  .bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(circle at 50% 46%, rgba(255,107,0,.13) 0%, rgba(255,107,0,0) 52%),
      radial-gradient(circle at 8% 30%, rgba(42,100,140,.16) 0%, rgba(42,100,140,0) 42%),
      radial-gradient(circle at 94% 34%, rgba(255,107,0,.10) 0%, rgba(255,107,0,0) 40%),
      #0F1626;
  }
  .traces {
    position: absolute; inset: 0;
    background-image:
      repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 1px, transparent 1px ${76 * u}px),
      repeating-linear-gradient(0deg, rgba(255,255,255,.028) 0 1px, transparent 1px ${76 * u}px);
    mask-image: radial-gradient(circle at 50% 50%, transparent 30%, #000 96%);
  }
  .frame {
    position: relative; width: 100%; height: 100%;
    padding: ${40 * u}px ${56 * u}px ${30 * u}px;
    display: flex; flex-direction: column; align-items: center;
  }

  .lockup { display: flex; align-items: center; gap: ${16 * u}px; }
  .logo { height: ${84 * u}px; width: auto; display: block; }
  .wordmark { font-size: ${52 * u}px; font-weight: 800; letter-spacing: ${-1 * u}px; line-height: 1; }
  .wordmark .o { color: #FF6B00; }
  .wordmark .w { color: #FFFFFF; }
  .tagline { font-size: ${15 * u}px; letter-spacing: ${6 * u}px; color: #9AA3B2; font-weight: 600; text-transform: uppercase; margin-top: ${6 * u}px; }

  h1 {
    font-family: "Arial Black", "Impact", "Segoe UI", sans-serif;
    font-size: ${titleSize * u}px; line-height: 1.02; text-transform: uppercase;
    text-align: center; letter-spacing: ${-1.5 * u}px; margin-top: ${20 * u}px;
    text-shadow: 0 ${8 * u}px ${26 * u}px rgba(0,0,0,.5);
    white-space: nowrap;
  }
  h1 .vs { color: #FF6B00; }
  .sub { font-size: ${31 * u}px; color: #E8ECF3; text-align: center; margin-top: ${8 * u}px; }

  .badge {
    margin-top: ${14 * u}px;
    border: ${3 * u}px solid #FD8F2D; border-radius: ${16 * u}px;
    box-shadow: 0 0 ${34 * u}px rgba(253,143,45,.45), inset 0 0 ${26 * u}px rgba(253,143,45,.18);
    background: linear-gradient(180deg, rgba(253,143,45,.10), rgba(15,22,38,.55));
    padding: ${12 * u}px ${34 * u}px ${14 * u}px; text-align: center;
  }
  .amount {
    font-family: "Arial Black", "Impact", sans-serif;
    font-size: ${74 * u}px; line-height: .95;
    background: linear-gradient(180deg, #FFC089 0%, #FD8F2D 45%, #FF6B00 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .badge-caption { font-size: ${19 * u}px; letter-spacing: ${1.5 * u}px; font-weight: 700; text-transform: uppercase; color: #FFFFFF; margin-top: ${2 * u}px; }

  .panels { display: flex; gap: ${26 * u}px; width: 100%; flex: 1; min-height: 0; margin-top: ${16 * u}px; }
  .panel {
    flex: 1; background: #1A2131; border: ${1.5 * u}px solid #2B3549;
    border-radius: ${18 * u}px; padding: ${18 * u}px ${20 * u}px ${20 * u}px;
    display: flex; flex-direction: column; position: relative;
    box-shadow: 0 ${12 * u}px ${30 * u}px rgba(0,0,0,.35);
  }
  .panel::before {
    content: ""; position: absolute; inset: 0; border-radius: ${18 * u}px;
    border: ${2 * u}px solid var(--accent); opacity: .35; pointer-events: none;
  }
  .photo { height: ${188 * u}px; display: flex; align-items: center; justify-content: center; }
  .photo img { max-height: 100%; max-width: 100%; object-fit: contain; filter: drop-shadow(0 ${12 * u}px ${22 * u}px rgba(0,0,0,.55)); }
  .ph {
    width: 100%; height: 100%; border-radius: ${12 * u}px;
    border: ${2 * u}px dashed; display: flex; align-items: center; justify-content: center;
    font-size: ${19 * u}px; letter-spacing: ${2 * u}px; text-transform: uppercase;
    color: #8A93A3; text-align: center; padding: 0 ${14 * u}px; font-weight: 600;
  }
  .panel h3 {
    font-family: "Arial Black", "Impact", sans-serif;
    font-size: ${34 * u}px; text-transform: uppercase; text-align: center;
    letter-spacing: ${.5 * u}px; margin: ${10 * u}px 0 ${14 * u}px;
  }
  .cols { display: flex; gap: ${12 * u}px; flex: 1; }
  ul { list-style: none; }
  .feats { flex: 1.35; display: flex; flex-direction: column; gap: ${7 * u}px; }
  .feats li { display: flex; gap: ${8 * u}px; align-items: flex-start; font-size: ${18 * u}px; line-height: 1.25; color: #E8ECF3; }
  .feats li i {
    flex: 0 0 auto; width: ${18 * u}px; height: ${18 * u}px; border-radius: ${4 * u}px;
    display: inline-flex; align-items: center; justify-content: center;
    font-style: normal; font-size: ${12 * u}px; font-weight: 900; margin-top: ${2 * u}px;
  }
  .feats .muted { color: #7B8494; }
  .specs { flex: 1; display: flex; flex-direction: column; gap: ${5 * u}px; }
  .specs li {
    color: #FFFFFF; font-size: ${15.5 * u}px; font-weight: 600; line-height: 1.15;
    padding: ${5 * u}px ${9 * u}px; border-radius: ${7 * u}px; text-align: right;
  }

  .footer { width: 100%; margin-top: ${14 * u}px; }
  .footrow { display: flex; align-items: flex-end; justify-content: space-between; gap: ${16 * u}px; }
  .footcenter { flex: 1; text-align: center; }
  .cta {
    font-family: "Arial Black", "Impact", sans-serif;
    font-size: ${31 * u}px; letter-spacing: ${1 * u}px; text-transform: uppercase; white-space: nowrap;
  }
  .avail { font-size: ${20 * u}px; color: #E8ECF3; margin-top: ${4 * u}px; }
  .site {
    font-family: "Arial Black", "Impact", sans-serif;
    font-size: ${40 * u}px; color: #FF6B00; margin-top: ${2 * u}px; white-space: nowrap;
    text-shadow: 0 0 ${20 * u}px rgba(255,107,0,.45);
  }

  .cats { display: flex; gap: ${18 * u}px; flex: 0 0 auto; }
  .cat { display: flex; flex-direction: column; align-items: center; gap: ${4 * u}px; width: ${96 * u}px; }
  .cat svg { width: ${44 * u}px; height: ${44 * u}px; color: #FF6B00; }
  .cat span { font-size: ${12 * u}px; color: #C9D1DD; text-align: center; line-height: 1.15; }
</style></head>
<body>
  <div class="bg"></div>
  <div class="traces"></div>
  <div class="frame">
    <div class="lockup">
      ${logoUri ? `<img class="logo" src="${logoUri}" alt="" />` : ""}
      <span class="wordmark"><span class="o">Elephant</span><span class="w">ronics</span></span>
    </div>
    <div class="tagline">${esc(tagline)}</div>

    <h1>${headlineHtml}</h1>
    ${subtitle ? `<div class="sub">${esc(subtitle)}</div>` : ""}
    ${badge}

    <div class="panels">
      ${panel(a, accentA, photoA, nameA)}
      ${panel(b, accentB, photoB, nameB)}
    </div>

    <div class="footer">
      <div class="footrow">
        <div class="cats left">
          <div class="cat">${ICON.board}<span>${esc(nameA)}</span></div>
          <div class="cat">${ICON.chip}<span>${esc(nameB)}</span></div>
        </div>
        <div class="footcenter">
          <div class="cta">${esc(cta)}</div>
          <div class="avail">Available Now At</div>
          <div class="site">${esc(website)}</div>
        </div>
        <div class="cats right">
          <div class="cat">${ICON.robot}<span>Robotics</span></div>
          <div class="cat">${ICON.plug}<span>Electronics<br/>Components</span></div>
        </div>
      </div>
    </div>
  </div>
</body></html>`;
}

async function renderComparison(data) {
  const d = data || {};
  const [W, H] = SIZES[d.aspect_ratio] || SIZES["1:1"];
  const html = buildComparisonHtml(d);

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "cmp-"));
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

module.exports = { renderComparison, buildComparisonHtml, ACCENTS };
