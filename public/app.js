"use strict";

const COLORS = ["Blue", "Red", "Green", "Yellow", "Purple", "Cyan", "Orange"];
const COLOR_HEX = {
  Blue: "#00e5ff",
  Red: "#ff4d5e",
  Green: "#25d366",
  Yellow: "#ffd700",
  Purple: "#b78cff",
  Cyan: "#4deeff",
  Orange: "#ff8c00",
};

const POSTER_DEFAULT = {
  name: "",
  main_headline_1: "SENSOR",
  main_headline_2: "MODULES",
  promo_sub_headline: "4 POWERFUL SENSORS.",
  promo_tagline: "ENDLESS POSSIBILITIES! \uD83D\uDE80",
  badge_top_text: "4 SENSORS.",
  badge_bottom_text: "UNLIMITED PROJECTS!",
  products: [
    { enabled: true, name: "DHT11 SENSOR", desc: "Digital Temperature & Humidity Sensor", features: "3.3V \u2013 5V, Temperature & Humidity Measurement, Digital Output", price: "LKR 310 ONLY", color: "Blue" },
    { enabled: true, name: "DHT22 / AM2302", desc: "High Accuracy Temperature & Humidity Sensor", features: "3.3V \u2013 6V, High Accuracy, Wide Range, Digital Output", price: "LKR 450 ONLY", color: "Red" },
    { enabled: true, name: "GY-521 MPU6050", desc: "IMU Module", features: "3-Axis Accel, 3-Axis Gyro, I2C Interface, Wide Voltage", price: "LKR 540 ONLY", color: "Green" },
    { enabled: true, name: "GY-273 HMC5883L", desc: "Compass Module", features: "3-Axis Mag, I2C, High Sensitivity, Low Power", price: "LKR 610 ONLY", color: "Yellow" },
  ],
};

const COMPARISON_DEFAULT = {
  name: "",
  product_count: 2,
  comparison_title: "",
  comparison_subtitle: "",
  discount_amount: "",
  discount_text: "",
  cta_text: "",
  website: "elephantronics.lk",
  products: [
    { name: "", image: "", highlight_color: "Blue", features: ["", "", "", ""], specs: ["", "", "", "", ""] },
    { name: "", image: "", highlight_color: "Orange", features: ["", "", "", ""], specs: ["", "", "", "", ""] },
  ],
};

let mode = "poster";
const states = {
  poster: structuredClone(POSTER_DEFAULT),
  comparison: structuredClone(COMPARISON_DEFAULT),
};
const currentIds = { poster: null, comparison: null };

const $ = (id) => document.getElementById(id);
const getState = () => states[mode];
const getCurrentId = () => currentIds[mode];

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.add("hidden"), 2600);
}

