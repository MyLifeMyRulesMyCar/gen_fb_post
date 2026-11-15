"use strict";

/**
 * AI Horde image client — free, no signup.
 *
 * Anonymous use needs no key: the shared key is literally "0000000000", and the
 * request buys nothing, so it waits in the public queue (usually 1–5 minutes).
 *
 * The anonymous allowance is not fixed. Under heavy demand AI Horde lowers the
 * biggest image it will accept (we have seen 697, 640 and 576 px) and answers
 * 403 with the pixel limit in the message. So instead of hard-coding one size,
 * this client sends the best preset for the aspect ratio and steps down to the
 * next one when it is refused, ending at 512 px. Set HORDE_API_KEY to use your
 * own key for a higher priority and full-size images.
 *
 * Flow: POST /generate/async -> id, poll /generate/check/{id}, then read
 * /generate/status/{id} and download the image URL.
 */

const { fetch } = require("undici");

const HOST = "https://aihorde.net/api/v2";
const ANON_KEY = "0000000000";
const CLIENT_AGENT = "elephantronics-poster:0.3:local";

/* Width and height must be multiples of 64. Each list runs from the preferred
   size down to the smallest we would still show, so a 403 can be retried. */
const SIZE_LADDERS = {
  "1:1": [
    [640, 640],
    [576, 576],
    [512, 512],
  ],
  "4:5": [
    [576, 704],
    [512, 640],
    [448, 576],
  ],
  "9:16": [
    [512, 832],
    [448, 768],
    [384, 640],
  ],
  "16:9": [
    [832, 448],
    [768, 448],
    [640, 384],
  ],
  "3:2": [
    [768, 512],
    [704, 448],
    [576, 384],
  ],
  "2:3": [
    [512, 768],
    [448, 704],
    [384, 576],
  ],
};

const STEP_LADDER = [20, 16, 12];

function ladderFor(aspect) {
  return SIZE_LADDERS[String(aspect || "1:1").trim()] || SIZE_LADDERS["1:1"];
}

/* Kept for the server and tests: the preferred size for an aspect ratio. */
function sizeFor(aspect) {
  return ladderFor(aspect)[0];
}

const SIZES = Object.fromEntries(Object.entries(SIZE_LADDERS).map(([k, v]) => [k, v[0]]));

function apiKey() {
  return String(process.env.HORDE_API_KEY || "").trim() || ANON_KEY;
}

function headers(extra) {
  return {
    "Content-Type": "application/json",
    apikey: apiKey(),
    "Client-Agent": CLIENT_AGENT,
    ...(extra || {}),
  };
}

