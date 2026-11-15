"use strict";

const fs = require("fs");
const net = require("net");
const path = require("path");
const { ProxyAgent, fetch } = require("undici");

const API_HOST = "https://generativelanguage.googleapis.com/v1beta";

/* Google API hosts are blocked on some networks. When a local proxy (Clash,
   V2Ray, etc.) is running we tunnel the Gemini call through it. Only this
   client is proxied, so the OpenRouter calls stay direct. */

const PROXY_CANDIDATES = ["http://127.0.0.1:7890", "http://127.0.0.1:7891", "http://127.0.0.1:10809"];

function portIsOpen(url, timeoutMs = 250) {
  let host, port;
  try {
    const u = new URL(url);
    host = u.hostname;
    port = Number(u.port || 80);
  } catch (e) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const sock = net.connect({ host, port });
    const done = (ok) => {
      sock.destroy();
      resolve(ok);
    };
    sock.setTimeout(timeoutMs);
    sock.once("connect", () => done(true));
    sock.once("timeout", () => done(false));
    sock.once("error", () => done(false));
  });
}

let proxyPromise = null;

function resolveProxy() {
  if (proxyPromise) return proxyPromise;
  proxyPromise = (async () => {
    const explicit = String(process.env.GEMINI_PROXY || process.env.HTTPS_PROXY || "").trim();
    if (explicit) return explicit;
    for (const candidate of PROXY_CANDIDATES) {
      if (await portIsOpen(candidate)) return candidate;
    }
    return "";
  })();
  return proxyPromise;
}

let dispatcher = null;
let dispatcherFor = null;

async function getDispatcher() {
  const proxy = await resolveProxy();
  if (!proxy) return null;
  if (dispatcher && dispatcherFor === proxy) return dispatcher;
  dispatcher = new ProxyAgent(proxy);
  dispatcherFor = proxy;
  return dispatcher;
}

function getProxyUrl() {
  return dispatcherFor || "";
}
const DEFAULT_MODEL = "gemini-3.1-flash-image";
const MAX_INPUT_IMAGES = 3;
const MAX_IMAGE_BYTES = 7 * 1024 * 1024; // Gemini inline-data limit is roughly 7 MB per image

const MIME_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function getKey() {
  const key = String(process.env.GEMINI_API_KEY || "").trim();
  if (!key) {
    const err = new Error("Gemini API key is not configured. Add it in Settings.");
    err.status = 400;
    throw err;
  }
  return key;
}

function readInlineImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_BY_EXT[ext];
  if (!mimeType) {
    const err = new Error(`Unsupported image type "${ext}" for ${path.basename(filePath)}`);
    err.status = 400;
    throw err;
  }
  const stat = fs.statSync(filePath);
  if (stat.size > MAX_IMAGE_BYTES) {
    const err = new Error(`${path.basename(filePath)} is ${(stat.size / 1024 / 1024).toFixed(1)} MB, over the 7 MB inline limit`);
    err.status = 400;
    throw err;
  }
  return {
    inline_data: { mime_type: mimeType, data: fs.readFileSync(filePath).toString("base64") },
  };
}

function pickImagePart(parts) {
  for (const part of parts || []) {
    const inline = part.inlineData || part.inline_data;
    if (inline && inline.data) {
      return {
        data: inline.data,
        mimeType: inline.mimeType || inline.mime_type || "image/png",
      };
    }
  }
  return null;
}

async function generateImage({ prompt, aspectRatio, model, imagePaths }) {
  const key = getKey();
  const text = String(prompt || "").trim();
  if (!text) {
    const err = new Error("Prompt is empty.");
    err.status = 400;
    throw err;
  }

  const usedModel = String(model || process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL).trim();
  const paths = (imagePaths || []).filter(Boolean).slice(0, MAX_INPUT_IMAGES);

  const parts = [{ text }];
  for (const p of paths) parts.push(readInlineImage(p));

  const generationConfig = { responseModalities: ["IMAGE"] };
  if (aspectRatio) generationConfig.imageConfig = { aspectRatio: String(aspectRatio) };

  let res;
  let lastErr = null;
  const proxy = await resolveProxy();
  const attempts = proxy ? [{ label: `proxy ${proxy}`, dispatcher: await getDispatcher() }, { label: "direct", dispatcher: null }] : [{ label: "direct", dispatcher: null }];

  for (const attempt of attempts) {
    try {
      res = await fetch(`${API_HOST}/models/${encodeURIComponent(usedModel)}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig }),
        signal: AbortSignal.timeout(180000),
        ...(attempt.dispatcher ? { dispatcher: attempt.dispatcher } : {}),
      });
      break;
    } catch (e) {
      lastErr = e;
      res = null;
    }
  }

  if (!res) {
    const cause = lastErr && lastErr.cause ? lastErr.cause.code || lastErr.cause.message : "";
    const shape = proxy ? "via proxy and direct" : "direct (no proxy found; set GEMINI_PROXY if this network needs one)";
    const err = new Error(`Could not reach Gemini ${shape}: ${(lastErr && lastErr.message) || "unknown error"}${cause ? ` [${cause}]` : ""}`);
    err.status = 502;
    throw err;
  }

  const raw = await res.text();
  let json = null;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    /* keep raw for the error message */
  }

  if (!res.ok) {
    if (res.status === 429) {
      const err = new Error(
        "Gemini has no image quota for this key. The free tier allows 0 image requests, so billing must be enabled on the key's project. The local renderer works without any key."
      );
      err.status = 429;
      throw err;
    }
    const detail = json && json.error ? [json.error.status, json.error.message].filter(Boolean).join(": ") : raw.slice(0, 300);
    const err = new Error(`Gemini API error ${res.status}: ${detail}`);
    err.status = res.status === 401 || res.status === 403 ? 401 : 502;
    throw err;
  }

  const candidate = (json.candidates || [])[0] || {};
  const image = pickImagePart(candidate.content && candidate.content.parts);
  const spoken = ((candidate.content && candidate.content.parts) || [])
    .map((p) => p.text)
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!image) {
    const reason =
      candidate.finishReason ||
      (json.promptFeedback && json.promptFeedback.blockReason) ||
      "no image returned";
    const err = new Error(`Gemini returned no image (${reason}).`);
    err.status = 502;
    throw err;
  }

  return { base64: image.data, mimeType: image.mimeType, text: spoken, model: usedModel, proxy: dispatcherFor || "" };
}

module.exports = { generateImage, DEFAULT_MODEL, resolveProxy };