function escapeAttr(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function switchMode(m) {
  mode = m;
  $("tab-poster").classList.toggle("active", m === "poster");
  $("tab-comparison").classList.toggle("active", m === "comparison");
  $("panel-poster").classList.toggle("hidden", m !== "poster");
  $("panel-comparison").classList.toggle("hidden", m !== "comparison");
  fillForm();
}

/* ---------------- Poster ---------------- */

function collectPoster() {
  const st = getState();
  st.name = $("f-name").value;
  st.main_headline_1 = $("f-main1").value;
  st.main_headline_2 = $("f-main2").value;
  st.promo_sub_headline = $("f-promo-sub").value;
  st.promo_tagline = $("f-promo-tag").value;
  st.badge_top_text = $("f-badge-top").value;
  st.badge_bottom_text = $("f-badge-bottom").value;

  const cards = document.querySelectorAll("#products .product");
  const products = [];
  cards.forEach((card) => {
    products.push({
      enabled: card.classList.contains("enabled"),
      name: card.querySelector(".p-name").value,
      desc: card.querySelector(".p-desc").value,
      features: card.querySelector(".p-features").value,
      price: card.querySelector(".p-price").value,
      color: card.querySelector(".p-color").value,
    });
  });
  st.products = products;
  return st;
}

function renderProducts() {
  const st = getState();
  const container = $("products");
  container.innerHTML = "";

  st.products.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "product" + (p.enabled ? " enabled" : "");
    card.style.borderLeftColor = COLOR_HEX[p.color] || "#00e5ff";

    const swatches = COLORS.map((c) => {
      return `<span class="swatch${c === p.color ? " active" : ""}" data-color="${c}" style="background:${COLOR_HEX[c]}" title="${c}"></span>`;
    }).join("");

    card.innerHTML = `
      <div class="product-head">
        <span class="product-index">#${i + 1}</span>
        <label class="product-toggle"><input type="checkbox" class="p-enabled" ${p.enabled ? "checked" : ""}> enabled</label>
        <button class="product-remove" title="Remove">&times; remove</button>
      </div>
      <div class="product-grid">
        <div class="field">
          <label>Name</label>
          <input type="text" class="p-name" value="${escapeAttr(p.name)}" placeholder="e.g. NEO-6M GPS" />
        </div>
        <div class="field">
          <label>Accent color</label>
          <div class="color-row">${swatches}</div>
        </div>
        <div class="field product-full">
          <label>Description</label>
          <input type="text" class="p-desc" value="${escapeAttr(p.desc)}" placeholder="Short description" />
        </div>
        <div class="field product-full">
          <label>Features</label>
          <input type="text" class="p-features" value="${escapeAttr(p.features)}" placeholder="Comma-separated features" />
        </div>
        <div class="field">
          <label>Price</label>
          <input type="text" class="p-price" value="${escapeAttr(p.price)}" placeholder="LKR 450 ONLY" />
        </div>
      </div>
    `;

    card.querySelector(".p-enabled").addEventListener("change", (e) => {
      card.classList.toggle("enabled", e.target.checked);
    });
    card.querySelector(".product-remove").addEventListener("click", () => {
      collectPoster();
      getState().products.splice(i, 1);
      renderProducts();
    });
    card.querySelectorAll(".swatch").forEach((s) => {
      s.addEventListener("click", () => {
        collectPoster();
        getState().products[i].color = s.dataset.color;
        renderProducts();
      });
    });

    container.appendChild(card);
  });

  container.querySelectorAll(".product").forEach((card, idx) => {
    if (!card.querySelector(".p-color")) {
      const h = document.createElement("input");
      h.type = "hidden";
      h.className = "p-color";
      h.value = st.products[idx].color;
      card.appendChild(h);
    }
  });
}

function fillPoster() {
  const st = getState();
  $("f-name").value = st.name || "";
  $("f-main1").value = st.main_headline_1 || "";
  $("f-main2").value = st.main_headline_2 || "";
  $("f-promo-sub").value = st.promo_sub_headline || "";
  $("f-promo-tag").value = st.promo_tagline || "";
  $("f-badge-top").value = st.badge_top_text || "";
  $("f-badge-bottom").value = st.badge_bottom_text || "";
  renderProducts();
}

/* ---------------- Comparison ---------------- */

function collectComparison() {
  const st = getState();
  st.name = $("c-name").value;
  st.comparison_title = $("c-title").value;
  st.comparison_subtitle = $("c-subtitle").value;
  st.discount_amount = $("c-discount-amount").value;
  st.discount_text = $("c-discount-text").value;
  st.cta_text = $("c-cta").value;
  st.website = $("c-website").value;
  st.product_count = parseInt($("c-count").value, 10) === 3 ? 3 : 2;

  const cards = document.querySelectorAll("#c-products .product");
  const products = [];
  cards.forEach((card) => {
    products.push({
      name: card.querySelector(".c-name").value,
      image: card.querySelector(".c-image").value,
      highlight_color: card.querySelector(".c-color").value,
      features: Array.from(card.querySelectorAll(".c-feat")).map((x) => x.value),
      specs: Array.from(card.querySelectorAll(".c-spec")).map((x) => x.value),
    });
  });
  st.products = products;
  return st;
}

