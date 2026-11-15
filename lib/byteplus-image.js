"use strict";

/**
 * BytePlus ModelArk image client — Seedream models.
 *
 * Endpoint: POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations
 * Auth:     Authorization: Bearer $ARK_API_KEY
 * Docs:     https://docs.byteplus.com/en/docs/ModelArk/1541523
 *
 * Seedream 5.x has a pixel floor: "1K" and 512x512 are rejected, and an explicit
 * "WxH" must total at least 3,686,400 pixels. So every size below is built to sit
 * just above that floor at the requested aspect ratio, and the app downscales
 * afterwards if it needs a specific poster pixel size.
 *
 * The key is read from the environment only. It is never logged or written to a
 * sidecar; the sidecar records the model and size, not the key.
 */

const { fetch } = require("undici");

const HOST = "https://ark.ap-southeast.bytepluses.com/api/v3";
const DEFAULT_MODEL = "seedream-5-0-260128";
const MIN_PIXELS = 3686400;

/* Aspect ratio -> the smallest safe size above the Seedream floor. */
const SIZES = {
  "1:1": [2048, 2048],
  "4:5": [1728, 2160],
  "9:16": [1440, 2560],
  "16:9": [2560, 1440],
  "3:2": [2352, 1568],
  "2:3": [1568, 2352],
};

function sizeFor(aspect) {
  const key = String(aspect || "1:1").trim();
  const size = SIZES[key] || SIZES["1:1"];
  /* Guard the documented floor so a future edit cannot silently fall under it. */
  if (size[0] * size[1] < MIN_PIXELS) return SIZES["1:1"];
  return size;
}

function apiKey() {
  const key = String(process.env.BYTEPLUS_API_KEY || process.env.ARK_API_KEY || "").trim();
  if (!key) {
    const err = new Error(
      "BytePlus needs an API key. Add it in Settings (BYTEPLUS_API_KEY), then restart the app."
    );
    err.status = 400;
    throw err;
  }
  return key;
}

function httpError(message, status) {
  const err = new Error(message);
  err.status = status || 502;
  return err;
}

/* BytePlus error bodies look like
   {"error":{"code":"AuthenticationError","message":"...","type":"Unauthorized"}} */
function describe(body, status, model) {
  const e = (body && body.error) || {};
  const code = e.code || `HTTP ${status}`;
  if (status === 401 || code === "AuthenticationError") {
    return "BytePlus rejected the API key (401). Check that ARK_API_KEY is the key created on the ModelArk API-keys page, copied whole — not an AK/SK pair and not truncated.";
  }
  if (/ModelNotOpen|ModelNotActivated/i.test(code) || /not activated|not open/i.test(e.message || "")) {
    return `BytePlus has not activated this model on your account (${model || "Seedream"}). Open the ModelArk console, click Activate model, accept the terms, then retry.`;
  }
  if (/QuotaExceeded|AccountOverdue/i.test(code)) {
    return `BytePlus quota or billing problem: ${e.message || code}. Check the account balance in the ModelArk console.`;
  }
  return `BytePlus error ${status}: ${e.message || code}`;
}

async function generateImage({ prompt, aspectRatio, model, timeoutMs }) {
  const text = String(prompt || "").trim();
  if (!text) throw httpError("Prompt is empty.", 400);

  const [width, height] = sizeFor(aspectRatio);
  const usedModel = String(model || process.env.BYTEPLUS_IMAGE_MODEL || "").trim() || DEFAULT_MODEL;
  const started = Date.now();

  const body = {
    model: usedModel,
    prompt: text,
    size: `${width}x${height}`,
    response_format: "url",
    watermark: false,
  };

  const res = await fetch(`${HOST}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Math.max(60000, Number(timeoutMs) || 180000)),
  });

  const raw = await res.text();
  let json = null;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    /* keep raw */
  }

  if (!res.ok) {
    throw httpError(describe(json, res.status, usedModel), res.status === 401 ? 401 : 502);
  }

  const item = json && json.data && json.data[0];
  if (!item) throw httpError("BytePlus returned no image data.", 502);

  let buffer;
  let mime;
  if (item.url) {
    const img = await fetch(item.url, { signal: AbortSignal.timeout(120000) });
    if (!img.ok) throw httpError(`Could not download the BytePlus image (${img.status})`, 502);
    mime = img.headers.get("content-type") || "image/jpeg";
    buffer = Buffer.from(await img.arrayBuffer());
  } else if (item.b64_json) {
    buffer = Buffer.from(item.b64_json, "base64");
    mime = "image/jpeg";
  } else {
    throw httpError("BytePlus returned an item with neither a URL nor base64 data.", 502);
  }

  return {
    buffer,
    mimeType: mime,
    model: `byteplus ${usedModel} ${width}x${height}`,
    width,
    height,
    waited: Math.round((Date.now() - started) / 1000),
    text: item.url ? "" : "base64 response",
  };
}

module.exports = { generateImage, sizeFor, SIZES, DEFAULT_MODEL, MIN_PIXELS };
