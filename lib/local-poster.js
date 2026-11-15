"use strict";

/**
 * Local poster renderer.
 *
 * Turns the same structured fields as the Single Product Hero prompt into a
 * real PNG, using the actual logo file and the brand palette. No API, no cost.
 * Rendering is done by headless Chrome against a temporary HTML file.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

const SIZES = {
  "1:1": [1080, 1080],
  "4:5": [1080, 1350],
  "9:16": [1080, 1920],
  "16:9": [1920, 1080],
  "3:2": [1500, 1000],
  "2:3": [1000, 1500],
};

const MIME_BY_EXT = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
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
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_BY_EXT[ext];
    if (!mime) return "";
    return `data:${mime};base64,${fs.readFileSync(filePath).toString("base64")}`;
  } catch (e) {
    return "";
  }
}

function buildPosterHtml(data) {
  const d = data || {};
  const [W, H] = SIZES[d.aspect_ratio] || SIZES["1:1"];
  const u = Math.min(W, H) / 1080; // design unit: scales with the shorter side so nothing overflows
  const accent = ["Orange", "White", "Grey"].includes(d.accent) ? d.accent : "Orange";
  const accentHex = { Orange: "#FF6B00", White: "#FFFFFF", Grey: "#808080" }[accent];
  const tall = H / W > 1.5;
  const wide = W / H > 1.4;

  const kicker = String(d.kicker || "").trim();
  const headline = String(d.headline || d.product_name || "PRODUCT NAME").trim();
  const subhead = String(d.subhead || d.product_desc || "").trim();
  const price = String(d.price || "").trim();
  const wasPrice = String(d.was_price || "").trim();
  const badge = String(d.badge || d.badge_text || "").trim();
  const cta = String(d.cta || d.cta_text || "ORDER NOW").trim();
  const website = String(d.website || "elephantronics.lk").trim();
  const whatsapp = String(d.whatsapp || "").trim();
  const delivery = String(d.delivery_note || "").trim();
  const tagline = String(d.tagline || "POWERING YOUR IDEAS").trim();
  const features = (Array.isArray(d.features) ? d.features : String(d.features || "").split(/,|\n/))
    .map((f) => String(f || "").trim())
    .filter(Boolean)
    .slice(0, 6);

  const logoUri = dataUri(d.logo_path);
  const photoUri = dataUri(d.photo_path);

  const logoBlock = logoUri
    ? `<img class="logo" src="${logoUri}" alt="Elephantronics" />`
    : `<div class="wordmark"><span>Elephant</span><span class="w">ronics</span></div>`;

  const badges = badge
    ? `<div class="badge">${esc(badge)}</div>`
    : "";

  const kickerBlock = kicker ? `<div class="kicker">${esc(kicker)}</div>` : "";
  const subheadBlock = subhead ? `<div class="subhead">${esc(subhead)}</div>` : "";

  const priceBlock = price
    ? `<div class="price"><span class="now">${esc(price)}</span>${
        wasPrice ? `<span class="was">${esc(wasPrice)}</span>` : ""
      }</div>`
    : "";

  const chips = features.length
    ? `<div class="chips">${features
        .map((f) => `<span class="chip"><i>✓</i>${esc(f)}</span>`)
        .join("")}</div>`
    : "";

  const photoBlock = photoUri
    ? `<div class="photo"><img src="${photoUri}" alt="${esc(headline)}" /></div>`
    : `<div class="photo placeholder"><div class="ph-name">${esc(headline)}</div></div>`;

  const contact = whatsapp
    ? `<div class="contact"><span class="wa">WA</span><span class="wa-label">WHATSAPP</span><span class="wa-num">${esc(whatsapp)}</span></div>`
    : "";

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
  body {
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    background: #151B2B;
    color: #FFFFFF;
    position: relative;
  }
  .bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(circle at 50% 42%, rgba(255,107,0,.16) 0%, rgba(255,107,0,0) 55%),
      radial-gradient(circle at 82% 12%, rgba(255,107,0,.08) 0%, rgba(255,107,0,0) 45%),
      #151B2B;
  }
  .grid {
    position: absolute; inset: 0;
    background-image:
      repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px ${54 * u}px),
      repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 1px, transparent 1px ${54 * u}px);
    mask-image: radial-gradient(circle at 50% 45%, #000 35%, transparent 78%);
  }
  .frame { position: relative; width: 100%; height: 100%; padding: ${64 * u}px ${68 * u}px ${52 * u}px; display: flex; flex-direction: column; }

  .top { display: flex; align-items: flex-start; justify-content: space-between; gap: ${24 * u}px; }
  .brand { display: flex; flex-direction: column; gap: ${10 * u}px; }
  .logo { height: ${96 * u}px; width: auto; display: block; }
  .wordmark { font-size: ${58 * u}px; font-weight: 800; letter-spacing: -1px; }
  .wordmark span { color: #FF6B00; }
  .wordmark .w { color: #FFFFFF; }
  .tagline { font-size: ${15 * u}px; letter-spacing: ${5 * u}px; color: #808080; font-weight: 600; text-transform: uppercase; }

  .badge {
    background: #FF6B00; color: #151B2B; font-weight: 800;
    font-size: ${21 * u}px; letter-spacing: ${2 * u}px; text-transform: uppercase;
    padding: ${12 * u}px ${22 * u}px; border-radius: ${6 * u}px;
    transform: rotate(3deg); box-shadow: 0 ${8 * u}px ${24 * u}px rgba(0,0,0,.35);
    white-space: nowrap;
  }

  .mid { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: ${14 * u}px; padding-top: ${18 * u}px; }
  .kicker { font-size: ${19 * u}px; letter-spacing: ${7 * u}px; color: ${accentHex}; font-weight: 700; text-transform: uppercase; }
  .headline {
    font-family: "Arial Black", "Impact", "Segoe UI", sans-serif;
    font-size: ${Math.round(96 * u)}px; line-height: 0.95; text-transform: uppercase;
    letter-spacing: ${-2 * u}px; max-width: 92%; text-shadow: 0 ${10 * u}px ${30 * u}px rgba(0,0,0,.55);
  }
  .subhead { font-size: ${24 * u}px; color: #B9C2D0; max-width: 74%; line-height: 1.35; }

  .photo { display: flex; align-items: center; justify-content: center; margin: ${10 * u}px 0; }
  .photo img { max-height: ${300 * u}px; max-width: ${720 * u}px; object-fit: contain; filter: drop-shadow(0 ${18 * u}px ${36 * u}px rgba(0,0,0,.55)); }
  .photo.placeholder {
    width: ${430 * u}px; height: ${240 * u}px; border-radius: ${18 * u}px;
    border: ${2 * u}px dashed rgba(255,107,0,.55);
    background: linear-gradient(160deg, rgba(255,107,0,.12), rgba(24,32,51,.85));
    box-shadow: inset 0 0 ${60 * u}px rgba(255,107,0,.10);
  }
  .ph-name { font-size: ${22 * u}px; letter-spacing: ${3 * u}px; color: #7F8CA3; text-transform: uppercase; font-weight: 600; padding: 0 ${20 * u}px; }

  .price { display: flex; align-items: baseline; gap: ${18 * u}px; }
  .price .now { font-size: ${78 * u}px; font-weight: 800; color: #FF6B00; letter-spacing: ${-1 * u}px; }
  .price .was { font-size: ${34 * u}px; color: #8A93A3; text-decoration: line-through; text-decoration-thickness: ${3 * u}px; }

  .chips { display: flex; flex-wrap: wrap; justify-content: center; gap: ${10 * u}px; max-width: 88%; }
  .chip {
    display: inline-flex; align-items: center; gap: ${8 * u}px;
    background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12);
    border-radius: ${999 * u}px; padding: ${9 * u}px ${18 * u}px;
    font-size: ${18 * u}px; color: #E6EAF2;
  }
  .chip i { color: ${accentHex}; font-style: normal; font-weight: 700; }

  .bottom { display: flex; flex-direction: column; gap: ${16 * u}px; }
  .rule { height: ${4 * u}px; background: linear-gradient(90deg, #FF6B00, rgba(255,107,0,0)); border-radius: ${2 * u}px; }
  .bar { display: flex; align-items: center; justify-content: space-between; gap: ${18 * u}px; }
  .cta { font-size: ${34 * u}px; font-weight: 800; letter-spacing: ${1 * u}px; text-transform: uppercase; }
  .url {
    background: #FF6B00; color: #151B2B; font-weight: 800;
    font-size: ${26 * u}px; padding: ${12 * u}px ${26 * u}px; border-radius: ${8 * u}px;
  }
  .meta { font-size: ${17 * u}px; letter-spacing: ${3 * u}px; color: #808080; text-transform: uppercase; font-weight: 600; }
  .contact { display: flex; align-items: center; gap: ${10 * u}px; font-size: ${17 * u}px; color: #B9C2D0; }
  .wa { background: #25D366; color: #08301A; font-weight: 800; border-radius: ${6 * u}px; padding: ${3 * u}px ${9 * u}px; font-size: ${15 * u}px; }
  .wa-label { letter-spacing: ${3 * u}px; font-weight: 700; color: #8A93A3; }
  .wa-num { font-weight: 700; color: #FFFFFF; }

  body.tall .mid { justify-content: center; gap: ${30 * u}px; }
  body.tall .headline { font-size: ${Math.round(112 * u)}px; }
  body.tall .photo img { max-height: ${520 * u}px; }
  body.tall .photo.placeholder { width: ${560 * u}px; height: ${330 * u}px; }
</style></head>
<body class="${tall ? "tall" : ""}${wide ? " wide" : ""}">
  <div class="bg"></div>
  <div class="grid"></div>
  <div class="frame">
    <div class="top">
      <div class="brand">${logoBlock}<div class="tagline">${esc(tagline)}</div></div>
      ${badges}
    </div>
    <div class="mid">
      ${kickerBlock}
      <div class="headline">${esc(headline)}</div>
      ${subheadBlock}
      ${photoBlock}
      ${priceBlock}
      ${chips}
    </div>
    <div class="bottom">
      <div class="rule"></div>
      <div class="bar">
        <div class="cta">${esc(cta)}</div>
        <div class="url">${esc(website)}</div>
      </div>
      ${delivery || contact ? `<div class="bar"><div class="meta">${esc(delivery)}</div>${contact}</div>` : ""}
    </div>
  </div>
</body></html>`;
}

function renderWithChrome(htmlFile, outFile, width, height) {
  const chrome = findChrome();
  if (!chrome) {
    const err = new Error("Chrome or Edge was not found, so the local renderer cannot run.");
    err.status = 500;
    return Promise.reject(err);
  }

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "poster-chrome-"));
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--force-device-scale-factor=1",
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    `--screenshot=${outFile}`,
    `file:///${htmlFile.replace(/\\/g, "/")}`,
  ];

  return new Promise((resolve, reject) => {
    execFile(chrome, args, { timeout: 60000 }, (err, _stdout, stderr) => {
      try {
        fs.rmSync(profile, { recursive: true, force: true });
      } catch (e) {
        /* profile cleanup is best effort */
      }
      if (err) {
        const e = new Error(`Chrome render failed: ${String(stderr || err.message).slice(0, 300)}`);
        e.status = 500;
        return reject(e);
      }
      if (!fs.existsSync(outFile)) {
        const e = new Error("Chrome finished but wrote no PNG.");
        e.status = 500;
        return reject(e);
      }
      resolve();
    });
  });
}

async function renderPoster(data) {
  const d = data || {};
  const [W, H] = SIZES[d.aspect_ratio] || SIZES["1:1"];
  const html = buildPosterHtml(d);

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "poster-"));
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

module.exports = { renderPoster, buildPosterHtml, findChrome, renderWithChrome, SIZES };