function renderComparisonProducts() {
  const st = getState();
  const count = st.product_count === 3 ? 3 : 2;

  while (st.products.length < count) {
    st.products.push({ name: "", image: "", highlight_color: COLORS[st.products.length % COLORS.length], features: ["", "", "", ""], specs: ["", "", "", "", ""] });
  }
  st.products.length = count;

  const container = $("c-products");
  container.innerHTML = "";

  st.products.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "product";
    card.style.borderLeftColor = COLOR_HEX[p.highlight_color] || "#ff6b00";
    card.style.borderLeftWidth = "4px";

    const swatches = COLORS.map((c) => {
      return `<span class="swatch${c === p.highlight_color ? " active" : ""}" data-color="${c}" style="background:${COLOR_HEX[c]}" title="${c}"></span>`;
    }).join("");

    const featInputs = [0, 1, 2, 3]
      .map((j) => `<input type="text" class="c-feat" value="${escapeAttr((p.features || [])[j])}" placeholder="Feature ${j + 1}" />`)
      .join("");
    const specInputs = [0, 1, 2, 3, 4]
      .map((j) => `<input type="text" class="c-spec" value="${escapeAttr((p.specs || [])[j])}" placeholder="Spec ${j + 1}" />`)
      .join("");

    card.innerHTML = `
      <div class="product-head">
        <span class="product-index">#${i + 1}</span>
        <span class="hint">Highlight color</span>
      </div>
      <div class="product-grid">
        <div class="field">
          <label>Product name</label>
          <input type="text" class="c-name" value="${escapeAttr(p.name)}" placeholder="e.g. Arduino UNO" />
        </div>
        <div class="field">
          <label>Accent color</label>
          <div class="color-row">${swatches}</div>
        </div>
        <div class="field product-full">
          <label>Product image <span class="hint">(description; blank = let model decide)</span></label>
          <input type="text" class="c-image" value="${escapeAttr(p.image)}" placeholder="e.g. Realistic Arduino UNO render, dark background" />
        </div>
      </div>
      <div class="c-group">
        <label>Key features (4)</label>
        <div class="grid-2">${featInputs}</div>
      </div>
      <div class="c-group">
        <label>Specifications (5)</label>
        <div class="grid-2">${specInputs}</div>
      </div>
    `;

    card.querySelectorAll(".swatch").forEach((s) => {
      s.addEventListener("click", () => {
        collectComparison();
        getState().products[i].highlight_color = s.dataset.color;
        renderComparisonProducts();
      });
    });

    container.appendChild(card);
  });

  container.querySelectorAll(".product").forEach((card, idx) => {
    if (!card.querySelector(".c-color")) {
      const h = document.createElement("input");
      h.type = "hidden";
      h.className = "c-color";
      h.value = st.products[idx].highlight_color;
      card.appendChild(h);
    }
  });
}

function fillComparison() {
  const st = getState();
  $("c-name").value = st.name || "";
  $("c-title").value = st.comparison_title || "";
  $("c-subtitle").value = st.comparison_subtitle || "";
  $("c-discount-amount").value = st.discount_amount || "";
  $("c-discount-text").value = st.discount_text || "";
  $("c-cta").value = st.cta_text || "";
  $("c-website").value = st.website || "elephantronics.lk";
  $("c-count").value = String(st.product_count === 3 ? 3 : 2);
  renderComparisonProducts();
}

/* ---------------- Shared ---------------- */

function collectState() {
  return mode === "comparison" ? collectComparison() : collectPoster();
}

function fillForm() {
  if (mode === "comparison") fillComparison();
  else fillPoster();
}

async function generate() {
  collectState();
  const st = getState();
  try {
    const res = await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, ...st }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Render failed");
    $("output").value = json.prompt;
    $("modal").classList.remove("hidden");
  } catch (e) {
    toast("Error: " + e.message);
  }
}

