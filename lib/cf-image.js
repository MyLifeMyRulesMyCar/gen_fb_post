"use strict";

/**
 * Cloudflare Workers AI image client.
 *
 * Free plan: 10,000 neurons per day, no card. flux-1-schnell costs 4.80 neurons
 * per 512x512 tile plus 9.60 per step, so a 1024x1024 render at 4 steps is
 * about 58 neurons — roughly 170 images a day at no cost.
 *
 * Needs two values from a free Cloudflare account:
 *   CF_ACCOUNT_ID  — dashboard right-hand column
 *   CF_API_TOKEN   — "Workers AI" template token
 */

const { fetch } = require("undici");

const MODEL = "@cf/black-forest-labs/flux-1-schnell";
const ENDPOINT = (account) => `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${MODEL}`;

function credentials() {
  const account = String(process.env.CF_ACCOUNT_ID || "").trim();
  const token = String(process.env.CF_API_TOKEN || "").trim();
  if (!account || !token) {
    const err = new Error(
      "Cloudflare Workers AI needs CF_ACCOUNT_ID and CF_API_TOKEN. A free account is enough (10,000 neurons a day, no card); add both in Settings."
    );
    err.status = 400;
    throw err;
  }
  return { account, token };
}

async function generateImage({ prompt, steps }) {
  const text = String(prompt || "").trim();
  if (!text) {
    const err = new Error("Prompt is empty.");
    err.status = 400;
    throw err;
  }
  const { account, token } = credentials();
  const usedSteps = Math.max(1, Math.min(Number(steps) || 4, 8));

  const res = await fetch(ENDPOINT(account), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: text, steps: usedSteps }),
    signal: AbortSignal.timeout(120000),
  });

  const raw = await res.text();
  let json = null;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    /* keep raw */
  }

  if (!res.ok || !json || json.success === false) {
    const detail =
      (json && json.errors && json.errors.map((e) => e.message).filter(Boolean).join("; ")) || raw.slice(0, 300);
    const err = new Error(`Cloudflare Workers AI error ${res.status}: ${detail}`);
    err.status = res.status === 401 || res.status === 403 ? 401 : 502;
    throw err;
  }

  const base64 = json.result && json.result.image;
  if (!base64) {
    const err = new Error("Cloudflare returned no image data.");
    err.status = 502;
    throw err;
  }

  return {
    base64,
    mimeType: "image/jpeg",
    model: `cloudflare ${MODEL.split("/").pop()}`,
    text: "",
    steps: usedSteps,
  };
}

module.exports = { generateImage, MODEL };
