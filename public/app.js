"use strict";

const COLORS = ["Orange", "White", "Grey"];
const COLOR_HEX = {
  Orange: "#ff6b00",
  White: "#ffffff",
  Grey: "#808080",
};
const BRAND_ACCENTS = ["Orange", "White", "Grey"];

function brandAccent(name) {
  return BRAND_ACCENTS.includes(name) ? name : "Orange";
}

const POSTER_DEFAULT = {
  name: "",
  main_headline_1: "SENSOR",
  main_headline_2: "MODULES",
  promo_sub_headline: "4 POWERFUL SENSORS.",
  promo_tagline: "ENDLESS POSSIBILITIES! \uD83D\uDE80",
  badge_top_text: "4 SENSORS.",
  badge_bottom_text: "UNLIMITED PROJECTS!",
  products: [
    { enabled: true, name: "DHT11 SENSOR", desc: "Digital Temperature & Humidity Sensor", features: "3.3V \u2013 5V, Temperature & Humidity Measurement, Digital Output", price: "LKR 310 ONLY", color: "Orange" },
    { enabled: true, name: "DHT22 / AM2302", desc: "High Accuracy Temperature & Humidity Sensor", features: "3.3V \u2013 6V, High Accuracy, Wide Range, Digital Output", price: "LKR 450 ONLY", color: "White" },
    { enabled: true, name: "GY-521 MPU6050", desc: "IMU Module", features: "3-Axis Accel, 3-Axis Gyro, I2C Interface, Wide Voltage", price: "LKR 540 ONLY", color: "Grey" },
    { enabled: true, name: "GY-273 HMC5883L", desc: "Compass Module", features: "3-Axis Mag, I2C, High Sensitivity, Low Power", price: "LKR 610 ONLY", color: "Orange" },
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
    { name: "", image: "", highlight_color: "Orange", features: ["", "", "", ""], specs: ["", "", "", "", ""] },
    { name: "", image: "", highlight_color: "Orange", features: ["", "", "", ""], specs: ["", "", "", "", ""] },
  ],
};

const HERO_DEFAULT = {
  name: "",
  kicker: "NEW ARRIVAL",
  product_name: "",
  product_desc: "",
  price: "",
  was_price: "",
  badge_text: "LIMITED STOCK",
  accent: "Cyan",
  features: ["", "", "", ""],
  cta_text: "ORDER NOW",
  website: "elephantronics.lk",
};

const PROVIDER_WAIT = {
  local: "Rendering locally - a second or two.",
  byteplus: "Sending to BytePlus Seedream - 2K image, usually 10-40 s.",
  horde: "Sending to AI Horde - free queue, usually 1-5 minutes. Keep this tab open.",
  gemini: "Sending to Gemini - usually 20-60 s.",
  cloudflare: "Sending to Cloudflare Workers AI - usually 5-20 s.",
};

const IMAGE_DEFAULT = {
  name: "",
  prompt: "",
  layout: "single",
  aspect_ratio: "1:1",
  model: "gemini-3.1-flash-image",
  logo_path: "",
  photo_path: "",
  photo_1: "",
  photo_2: "",
  kicker: "",
  headline: "",
  subhead: "",
  price: "",
  was_price: "",
  badge: "",
  features: "",
  cta: "ORDER NOW",
  website: "elephantronics.lk",
  whatsapp: "+94 75 844 3801",
  delivery_note: "ISLAND-WIDE DELIVERY",
  accent: "Orange",
  comparison_title: "",
  comparison_subtitle: "",
  discount_amount: "",
  discount_text: "",
  style: "clean",
  headline_1: "",
  headline_2: "",
  promo: "",
  promo_tagline: "",
  badge_top: "",
  badge_bottom: "",
  best_price: "",
  hashtags: "",
  grid_products: [
    { name: "", desc: "", features: "", price: "", accent: "", photo: "" },
    { name: "", desc: "", features: "", price: "", accent: "", photo: "" },
    { name: "", desc: "", features: "", price: "", accent: "", photo: "" },
    { name: "", desc: "", features: "", price: "", accent: "", photo: "" },
  ],
  products: [
    { name: "", accent: "Steel Blue", features: [], specs: [] },
    { name: "", accent: "Orange", features: [], specs: [] },
  ],
};