function applyPosterSuggestions(st, s) {
  if (s.main_headline_1) st.main_headline_1 = s.main_headline_1;
  if (s.main_headline_2) st.main_headline_2 = s.main_headline_2;
  if (s.promo_sub_headline) st.promo_sub_headline = s.promo_sub_headline;
  if (s.promo_tagline) st.promo_tagline = s.promo_tagline;
  if (s.badge_top_text) st.badge_top_text = s.badge_top_text;
  if (s.badge_bottom_text) st.badge_bottom_text = s.badge_bottom_text;
  if (Array.isArray(s.products)) {
    s.products.forEach((sp, i) => {
      if (st.products[i] && sp.desc) st.products[i].desc = sp.desc;
    });
  }
}

function applyComparisonSuggestions(st, s) {
  if (s.comparison_title) st.comparison_title = s.comparison_title;
  if (s.comparison_subtitle) st.comparison_subtitle = s.comparison_subtitle;
  if (s.discount_amount) st.discount_amount = s.discount_amount;
  if (s.discount_text) st.discount_text = s.discount_text;
  if (s.cta_text) st.cta_text = s.cta_text;
  if (Array.isArray(s.products)) {
    s.products.forEach((sp, i) => {
      const p = st.products[i];
      if (!p) return;
      if (sp.name && !p.name) p.name = sp.name;
      if (sp.image) p.image = sp.image;
      if (Array.isArray(sp.features)) {
        sp.features.forEach((f, j) => {
          if (p.features[j] === undefined) p.features[j] = "";
          if (f && !p.features[j].trim()) p.features[j] = f;
        });
      }
      if (Array.isArray(sp.specs)) {
        sp.specs.forEach((sp2, j) => {
          if (p.specs[j] === undefined) p.specs[j] = "";
          if (sp2 && !p.specs[j].trim()) p.specs[j] = sp2;
        });
      }
    });
  }
}

async function suggest() {
  collectState();
  const st = getState();
  const btn = $("btn-suggest");
  btn.disabled = true;
  btn.textContent = "Thinking...";
  try {
    const res = await fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, ...st }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Suggest failed");
    const s = json.suggestions || {};
    if (mode === "comparison") applyComparisonSuggestions(st, s);
    else applyPosterSuggestions(st, s);
    fillForm();
    toast("Fields updated.");
  } catch (e) {
    toast("Error: " + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "\u2728 AI Suggest";
  }
}

