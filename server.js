"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");

const { buildPrompt } = require("./lib/template");
const { buildComparisonPrompt } = require("./lib/comparison-template");
const { buildHeroPrompt } = require("./lib/hero-template");
const { suggestCreative, suggestComparison, suggestHero } = require("./lib/llm");
const { generateImage, resolveProxy } = require("./lib/gemini-image");

const BUILDERS = {
  poster: buildPrompt,
  comparison: buildComparisonPrompt,
  hero: buildHeroPrompt,
};

const SUGGESTERS = {
  poster: suggestCreative,
  comparison: suggestComparison,
  hero: suggestHero,
};
const db = require("./lib/db");

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

/* ---- brand assets and generated output ---- */

const BRAND_ROOT = process.env.BRAND_ROOT || "D:\\elephantronics-com";
const OUTPUT_DIR = path.join(__dirname, "output");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
app.use("/output", express.static(OUTPUT_DIR));

function resolveInside(root, candidate) {
  try {
    const base = path.resolve(root);
    const resolved = path.resolve(String(candidate));
    if (resolved !== base && !resolved.startsWith(base + path.sep)) return null;
    return resolved;
  } catch (e) {
    return null;
  }
}

function outputName(name) {
  const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
  const slug =
    String(name || "poster")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "poster";
  return `${stamp}_${slug}`;
}