let mode = "poster";
let lastPrompt = "";
const states = {
  poster: structuredClone(POSTER_DEFAULT),
  hero: structuredClone(HERO_DEFAULT),
  comparison: structuredClone(COMPARISON_DEFAULT),
  image: structuredClone(IMAGE_DEFAULT),
};
const currentIds = { poster: null, hero: null, comparison: null, image: null };

const MODES = [
  { key: "poster", tab: "tab-poster", panel: "panel-poster" },
  { key: "hero", tab: "tab-hero", panel: "panel-hero" },
  { key: "comparison", tab: "tab-comparison", panel: "panel-comparison" },
  { key: "image", tab: "tab-image", panel: "panel-image" },
];

const TYPE_LABELS = { poster: "Poster", hero: "Single", comparison: "Comparison" };

const DEFAULTS = {
  poster: POSTER_DEFAULT,
  hero: HERO_DEFAULT,
  comparison: COMPARISON_DEFAULT,
  image: IMAGE_DEFAULT,
};

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
  if (states[mode] && m !== mode) {
    try {
      collectState();
    } catch (e) {
      /* panel may not be rendered yet */
    }
  }
  mode = m;
  MODES.forEach(({ key, tab, panel }) => {
    $(tab).classList.toggle("active", m === key);
    $(panel).classList.toggle("hidden", m !== key);
  });
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

/* ---------------- Single product hero ---------------- */

function renderHeroColors() {
  const st = getState();
  const container = $("h-colors");
  container.innerHTML = COLORS.map((c) => {
    return `<span class="swatch${c === st.accent ? " active" : ""}" data-color="${c}" style="background:${COLOR_HEX[c]}" title="${c}"></span>`;
  }).join("");
  container.querySelectorAll(".swatch").forEach((s) => {
    s.addEventListener("click", () => {
      collectHero();
      getState().accent = s.dataset.color;
      renderHeroColors();
    });
  });
}

function renderHeroFeatures() {
  const st = getState();
  const container = $("h-features");
  container.innerHTML = (st.features || [])
    .map((f, i) => {
      return `<div class="field">
        <label>Feature ${i + 1}</label>
        <input type="text" class="h-feat" value="${escapeAttr(f)}" placeholder="e.g. Wi-Fi + Bluetooth built in" />
      </div>`;
    })
    .join("");
}

function collectHero() {
  const st = getState();
  st.name = $("h-name").value;
  st.kicker = $("h-kicker").value;
  st.product_name = $("h-product").value;
  st.product_desc = $("h-desc").value;
  st.price = $("h-price").value;
  st.was_price = $("h-was").value;
  st.badge_text = $("h-badge").value;
  st.cta_text = $("h-cta").value;
  st.website = $("h-website").value;
  st.features = Array.from(document.querySelectorAll("#h-features .h-feat")).map((x) => x.value);
  return st;
}

function fillHero() {
  const st = getState();
  $("h-name").value = st.name || "";
  $("h-kicker").value = st.kicker || "";
  $("h-product").value = st.product_name || "";
  $("h-desc").value = st.product_desc || "";
  $("h-price").value = st.price || "";
  $("h-was").value = st.was_price || "";
  $("h-badge").value = st.badge_text || "";
  $("h-cta").value = st.cta_text || "ORDER NOW";
  $("h-website").value = st.website || "elephantronics.lk";
  renderHeroColors();
  renderHeroFeatures();
}

/* ---------------- Generate image ---------------- */