async function save() {
  collectState();
  const st = getState();
  let finalPrompt = "";
  try {
    const res = await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, ...st }),
    });
    const json = await res.json();
    finalPrompt = json.prompt || "";
  } catch (e) {
    /* ignore, still save data */
  }
  const payload = { name: st.name || "Untitled Design", data: st, final_prompt: finalPrompt, type: mode };
  try {
    let res;
    if (getCurrentId()) {
      res = await fetch(`/api/designs/${getCurrentId()}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Save failed");
    currentIds[mode] = json.id;
    toast("Saved.");
    loadHistory();
  } catch (e) {
    toast("Error: " + e.message);
  }
}

async function loadHistory() {
  try {
    const res = await fetch("/api/designs");
    const list = await res.json();
    const container = $("history");
    if (!list.length) {
      container.innerHTML = '<div class="empty">No saved designs yet.</div>';
      return;
    }
    container.innerHTML = "";
    list.forEach((d) => {
      const item = document.createElement("div");
      item.className = "hist-item";
      const badge = document.createElement("span");
      badge.className = "type-badge" + (d.type === "comparison" ? " comparison" : "");
      badge.textContent = d.type === "comparison" ? "Comparison" : "Poster";
      const name = document.createElement("span");
      name.className = "hist-name";
      name.textContent = d.name;
      name.title = d.name;
      const date = document.createElement("span");
      date.className = "hist-date";
      date.textContent = (d.updated_at || d.created_at || "").slice(0, 16).replace("T", " ");
      const del = document.createElement("button");
      del.className = "hist-del";
      del.textContent = "\u2715";
      del.title = "Delete";
      del.addEventListener("click", async (e) => {
        e.stopPropagation();
        await fetch(`/api/designs/${d.id}`, { method: "DELETE" });
        if (currentIds.poster === d.id) currentIds.poster = null;
        if (currentIds.comparison === d.id) currentIds.comparison = null;
        toast("Deleted.");
        loadHistory();
      });
      item.appendChild(badge);
      item.appendChild(name);
      item.appendChild(date);
      item.appendChild(del);
      item.addEventListener("click", async () => {
        const r = await fetch(`/api/designs/${d.id}`);
        const full = await r.json();
        const t = full.type === "comparison" ? "comparison" : "poster";
        states[t] = JSON.parse(full.data);
        currentIds[t] = full.id;
        switchMode(t);
        toast("Loaded \"" + full.name + "\".");
      });
      container.appendChild(item);
    });
  } catch (e) {
    toast("Error loading history.");
  }
}

function newDesign() {
  states[mode] = structuredClone(mode === "comparison" ? COMPARISON_DEFAULT : POSTER_DEFAULT);
  currentIds[mode] = null;
  fillForm();
  toast("New design started.");
}

async function copyOutput() {
  const text = $("output").value;
  try {
    await navigator.clipboard.writeText(text);
    toast("Prompt copied to clipboard.");
  } catch (e) {
    $("output").select();
    document.execCommand("copy");
    toast("Prompt copied.");
  }
}

async function loadSettings() {
  try {
    const res = await fetch("/api/settings");
    const s = await res.json();
    const model = s.model || "openrouter/free";
    $("f-model").value = model;
    const st = $("key-status");
    if (s.has_key) {
      st.textContent = "API key is set.";
      st.className = "key-status ok";
      $("f-apikey").placeholder = "sk-or-... (already set \u2014 leave blank to keep)";
    } else {
      st.textContent = "No API key set \u2014 AI Suggest won't work.";
      st.className = "key-status missing";
    }
  } catch (e) {
    /* ignore */
  }
}

async function saveSettings() {
  const key = $("f-apikey").value.trim();
  const model = $("f-model").value.trim();
  const body = {};
  if (key) body.openrouter_api_key = key;
  if (model) body.llm_model = model;
  try {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Save failed");
    $("f-apikey").value = "";
    toast("Settings saved.");
    loadSettings();
  } catch (e) {
    toast("Error: " + e.message);
  }
}

function init() {
  switchMode("poster");
  loadHistory();
  loadSettings();

  $("btn-generate").addEventListener("click", generate);
  $("btn-suggest").addEventListener("click", suggest);
  $("btn-save").addEventListener("click", save);
  $("btn-new").addEventListener("click", newDesign);
  $("tab-poster").addEventListener("click", () => switchMode("poster"));
  $("tab-comparison").addEventListener("click", () => switchMode("comparison"));

  $("btn-add-product").addEventListener("click", () => {
    collectPoster();
    const st = getState();
    st.products.push({ enabled: true, name: "", desc: "", features: "", price: "", color: COLORS[st.products.length % COLORS.length] });
    renderProducts();
  });

  $("c-count").addEventListener("change", () => {
    collectComparison();
    renderComparisonProducts();
  });

  $("btn-copy").addEventListener("click", copyOutput);
  $("btn-modal-save").addEventListener("click", () => { $("modal").classList.add("hidden"); save(); });
  $("btn-close").addEventListener("click", () => $("modal").classList.add("hidden"));
  $("btn-save-settings").addEventListener("click", saveSettings);
  $("modal").addEventListener("click", (e) => { if (e.target === $("modal")) $("modal").classList.add("hidden"); });
}

init();