function httpError(message, status) {
  const err = new Error(message);
  err.status = status || 502;
  return err;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function submit({ prompt, width, height, steps, model }) {
  const body = {
    prompt,
    params: { width, height, steps, n: 1, sampler_name: "k_euler" },
    r2: true,
    nsfw: false,
    censor_nsfw: true,
    trusted_workers: false,
  };
  if (model) body.models = [model];

  const res = await fetch(`${HOST}/generate/async`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    /* keep raw */
  }

  return { status: res.status, text, json };
}

async function check(id) {
  const res = await fetch(`${HOST}/generate/check/${encodeURIComponent(id)}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw httpError(`AI Horde check failed (${res.status})`, 502);
  return res.json();
}

async function result(id) {
  const res = await fetch(`${HOST}/generate/status/${encodeURIComponent(id)}`, {
    headers: headers(),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw httpError(`AI Horde status failed (${res.status})`, 502);
  return res.json();
}

async function download(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw httpError(`Could not download the generated image (${res.status})`, 502);
  const mime = res.headers.get("content-type") || "image/webp";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, mime };
}

/* Try the ladder from best to smallest. A 403 means "too big for anonymous
   right now", so the next rung is tried; anything else is fatal. */
async function enqueue({ prompt, ladder, steps, model, onProgress }) {
  const notes = [];
  for (const [width, height] of ladder) {
    for (const usedSteps of [Math.min(steps, STEP_LADDER[0]), ...STEP_LADDER.slice(1)]) {
      if (usedSteps > steps) continue;
      const attempt = await submit({ prompt, width, height, steps: usedSteps, model });
      if (attempt.status === 202 && attempt.json && attempt.json.id) {
        return { id: attempt.json.id, kudos: attempt.json.kudos, width, height, steps: usedSteps, notes };
      }
      if (attempt.status === 403) {
        notes.push(`${width}x${height}@${usedSteps} refused by the anonymous allowance`);
        break; /* smaller steps will not unlock a bigger image */
      }
      if (attempt.status === 429) {
        if (typeof onProgress === "function") onProgress({ retrying: true });
        await sleep(2500);
        const retry = await submit({ prompt, width, height, steps: usedSteps, model });
        if (retry.status === 202 && retry.json && retry.json.id) {
          return { id: retry.json.id, kudos: retry.json.kudos, width, height, steps: usedSteps, notes };
        }
        if (retry.status === 403) {
          notes.push(`${width}x${height}@${usedSteps} refused by the anonymous allowance`);
          break;
        }
        const msg = (retry.json && retry.json.message) || retry.text.slice(0, 200);
        throw httpError(`AI Horde rejected the request (${retry.status}): ${msg}`, 502);
      }
      const msg = (attempt.json && attempt.json.message) || attempt.text.slice(0, 250);
      throw httpError(`AI Horde rejected the request (${attempt.status}): ${msg}`, 502);
    }
  }
  throw httpError(
    `AI Horde would not accept any size we offer on the anonymous key right now (tried ${notes.join("; ") || "the full ladder"}). Retry later, or add HORDE_API_KEY for full-size images.`,
    503
  );
}

async function generateImage({ prompt, aspectRatio, steps, model, timeoutMs, onProgress }) {
  const text = String(prompt || "").trim();
  if (!text) throw httpError("Prompt is empty.", 400);

  const requested = Math.max(8, Math.min(Number(steps) || 20, 30));
  const started = Date.now();
  const limit = Math.max(60000, Number(timeoutMs) || 420000);
  const notes = [];

  /* A worker can false-positive the NSFW filter on an ordinary product photo and
     return a black CENSORED placeholder. That is not an error we should show, so
     the job is re-queued for another worker, at most three times. */
  for (let attempt = 1; attempt <= 3; attempt++) {
    const job = await enqueue({
      prompt: text,
      ladder: ladderFor(aspectRatio),
      steps: requested,
      model,
      onProgress,
    });

    let last = null;
    let timedOut = false;
    while (Date.now() - started < limit) {
      await sleep(4000);
      let status;
      try {
        status = await check(job.id);
      } catch (e) {
        continue; /* transient network hiccup, keep waiting */
      }
      last = status;

      if (status.faulted) {
        throw httpError("AI Horde workers failed this job. Try again, or use the local renderer.", 502);
      }
      if (status.is_possible === false) {
        throw httpError(
          "No AI Horde worker is currently able to serve this request at this size. Try a smaller size or retry later.",
          503
        );
      }
      if (typeof onProgress === "function") {
        onProgress({ queue_position: status.queue_position, wait_time: status.wait_time });
      }
      if (status.done) break;
    }

    if (!last || !last.done) {
      timedOut = true;
    }

    if (timedOut) {
      throw httpError(
        `AI Horde did not finish within ${Math.round(limit / 1000)} s (queue position ${(last && last.queue_position) || "?"}). Retry later.`,
        504
      );
    }

    const final = await result(job.id);
    const gen = (final.generations || [])[0];
    if (!gen || !gen.img) {
      throw httpError("AI Horde finished without an image.", 502);
    }

    if (gen.censored) {
      notes.push(`worker ${attempt} censored the image by mistake`);
      if (typeof onProgress === "function") onProgress({ censored: true, attempt });
      continue;
    }

    const { buffer, mime } = await download(gen.img);
    return {
      buffer,
      mimeType: mime,
      model: `horde ${job.width}x${job.height} @ ${job.steps} steps`,
      width: job.width,
      height: job.height,
      steps: job.steps,
      kudos: job.kudos,
      waited: Math.round((Date.now() - started) / 1000),
      text: [...job.notes, ...notes].length ? [...job.notes, ...notes].join("; ") : "",
    };
  }

  throw httpError(
    "AI Horde censored three renders in a row by mistake (the NSFW filter is over-eager on product photos). Try a different prompt wording, or use the local renderer.",
    502
  );
}

module.exports = { generateImage, sizeFor, SIZES, SIZE_LADDERS, ANON_KEY };