function collectImage() {
  const st = getState();
  st.name = $("i-name").value;
  st.prompt = $("i-prompt").value;
  st.aspect_ratio = $("i-ratio").value;
  st.model = $("i-model").value;
  st.logo_path = $("i-logo").value;
  st.photo_path = $("i-photo").value;
  const checked = document.querySelector('input[name="i-provider"]:checked');
  st.provider = checked ? checked.value : "local";
  const layoutRadio = document.querySelector('input[name="i-layout"]:checked');
  st.layout =
    layoutRadio && layoutRadio.value === "comparison"
      ? "comparison"
      : layoutRadio && layoutRadio.value === "grid"
        ? "grid"
        : "single";
  st.kicker = $("p-kicker").value;
  st.headline = $("p-headline").value;
  st.subhead = $("p-subhead").value;
  st.price = $("p-price").value;
  st.was_price = $("p-was").value;
  st.badge = $("p-badge").value;
  st.features = $("p-features").value;
  st.cta = $("p-cta").value;
  st.website = $("p-website").value;
  st.whatsapp = $("p-whatsapp").value;
  st.delivery_note = $("p-delivery").value;

  st.comparison_title = $("p-cmp-title").value;
  st.comparison_subtitle = $("p-cmp-subtitle").value;
  st.discount_amount = $("p-cmp-disc-amount").value;
  st.discount_text = $("p-cmp-disc-text").value;
  st.photo_1 = $("p-cmp-1-photo").value;
  st.photo_2 = $("p-cmp-2-photo").value;
  st.products = [
    {
      name: $("p-cmp-1-name").value,
      accent: $("p-cmp-1-accent").value,
      features: splitList($("p-cmp-1-feats").value),
      specs: splitList($("p-cmp-1-specs").value),
    },
    {
      name: $("p-cmp-2-name").value,
      accent: $("p-cmp-2-accent").value,
      features: splitList($("p-cmp-2-feats").value),
      specs: splitList($("p-cmp-2-specs").value),
    },
  ];

  st.style = $("g-style").value === "retail" ? "retail" : "clean";
  st.headline_1 = $("g-h1").value;
  st.headline_2 = $("g-h2").value;
  st.promo = $("g-promo").value;
  st.promo_tagline = $("g-promo-tag").value;
  st.badge_top = $("g-badge-top").value;
  st.badge_bottom = $("g-badge-bottom").value;
  st.best_price = $("g-best").value;
  st.delivery_note = $("g-delivery").value || st.delivery_note;
  st.hashtags = $("g-tags").value;
  st.grid_products = [1, 2, 3, 4].map((n) => ({
    name: $("g-" + n + "-name").value,
    desc: $("g-" + n + "-desc").value,
    features: $("g-" + n + "-feats").value,
    price: $("g-" + n + "-price").value,
    accent: $("g-" + n + "-accent").value,
    photo: $("g-" + n + "-photo").value,
  }));
  for (let n = 1; n <= 4; n++) st["photo_" + n] = $("g-" + n + "-photo").value;
  return st;
}

