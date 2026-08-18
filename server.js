"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");

const { buildPrompt } = require("./lib/template");
const { buildComparisonPrompt } = require("./lib/comparison-template");
const { suggestCreative, suggestComparison } = require("./lib/llm");
const db = require("./lib/db");

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/render", (req, res) => {
  try {
    const body = req.body || {};
    const prompt = body.mode === "comparison" ? buildComparisonPrompt(body) : buildPrompt(body);
    res.json({ prompt });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/suggest", async (req, res) => {
  try {
    const body = req.body || {};
    const suggestions = body.mode === "comparison" ? await suggestComparison(body) : await suggestCreative(body);
    res.json({ suggestions });
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
  });
});

app.post("/api/settings", (req, res) => {
  const { openrouter_api_key, llm_model } = req.body || {};
  const envPath = path.join(__dirname, ".env");

  const env = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m) env[m[1]] = m[2];
    }
  }
  if (openrouter_api_key !== undefined) env.OPENROUTER_API_KEY = openrouter_api_key;
  if (llm_model !== undefined) env.LLM_MODEL = llm_model;

  fs.writeFileSync(envPath, Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n") + "\n");

  if (openrouter_api_key !== undefined) process.env.OPENROUTER_API_KEY = openrouter_api_key;
  if (llm_model !== undefined) process.env.LLM_MODEL = llm_model;

  res.json({
    ok: true,
    has_key: Boolean(process.env.OPENROUTER_API_KEY),
    model: process.env.LLM_MODEL || "openrouter/free",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Elephantronics Prompt Builder running at http://localhost:${PORT}`);
});