app.post("/api/render", (req, res) => {
  try {
    const body = req.body || {};
    const build = BUILDERS[body.mode] || buildPrompt;
    res.json({ prompt: build(body) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/suggest", async (req, res) => {
  try {
    const body = req.body || {};
    const suggest = SUGGESTERS[body.mode] || suggestCreative;
    const suggestions = await suggest(body);
    res.json({ suggestions });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

app.get("/api/assets", (req, res) => {
  try {
    const assets = [];
    const walk = (dir) => {
      if (assets.length >= 300) return;
      let entries = [];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch (e) {
        return;
      }
      for (const entry of entries) {
        if (assets.length >= 300) return;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (["dist", "node_modules", ".git"].includes(entry.name)) continue;
          walk(full);
        } else if (/\.(png|jpe?g|webp)$/i.test(entry.name)) {
          assets.push({
            path: full,
            rel: path.relative(BRAND_ROOT, full).replace(/\\/g, "/"),
            name: entry.name,
            size: fs.statSync(full).size,
            isLogo: /logo|icon/i.test(entry.name),
          });
        }
      }
    };
    walk(BRAND_ROOT);
    assets.sort((a, b) => Number(b.isLogo) - Number(a.isLogo) || a.rel.localeCompare(b.rel));
    res.json({ root: BRAND_ROOT, assets });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/images", (req, res) => {
  try {
    const files = fs
      .readdirSync(OUTPUT_DIR)
      .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
      .map((f) => {
        const st = fs.statSync(path.join(OUTPUT_DIR, f));
        return { file: f, url: `/output/${f}`, bytes: st.size, created: st.mtime.toISOString() };
      })
      .sort((a, b) => b.created.localeCompare(a.created));
    res.json({ dir: OUTPUT_DIR, images: files });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/gemini/check", async (req, res) => {
  try {
    const proxy = await resolveProxy();
    const { ProxyAgent, fetch: undiciFetch } = require("undici");
    const dispatcher = proxy ? new ProxyAgent(proxy) : undefined;
    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(400).json({ ok: false, error: "No Gemini API key set." });
    const r = await undiciFetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
      headers: { "x-goog-api-key": key },
      signal: AbortSignal.timeout(30000),
      ...(dispatcher ? { dispatcher } : {}),
    });
    const json = await r.json();
    if (!r.ok) return res.status(502).json({ ok: false, proxy, status: r.status, error: json.error && json.error.message });
    const names = (json.models || []).map((m) => m.name.replace(/^models\//, ""));
    res.json({
      ok: true,
      proxy: proxy || "(direct)",
      image_models: names.filter((n) => /image/i.test(n)),
      total: names.length,
    });
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message, cause: e.cause && (e.cause.code || e.cause.message) });
  }
});

app.post("/api/image", async (req, res) => {
  try {
    const body = req.body || {};
    const imagePaths = [];
    for (const field of ["logo_path", "photo_path"]) {
      const raw = body[field];
      if (!raw) continue;
      const safe = resolveInside(BRAND_ROOT, raw);
      if (!safe) return res.status(400).json({ error: `${field} must point inside ${BRAND_ROOT}` });
      if (!fs.existsSync(safe)) return res.status(400).json({ error: `${field} not found: ${raw}` });
      imagePaths.push(safe);
    }

    const provider = String(body.provider || "gemini").toLowerCase();
    let result;

    if (provider === "horde") {
      const horde = require("./lib/horde-image");
      result = await horde.generateImage({
        prompt: body.prompt,
        aspectRatio: body.aspect_ratio,
        steps: body.steps,
        model: body.horde_model,
      });
    } else if (provider === "cloudflare") {
      const cf = require("./lib/cf-image");
      result = await cf.generateImage({ prompt: body.prompt, steps: body.steps });
    } else if (provider === "byteplus") {
      const byteplus = require("./lib/byteplus-image");
      result = await byteplus.generateImage({
        prompt: body.prompt,
        aspectRatio: body.aspect_ratio,
        model: body.byteplus_model,
      });
    } else {
      result = await generateImage({
        prompt: body.prompt,
        aspectRatio: body.aspect_ratio,
        model: body.model,
        imagePaths,
      });
    }

    const buffer = result.buffer || Buffer.from(result.base64, "base64");
    const ext = /jpe?g/i.test(result.mimeType || "")
      ? "jpg"
      : /webp/i.test(result.mimeType || "")
        ? "webp"
        : "png";
    const fileName = `${outputName(body.name)}.${ext}`;
    const filePath = path.join(OUTPUT_DIR, fileName);

    fs.writeFileSync(filePath, buffer);
    fs.writeFileSync(
      filePath.replace(/\.[a-z0-9]+$/i, ".txt"),
      [
        `file: ${fileName}`,
        `created: ${new Date().toISOString()}`,
        `provider: ${provider}`,
        `model: ${result.model}`,
        `aspect_ratio: ${body.aspect_ratio || "(default)"}`,
        `size: ${result.width ? `${result.width}x${result.height}` : "(model default)"}`,
        `logo: ${body.logo_path || "(none)"}`,
        `photo: ${body.photo_path || "(none)"}`,
        `proxy: ${result.proxy || "(direct)"}`,
        result.waited ? `queue_wait_s: ${result.waited}` : "",
        "",
        "--- prompt ---",
        String(body.prompt || ""),
        "",
        "--- model note ---",
        result.text || "(none)",
        "",
      ]
        .filter((line) => line !== "")
        .concat("")
        .join("\n")
    );

    res.json({
      file: fileName,
      url: `/output/${fileName}`,
      model: result.model,
      text: result.text,
      proxy: result.proxy || "",
      queue_wait_s: result.waited || 0,
      bytes: fs.statSync(filePath).size,
    });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

app.post("/api/poster", async (req, res) => {
  try {
    const body = req.body || {};

    const layout =
      body.layout === "comparison" ? "comparison" : body.layout === "grid" ? "grid" : "single";
    const photoFields =
      layout === "comparison"
        ? ["logo_path", "photo_1", "photo_2"]
        : layout === "grid"
          ? ["logo_path", "photo_1", "photo_2", "photo_3", "photo_4"]
          : ["logo_path", "photo_path"];

    const safePaths = {};
    for (const field of photoFields) {
      const raw = body[field];
      if (!raw) continue;
      const safe = resolveInside(BRAND_ROOT, raw);
      if (!safe) return res.status(400).json({ error: `${field} must point inside ${BRAND_ROOT}` });
      if (!fs.existsSync(safe)) return res.status(400).json({ error: `${field} not found: ${raw}` });
      safePaths[field] = safe;
    }

    if (layout === "grid") {
      const { renderGrid } = require("./lib/local-grid");
      const result = await renderGrid({
        aspect_ratio: body.aspect_ratio,
        style: body.style,
        headline_1: body.headline_1,
        headline_2: body.headline_2,
        promo: body.promo,
        promo_tagline: body.promo_tagline,
        badge_top: body.badge_top,
        badge_bottom: body.badge_bottom,
        cta: body.cta,
        website: body.website,
        whatsapp: body.whatsapp,
        delivery_note: body.delivery_note,
        best_price: body.best_price,
        hashtags: body.hashtags,
        tagline: body.tagline,
        logo_path: safePaths.logo_path || "",
        photo_1: safePaths.photo_1 || "",
        photo_2: safePaths.photo_2 || "",
        photo_3: safePaths.photo_3 || "",
        photo_4: safePaths.photo_4 || "",
        products: Array.isArray(body.products) ? body.products.slice(0, 4) : [],
      });

      const base = outputName(body.name);
      const fileName = `${base}.png`;
      const filePath = path.join(OUTPUT_DIR, fileName);
      fs.copyFileSync(result.pngPath, filePath);
      try {
        fs.rmSync(path.dirname(result.pngPath), { recursive: true, force: true });
      } catch (e) {
        /* best effort */
      }

      fs.writeFileSync(
        filePath.replace(/\.png$/i, ".txt"),
        [
          `file: ${fileName}`,
          `created: ${new Date().toISOString()}`,
          `renderer: local four-panel grid (headless Chrome, ${body.style === "retail" ? "retail" : "clean"} preset)`,
          `aspect_ratio: ${body.aspect_ratio || "1:1"}`,
          `size: ${result.width}x${result.height}`,
          `logo: ${body.logo_path || "(none)"}`,
          `photos: ${["photo_1", "photo_2", "photo_3", "photo_4"].map((f) => body[f] || "-").join(" | ")}`,
          "",
          "--- fields ---",
          JSON.stringify(
            {
              headline_1: body.headline_1 || "",
              headline_2: body.headline_2 || "",
              promo: body.promo || "",
              promo_tagline: body.promo_tagline || "",
              badge_top: body.badge_top || "",
              badge_bottom: body.badge_bottom || "",
              cta: body.cta || "",
              website: body.website || "",
              whatsapp: body.whatsapp || "",
              delivery_note: body.delivery_note || "",
              best_price: body.best_price || "",
              hashtags: body.hashtags || "",
              products: Array.isArray(body.products) ? body.products.slice(0, 4) : [],
            },
            null,
            2
          ),
          "",
          "--- source html ---",
          result.html,
          "",
        ].join("\n")
      );

      return res.json({
        file: fileName,
        url: `/output/${fileName}`,
        model: `local four-panel ${result.width}x${result.height}`,
        bytes: fs.statSync(filePath).size,
      });
    }

    if (layout === "comparison") {
      const { renderComparison } = require("./lib/local-comparison");
      const result = await renderComparison({
        aspect_ratio: body.aspect_ratio,
        comparison_title: body.comparison_title,
        comparison_subtitle: body.comparison_subtitle,
        discount_amount: body.discount_amount,
        discount_text: body.discount_text,
        cta: body.cta,
        website: body.website,
        tagline: body.tagline,
        logo_path: safePaths.logo_path || "",
        photo_1: safePaths.photo_1 || "",
        photo_2: safePaths.photo_2 || "",
        products: Array.isArray(body.products) ? body.products.slice(0, 2) : [],
      });

      const base = outputName(body.name);
      const fileName = `${base}.png`;
      const filePath = path.join(OUTPUT_DIR, fileName);
      fs.copyFileSync(result.pngPath, filePath);
      try {
        fs.rmSync(path.dirname(result.pngPath), { recursive: true, force: true });
      } catch (e) {
        /* best effort */
      }

      fs.writeFileSync(
        filePath.replace(/\.png$/i, ".txt"),
        [
          `file: ${fileName}`,
          `created: ${new Date().toISOString()}`,
          "renderer: local comparison (headless Chrome)",
          `aspect_ratio: ${body.aspect_ratio || "1:1"}`,
          `size: ${result.width}x${result.height}`,
          `logo: ${body.logo_path || "(none)"}`,
          `photo_1: ${body.photo_1 || "(none)"}`,
          `photo_2: ${body.photo_2 || "(none)"}`,
          "",
          "--- fields ---",
          JSON.stringify(
            {
              comparison_title: body.comparison_title || "",
              comparison_subtitle: body.comparison_subtitle || "",
              discount_amount: body.discount_amount || "",
              discount_text: body.discount_text || "",
              cta: body.cta || "",
              website: body.website || "",
              products: Array.isArray(body.products) ? body.products.slice(0, 2) : [],
            },
            null,
            2
          ),
          "",
          "--- source html ---",
          result.html,
          "",
        ].join("\n")
      );

      return res.json({
        file: fileName,
        url: `/output/${fileName}`,
        model: `local comparison ${result.width}x${result.height}`,
        bytes: fs.statSync(filePath).size,
      });
    }

    const logoPath = safePaths.logo_path || "";
    const photoPath = safePaths.photo_path || "";

    const { renderPoster } = require("./lib/local-poster");
    const result = await renderPoster({
      aspect_ratio: body.aspect_ratio,
      kicker: body.kicker,
      headline: body.headline,
      subhead: body.subhead,
      price: body.price,
      was_price: body.was_price,
      badge: body.badge,
      features: body.features,
      accent: body.accent,
      cta: body.cta,
      website: body.website,
      whatsapp: body.whatsapp,
      delivery_note: body.delivery_note,
      logo_path: logoPath,
      photo_path: photoPath,
    });

    const base = outputName(body.name);
    const fileName = `${base}.png`;
    const filePath = path.join(OUTPUT_DIR, fileName);
    fs.copyFileSync(result.pngPath, filePath);
    try {
      fs.rmSync(path.dirname(result.pngPath), { recursive: true, force: true });
    } catch (e) {
      /* best effort */
    }

    fs.writeFileSync(
      filePath.replace(/\.png$/i, ".txt"),
      [
        `file: ${fileName}`,
        `created: ${new Date().toISOString()}`,
        "renderer: local (headless Chrome)",
        `aspect_ratio: ${body.aspect_ratio || "1:1"}`,
        `size: ${result.width}x${result.height}`,
        `logo: ${body.logo_path || "(none)"}`,
        `photo: ${body.photo_path || "(none)"}`,
        "",
        "--- fields ---",
        JSON.stringify(
          {
            kicker: body.kicker || "",
            headline: body.headline || "",
            subhead: body.subhead || "",
            price: body.price || "",
            was_price: body.was_price || "",
            badge: body.badge || "",
            features: body.features || [],
            cta: body.cta || "",
            website: body.website || "",
            whatsapp: body.whatsapp || "",
            delivery_note: body.delivery_note || "",
          },
          null,
          2
        ),
        "",
        "--- source html ---",
        result.html,
        "",
      ].join("\n")
    );

    res.json({
      file: fileName,
      url: `/output/${fileName}`,
      model: `local ${result.width}x${result.height}`,
      bytes: fs.statSync(filePath).size,
    });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

app.get("/api/designs", (req, res) => res.json(db.listDesigns()));

app.get("/api/designs/:id", (req, res) => {
  const d = db.getDesign(Number(req.params.id));
  if (!d) return res.status(404).json({ error: "Design not found" });
  res.json(d);
});

app.post("/api/designs", (req, res) => {
  const { name, data, final_prompt, type } = req.body || {};
  res.json(db.createDesign({ name, data, final_prompt, type }));
});

app.put("/api/designs/:id", (req, res) => {
  const { name, data, final_prompt, type } = req.body || {};
  const d = db.updateDesign(Number(req.params.id), { name, data, final_prompt, type });
  if (!d) return res.status(404).json({ error: "Design not found" });
  res.json(d);
});

app.delete("/api/designs/:id", (req, res) => {
  db.deleteDesign(Number(req.params.id));
  res.json({ ok: true });
});

app.get("/api/settings", (req, res) => {
  res.json({
    has_key: Boolean(process.env.OPENROUTER_API_KEY),
    model: process.env.LLM_MODEL || "openrouter/free",
    has_kimi: Boolean(process.env.KIMI_API_KEY),
    kimi_model: process.env.KIMI_MODEL || "kimi-k3.1-pro",
    text_provider: process.env.KIMI_API_KEY
      ? "kimi"
      : process.env.OPENROUTER_API_KEY
      ? "openrouter"
      : null,
    has_gemini_key: Boolean(process.env.GEMINI_API_KEY),
    has_cf: Boolean(process.env.CF_ACCOUNT_ID && process.env.CF_API_TOKEN),
    has_horde: true,
    has_byteplus: Boolean(process.env.BYTEPLUS_API_KEY || process.env.ARK_API_KEY),
    gemini_model: process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image",
  });
});

app.post("/api/settings", (req, res) => {
  const { openrouter_api_key, llm_model, gemini_api_key, gemini_model, kimi_api_key, kimi_model } = req.body || {};
  const envPath = path.join(__dirname, ".env");

  const env = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m) env[m[1]] = m[2];
    }
  }
  if (openrouter_api_key !== undefined && openrouter_api_key !== "") env.OPENROUTER_API_KEY = openrouter_api_key;
  if (llm_model !== undefined) env.LLM_MODEL = llm_model;
  if (gemini_api_key !== undefined && gemini_api_key !== "") env.GEMINI_API_KEY = gemini_api_key;
  if (gemini_model !== undefined) env.GEMINI_IMAGE_MODEL = gemini_model;
  if (kimi_api_key !== undefined && kimi_api_key !== "") env.KIMI_API_KEY = kimi_api_key;
  if (kimi_model !== undefined) env.KIMI_MODEL = kimi_model;

  fs.writeFileSync(envPath, Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n") + "\n");

  if (openrouter_api_key !== undefined && openrouter_api_key !== "") process.env.OPENROUTER_API_KEY = openrouter_api_key;
  if (llm_model !== undefined) process.env.LLM_MODEL = llm_model;
  if (gemini_api_key !== undefined && gemini_api_key !== "") process.env.GEMINI_API_KEY = gemini_api_key;
  if (gemini_model !== undefined) process.env.GEMINI_IMAGE_MODEL = gemini_model;
  if (kimi_api_key !== undefined && kimi_api_key !== "") process.env.KIMI_API_KEY = kimi_api_key;
  if (kimi_model !== undefined) process.env.KIMI_MODEL = kimi_model;

  res.json({
    ok: true,
    has_key: Boolean(process.env.OPENROUTER_API_KEY),
    model: process.env.LLM_MODEL || "openrouter/free",
    has_kimi: Boolean(process.env.KIMI_API_KEY),
    kimi_model: process.env.KIMI_MODEL || "kimi-k3.1-pro",
    text_provider: process.env.KIMI_API_KEY
      ? "kimi"
      : process.env.OPENROUTER_API_KEY
      ? "openrouter"
      : null,
    has_gemini_key: Boolean(process.env.GEMINI_API_KEY),
    has_cf: Boolean(process.env.CF_ACCOUNT_ID && process.env.CF_API_TOKEN),
    has_horde: true,
    has_byteplus: Boolean(process.env.BYTEPLUS_API_KEY || process.env.ARK_API_KEY),
    gemini_model: process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Elephantronics Prompt Builder running at http://localhost:${PORT}`);
});