function splitList(value) {
  return String(value || "")
    .split(/,|\n/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function applyLayout() {
  const checked = document.querySelector('input[name="i-layout"]:checked');
  const layout = checked ? checked.value : "single";
  $("i-single-fields").classList.toggle("hidden", layout !== "single");
  $("i-compare-fields").classList.toggle("hidden", layout !== "comparison");
  $("i-grid-fields").classList.toggle("hidden", layout !== "grid");
  $("btn-load-hero").classList.toggle("hidden", layout !== "single");
  $("btn-load-comparison").classList.toggle("hidden", layout !== "comparison");
  $("btn-render-poster").textContent =
    layout === "comparison"
      ? "Render comparison poster"
      : layout === "grid"
        ? "Render four-panel poster"
        : "Render poster";
}

function applyProvider() {
  const checked = document.querySelector('input[name="i-provider"]:checked');
  const provider = checked ? checked.value : "local";
  $("i-local-card").classList.toggle("hidden", provider !== "local");
  $("i-gemini-card").classList.toggle("hidden", provider === "local");
  $("i-model-field").classList.toggle("hidden", provider !== "gemini");
  $("btn-gen-image").textContent =
    provider === "byteplus"
      ? "Generate with Seedream"
      : provider === "horde"
        ? "Generate with AI Horde"
        : provider === "cloudflare"
          ? "Generate with Cloudflare"
          : "Generate image";
}

function fillImage() {
  const st = getState();
  $("i-name").value = st.name || "";
  $("i-prompt").value = st.prompt || "";
  $("i-ratio").value = st.aspect_ratio || "1:1";
  $("i-model").value = st.model || "gemini-3.1-flash-image";
  if ($("i-logo").options.length > 1) $("i-logo").value = st.logo_path || $("i-logo").options[0].value;
  if ($("i-photo").options.length > 0) $("i-photo").value = st.photo_path || "";
  const provider = ["gemini", "horde", "cloudflare", "byteplus"].includes(st.provider) ? st.provider : "local";
  const radio = document.querySelector(`input[name="i-provider"][value="${provider}"]`);
  if (radio) radio.checked = true;
  $("p-kicker").value = st.kicker || "";
  $("p-headline").value = st.headline || "";
  $("p-subhead").value = st.subhead || "";
  $("p-price").value = st.price || "";
  $("p-was").value = st.was_price || "";
  $("p-badge").value = st.badge || "";
  $("p-features").value = st.features || "";
  $("p-cta").value = st.cta || "";
  $("p-website").value = st.website || "";
  $("p-whatsapp").value = st.whatsapp || "";
  $("p-delivery").value = st.delivery_note || "";

  const layout = ["comparison", "grid"].includes(st.layout) ? st.layout : "single";
  const layoutRadio = document.querySelector(`input[name="i-layout"][value="${layout}"]`);
  if (layoutRadio) layoutRadio.checked = true;

  $("p-cmp-title").value = st.comparison_title || "";
  $("p-cmp-subtitle").value = st.comparison_subtitle || "";
  $("p-cmp-disc-amount").value = st.discount_amount || "";
  $("p-cmp-disc-text").value = st.discount_text || "";

  $("g-style").value = st.style === "retail" ? "retail" : "clean";
  $("g-h1").value = st.headline_1 || "";
  $("g-h2").value = st.headline_2 || "";
  $("g-promo").value = st.promo || "";
  $("g-promo-tag").value = st.promo_tagline || "";
  $("g-badge-top").value = st.badge_top || "";
  $("g-badge-bottom").value = st.badge_bottom || "";
  $("g-best").value = st.best_price || "";
  $("g-delivery").value = st.delivery_note || "";
  $("g-tags").value = st.hashtags || "";
  const gp = Array.isArray(st.grid_products) ? st.grid_products : [];
  [1, 2, 3, 4].forEach((n) => {
    const g = gp[n - 1] || {};
    $("g-" + n + "-name").value = g.name || "";
    $("g-" + n + "-desc").value = g.desc || "";
    $("g-" + n + "-feats").value = g.features || "";
    $("g-" + n + "-price").value = g.price || "";
    $("g-" + n + "-accent").value = g.accent || "";
    const photo = $("g-" + n + "-photo");
    if (photo && g.photo) photo.value = g.photo;
  });
  const products = Array.isArray(st.products) ? st.products : [];
  [1, 2].forEach((n) => {
    const p = products[n - 1] || {};
    $("p-cmp-" + n + "-name").value = p.name || "";
    $("p-cmp-" + n + "-accent").value = p.accent || (n === 1 ? "Steel Blue" : "Orange");
    $("p-cmp-" + n + "-feats").value = (p.features || []).join(", ");
    $("p-cmp-" + n + "-specs").value = (p.specs || []).join(", ");
    const photo = $("p-cmp-" + n + "-photo");
    if (photo && st["photo_" + n]) photo.value = st["photo_" + n];
  });
  applyProvider();
  applyLayout();
}

function copyFromHero() {
  const h = states.hero;
  const st = getState();
  if (!String(h.product_name || "").trim()) {
    toast("The Single Product Hero tab is still empty — fill it first.");
    return;
  }
  st.kicker = h.kicker || "";
  st.headline = h.product_name || "";
  st.subhead = h.product_desc || "";
  st.price = h.price || "";
  st.was_price = h.was_price || "";
  st.badge = h.badge_text || "";
  st.features = Array.isArray(h.features) ? h.features.filter(Boolean).join(", ") : "";
  st.cta = h.cta_text || "ORDER NOW";
  st.website = h.website || "elephantronics.lk";
  st.whatsapp = h.whatsapp || "";
  st.delivery_note = h.free_over || h.delivery_note || "";
  st.accent = ["Orange", "White", "Grey"].includes(h.accent) ? h.accent : "Orange";
  fillImage();
  toast("Copied from the Single Product Hero tab.");
}

function copyFromComparison() {
  const c = states.comparison || {};
  const st = getState();
  const names = (c.products || []).map((p) => String(p.name || "").trim());
  if (!String(c.comparison_title || "").trim() && !names.some(Boolean)) {
    toast("The Comparison tab is still empty — fill it first.");
    return;
  }
  st.comparison_title = c.comparison_title || "";
  st.comparison_subtitle = c.comparison_subtitle || "";
  st.discount_amount = c.discount_amount || "";
  st.discount_text = c.discount_text || "";
  st.cta = c.cta_text || st.cta;
  st.website = c.website || st.website;
  st.products = [0, 1].map((i) => {
    const p = (c.products || [])[i] || {};
    return {
      name: p.name || "",
      accent: p.highlight_color || (i === 0 ? "Steel Blue" : "Orange"),
      features: (p.features || []).map((f) => String(f || "").trim()).filter(Boolean),
      specs: (p.specs || []).map((f) => String(f || "").trim()).filter(Boolean),
    };
  });
  const radio = document.querySelector('input[name="i-layout"][value="comparison"]');
  if (radio) radio.checked = true;
  fillImage();
  toast("Copied from the Comparison tab.");
}

function copyFromPoster() {
  const pos = states.poster || {};
  const st = getState();
  const products = Array.isArray(pos.products) ? pos.products : [];
  const anyName = products.some((p) => String(p.name || "").trim());
  if (!anyName) {
    toast("The Poster tab is still empty — fill it first.");
    return;
  }
  st.headline_1 = pos.main_headline_1 || "DEVELOPMENT";
  st.headline_2 = pos.main_headline_2 || "BOARDS";
  st.promo = pos.promo_sub_headline || "";
  st.promo_tagline = pos.promo_tagline || "";
  st.badge_top = pos.badge_top_text || "";
  st.badge_bottom = pos.badge_bottom_text || "";
  if (!String(st.best_price || "").trim()) st.best_price = "BEST PRICE GUARANTEED";
  const hex = (name) => COLOR_HEX[name] || "";
  st.grid_products = [0, 1, 2, 3].map((i) => {
    const p = products[i] || {};
    return {
      name: p.name || "",
      desc: p.desc || "",
      features: p.features || "",
      price: p.price || "",
      accent: hex(p.color),
      photo: "",
    };
  });
  const radio = document.querySelector('input[name="i-layout"][value="grid"]');
  if (radio) radio.checked = true;
  fillImage();
  toast("Copied from the Poster tab.");
}

async function renderPosterFromState() {
  if (imageBusy) return;
  collectImage();
  const st = getState();
  if (st.layout === "comparison") {
    const names = (st.products || []).map((p) => String(p.name || "").trim());
    if (!String(st.comparison_title || "").trim() && !(names[0] && names[1])) {
      setImageStatus("Add a comparison title, or both product names.", "missing");
      toast("Add a comparison title, or both product names.");
      return;
    }
  } else if (st.layout === "grid") {
    const names = (st.grid_products || []).map((p) => String(p.name || "").trim());
    if (!String(st.headline_1 || "").trim() && !names.some(Boolean)) {
      setImageStatus("Add a headline, or at least one product name.", "missing");
      toast("Add a headline, or at least one product name.");
      return;
    }
  } else if (!st.headline.trim()) {
    setImageStatus("Add a headline first.", "missing");
    toast("Add a headline first.");
    return;
  }
  imageBusy = true;
  const btn = $("btn-render-poster");
  btn.disabled = true;
  btn.textContent = "Rendering...";
  setImageStatus("Rendering with headless Chrome - a few seconds.", "");
  const payload = { ...st };
  if (st.layout === "grid") {
    payload.products = (st.grid_products || []).map((p) => ({
      name: p.name,
      desc: p.desc,
      features: splitList(p.features),
      price: p.price,
      accent: p.accent,
    }));
  } else if (st.layout === "comparison") {
    payload.products = (st.products || []).slice(0, 2);
  }
  try {
    const res = await fetch("/api/poster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Render failed");
    showImageResult(json);
    setImageStatus("Rendered and saved to the output folder.", "ok");
    toast(
      st.layout === "comparison"
        ? "Comparison poster rendered."
        : st.layout === "grid"
          ? "Four-panel poster rendered."
          : "Poster rendered."
    );
    loadGallery();
  } catch (e) {
    setImageStatus("Error: " + e.message, "missing");
    toast("Error: " + e.message);
  } finally {
    imageBusy = false;
    btn.disabled = false;
    applyLayout();
  }
}

function setImageStatus(text, cls) {
  const el = $("i-status");
  el.textContent = text || "";
  el.className = "key-status" + (cls ? " " + cls : "");
}

function showImageResult(json) {
  $("i-preview").src = json.url + "?t=" + Date.now();
  $("i-link").href = json.url;
  $("i-info").textContent = json.model + " · " + Math.round(json.bytes / 1024) + " KB · " + json.file;
  $("i-result-card").classList.remove("hidden");
}

async function loadAssets() {
  try {
    const res = await fetch("/api/assets");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Could not list brand assets");
    const logos = json.assets.filter((a) => a.isLogo);
    const rank = (a) => (/reversed/i.test(a.name) ? 0 : /primary/i.test(a.name) ? 1 : /header|icon/i.test(a.name) ? 2 : 3);
    logos.sort((a, b) => rank(a) - rank(b));
    $("i-logo").innerHTML = logos.length
      ? logos.map((a) => `<option value="${escapeAttr(a.path)}">${escapeAttr(a.rel)}</option>`).join("")
      : `<option value="">No logo found in ${escapeAttr(json.root)}</option>`;
    const assetOptions =
      '<option value="">None</option>' +
      json.assets.map((a) => `<option value="${escapeAttr(a.path)}">${escapeAttr(a.rel)}</option>`).join("");
    $("i-photo").innerHTML = assetOptions;
    ["p-cmp-1-photo", "p-cmp-2-photo", "g-1-photo", "g-2-photo", "g-3-photo", "g-4-photo"].forEach((id) => {
      const el = $(id);
      if (el) el.innerHTML = assetOptions;
    });
    const st = getState();
    if (st.logo_path) $("i-logo").value = st.logo_path;
    if (!$("i-logo").value && logos.length) {
      st.logo_path = logos[0].path;
      $("i-logo").value = logos[0].path;
    }
    if (st.photo_path) $("i-photo").value = st.photo_path;
    if (st.photo_1) $("p-cmp-1-photo").value = st.photo_1;
    if (st.photo_2) $("p-cmp-2-photo").value = st.photo_2;
    (st.grid_products || []).forEach((g, i) => {
      const el = $("g-" + (i + 1) + "-photo");
      if (el && g && g.photo) el.value = g.photo;
    });
    if (!$("i-logo").value && logos.length) $("i-logo").value = logos[0].path;
    if (st.logo_path) $("i-logo").value = st.logo_path;
  } catch (e) {
    $("i-logo").innerHTML = `<option value="">Error: ${escapeAttr(e.message)}</option>`;
  }
}

async function loadGallery() {
  try {
    const res = await fetch("/api/images");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Could not list output folder");
    $("i-dir").textContent = json.dir;
    if (!json.images.length) {
      $("i-gallery").innerHTML = '<div class="empty">Nothing generated yet.</div>';
      return;
    }
    $("i-gallery").innerHTML = json.images
      .map(
        (im) =>
          `<a class="shot" href="${im.url}" target="_blank" rel="noreferrer" title="${escapeAttr(im.file)}"><img loading="lazy" src="${im.url}" alt="${escapeAttr(im.file)}" /></a>`
      )
      .join("");
  } catch (e) {
    $("i-gallery").innerHTML = `<div class="empty">Error: ${escapeAttr(e.message)}</div>`;
  }
}

let imageBusy = false;

async function generateImageFromState() {
  if (imageBusy) return;
  collectImage();
  const st = getState();
  if (!st.prompt.trim()) {
    setImageStatus("Prompt is empty — add one above.", "missing");
    toast("Add a prompt first.");
    return;
  }
  imageBusy = true;
  const btn = $("btn-gen-image");
  const checkedProvider = document.querySelector('input[name="i-provider"]:checked');
  const provider = checkedProvider ? checkedProvider.value : "local";
  btn.disabled = true;
  btn.textContent = "Generating...";
  setImageStatus(PROVIDER_WAIT[provider] || PROVIDER_WAIT.gemini, "");
  try {
    const res = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        prompt: st.prompt,
        aspect_ratio: st.aspect_ratio,
        model: st.model,
        logo_path: st.logo_path || "",
        photo_path: st.photo_path || "",
        name: st.name || "",
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Image generation failed");
    showImageResult(json);
    setImageStatus(
      json.queue_wait_s ? `Saved to the output folder after ${json.queue_wait_s} s in the queue.` : "Saved to the output folder.",
      "ok"
    );
    toast("Image saved.");
    loadGallery();
  } catch (e) {
    setImageStatus("Error: " + e.message, "missing");
    toast("Error: " + e.message);
  } finally {
    imageBusy = false;
    btn.disabled = false;
    applyProvider();
  }
}

/* ---------------- Shared ---------------- */

function collectState() {
  if (mode === "comparison") return collectComparison();
  if (mode === "hero") return collectHero();
  if (mode === "image") return collectImage();
  return collectPoster();
}

function fillForm() {
  if (mode === "comparison") fillComparison();
  else if (mode === "hero") fillHero();
  else if (mode === "image") fillImage();
  else fillPoster();
}

async function generate() {
  if (mode === "image") {
    toast("Use the Generate image button on this tab.");
    return;
  }
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
    lastPrompt = json.prompt;
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

function applyHeroSuggestions(st, s) {
  if (s.kicker) st.kicker = s.kicker;
  if (s.product_desc) st.product_desc = s.product_desc;
  if (s.badge_text) st.badge_text = s.badge_text;
  if (s.cta_text) st.cta_text = s.cta_text;
  if (Array.isArray(s.features)) {
    s.features.forEach((f, i) => {
      if (st.features[i] !== undefined && f) st.features[i] = f;
    });
  }
}

async function suggest() {
  if (mode === "image") {
    toast("AI Suggest is for the prompt tabs; the image tab takes a finished prompt.");
    return;
  }
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
    else if (mode === "hero") applyHeroSuggestions(st, s);
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
  if (mode === "image") {
    toast("Images are saved automatically in the output folder.");
    return;
  }
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
      const type = TYPE_LABELS[d.type] ? d.type : "poster";
      const badge = document.createElement("span");
      badge.className = "type-badge" + (type === "poster" ? "" : " " + type);
      badge.textContent = TYPE_LABELS[type];
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
        const t = TYPE_LABELS[full.type] ? full.type : "poster";
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
  states[mode] = structuredClone(DEFAULTS[mode] || POSTER_DEFAULT);
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
    const k = $("kimi-status");
    if (s.has_kimi) {
      k.textContent = "Kimi key is set \u2014 " + (s.kimi_model || "kimi-k3.1-pro") + " writes the copy.";
      k.className = "key-status ok";
      $("f-kimi").placeholder = "sk-... (already set \u2014 leave blank to keep)";
    } else {
      k.textContent = "No Kimi key.";
      k.className = "key-status missing";
    }
    if (s.has_key) {
      st.textContent = s.has_kimi
        ? "OpenRouter key is set \u2014 stand-by fallback, Kimi answers first."
        : "OpenRouter key is set \u2014 AI Suggest uses it.";
      st.className = "key-status ok";
      $("f-apikey").placeholder = "sk-or-... (already set \u2014 leave blank to keep)";
    } else {
      st.textContent = "No OpenRouter key.";
      st.className = s.has_kimi ? "key-status" : "key-status missing";
    }

    const g = $("gemini-status");
    if (s.has_gemini_key) {
      g.textContent = "Gemini key is set.";
      g.className = "key-status ok";
      $("f-gemini").placeholder = "AIza... (already set \u2014 leave blank to keep)";
    } else {
      g.textContent = "No Gemini key \u2014 the image tab won't work.";
      g.className = "key-status missing";
    }
  } catch (e) {
    /* ignore */
  }
}

async function saveSettings() {
  const key = $("f-apikey").value.trim();
  const model = $("f-model").value.trim();
  const gemini = $("f-gemini").value.trim();
  const kimi = $("f-kimi").value.trim();
  const body = {};
  if (key) body.openrouter_api_key = key;
  if (model) body.llm_model = model;
  if (gemini) body.gemini_api_key = gemini;
  if (kimi) body.kimi_api_key = kimi;
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
  loadAssets();
  loadGallery();

  $("btn-generate").addEventListener("click", generate);
  $("btn-suggest").addEventListener("click", suggest);
  $("btn-save").addEventListener("click", save);
  $("btn-new").addEventListener("click", newDesign);
  $("tab-poster").addEventListener("click", () => switchMode("poster"));
  $("tab-hero").addEventListener("click", () => switchMode("hero"));
  $("tab-comparison").addEventListener("click", () => switchMode("comparison"));
  $("tab-image").addEventListener("click", () => switchMode("image"));
  $("btn-gen-image").addEventListener("click", generateImageFromState);
  $("btn-render-poster").addEventListener("click", renderPosterFromState);
  $("btn-load-hero").addEventListener("click", copyFromHero);
  $("btn-load-comparison").addEventListener("click", copyFromComparison);
  $("btn-load-poster").addEventListener("click", copyFromPoster);
  const accentOptions = $("g-accent-options").innerHTML;
  [1, 2, 3, 4].forEach((n) => {
    $("g-" + n + "-accent").innerHTML = accentOptions;
  });
  document.querySelectorAll('input[name="i-layout"]').forEach((r) => r.addEventListener("change", applyLayout));
  document.querySelectorAll('input[name="i-provider"]').forEach((r) => r.addEventListener("change", applyProvider));
  $("btn-pull-prompt").addEventListener("click", () => {
    if (!lastPrompt) {
      toast("Generate a prompt on another tab first.");
      return;
    }
    states.image.prompt = lastPrompt;
    fillImage();
    toast("Last prompt loaded.");
  });
  $("btn-to-image").addEventListener("click", () => {
    const prompt = $("output").value.trim();
    if (!prompt) {
      toast("Nothing to send yet.");
      return;
    }
    states.image.prompt = prompt;
    lastPrompt = prompt;
    $("modal").classList.add("hidden");
    switchMode("image");
    toast("Prompt moved to the image tab.");
  });

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
