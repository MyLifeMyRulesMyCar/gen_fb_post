"use strict";

const OR_URL = "https://openrouter.ai/api/v1/chat/completions";

function parseJsonObject(text) {
  let t = String(text || "").trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model returned no JSON object.");
  }
  return JSON.parse(t.slice(start, end + 1));
}

async function chatCompletion({ system, user }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const err = new Error("OpenRouter API key is not configured. Add it in Settings.");
    err.status = 400;
    throw err;
  }
  const model = process.env.LLM_MODEL || "openrouter/free";

  const res = await fetch(OR_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Elephantronics Prompt Builder",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    let detail = text.slice(0, 400);
    try {
      const parsed = JSON.parse(text);
      if (parsed.error) {
        detail = [parsed.error.code, parsed.error.message].filter(Boolean).join(": ");
      }
    } catch (e) {
      /* keep raw text */
    }
    const err = new Error(`OpenRouter API error ${res.status}: ${detail}`);
    err.status = 502;
    throw err;
  }

  const json = await res.json();
  return (json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) || "";
}

async function suggestCreative(values) {
  const products = (values.products || []).filter((p) => p && p.enabled);
  const productNames = products.map((p) => (p.name || "").trim()).filter(Boolean).join(", ") || "(none)";

  const system =
    'You are a punchy, tech-focused copywriter for "Elephantronics", a Sri Lankan electronics retailer. ' +
    "You write short, high-energy marketing text for electronics product posters. " +
    "Voice: bold, benefit-driven, urgent, with clean grammar. " +
    "You ONLY polish or generate creative marketing text (headlines, taglines, badges, product descriptions). " +
    "NEVER invent prices, voltages, part numbers, or technical specs not already provided. " +
    "Keep product names exactly as given. Return ONLY valid JSON (no markdown, no commentary).";

  const user =
    "Product names on this poster: " +
    productNames +
    "\n\nCurrent placeholder values (fill what is empty; lightly polish grammar/punch on what is provided while keeping its meaning):\n\n" +
    JSON.stringify(
      {
        main_headline_1: values.main_headline_1 || "",
        main_headline_2: values.main_headline_2 || "",
        promo_sub_headline: values.promo_sub_headline || "",
        promo_tagline: values.promo_tagline || "",
        badge_top_text: values.badge_top_text || "",
        badge_bottom_text: values.badge_bottom_text || "",
        products: products.map((p) => ({ name: p.name || "", desc: p.desc || "" })),
      },
      null,
      2
    ) +
    "\n\nReturn ONLY a JSON object with this exact shape (products array must have exactly " +
    products.length +
    " entries, same order):\n\n" +
    '{\n  "main_headline_1": "...",\n  "main_headline_2": "...",\n  "promo_sub_headline": "...",\n  "promo_tagline": "...",\n  "badge_top_text": "...",\n  "badge_bottom_text": "...",\n  "products": [ { "desc": "..." }, ... ]\n}';

  const content = await chatCompletion({ system, user });
  return parseJsonObject(content);
}

async function suggestComparison(values) {
  const count = values.product_count === 3 ? 3 : 2;
  const products = [];
  for (let i = 0; i < count; i++) {
    const p = (values.products && values.products[i]) || {};
    products.push({
      name: (p.name || "").trim(),
      image: (p.image || "").trim(),
      features: Array.isArray(p.features) ? p.features.map((x) => String(x || "").trim()) : ["", "", "", ""],
      specs: Array.isArray(p.specs) ? p.specs.map((x) => String(x || "").trim()) : ["", "", "", "", ""],
    });
  }

  const system =
    'You are a punchy, tech-focused copywriter for "Elephantronics", a Sri Lankan electronics retailer. ' +
    "You write short, high-energy marketing text and accurate technical data for electronics product comparison infographics. " +
    "Voice: bold, benefit-driven, urgent, with clean grammar. " +
    "Fill any empty field and lightly polish grammar on provided text. " +
    "For technical specifications, only use widely-known facts about the given product names (e.g. an Arduino UNO has an ATmega328P at 16 MHz); do not fabricate. " +
    "Keep product names exactly as given. Return ONLY valid JSON (no markdown, no commentary).";

  const user =
    "Comparison infographic for these products:\n" +
    products.map((p) => "- " + (p.name || "(unnamed product)")).join("\n") +
    "\n\nCurrent values (fill what is empty; polish grammar/punch on what is provided):\n\n" +
    JSON.stringify(
      {
        comparison_title: values.comparison_title || "",
        comparison_subtitle: values.comparison_subtitle || "",
        discount_amount: values.discount_amount || "",
        discount_text: values.discount_text || "",
        cta_text: values.cta_text || "",
        products: products.map((p) => ({
          name: p.name,
          image: p.image,
          features: p.features,
          specs: p.specs,
        })),
      },
      null,
      2
    ) +
    "\n\nReturn ONLY a JSON object with this exact shape (products array must have exactly " +
    count +
    " entries, same order; features array must have exactly 4 entries, specs exactly 5):\n\n" +
    '{\n  "comparison_title": "...",\n  "comparison_subtitle": "...",\n  "discount_amount": "...",\n  "discount_text": "...",\n  "cta_text": "...",\n  "products": [ { "name": "...", "image": "...", "features": ["...","...","...","..."], "specs": ["...","...","...","...","..."] }, ... ]\n}';

  const content = await chatCompletion({ system, user });
  return parseJsonObject(content);
}

module.exports = { suggestCreative, suggestComparison };
