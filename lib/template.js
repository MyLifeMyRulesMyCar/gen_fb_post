"use strict";

function cardNote(n) {
  if (n === 4) return "Four horizontal product cards side-by-side.";
  if (n === 2) return "Two larger horizontal product cards side-by-side.";
  if (n === 3) return "Three horizontal product cards side-by-side.";
  if (n === 1) return "One full-width product card.";
  return `${n} horizontal product cards side-by-side.`;
}

/* brand.txt allows orange, navy, dark blue, white and grey only. Older saved
   designs may still carry Blue/Red/Green/Yellow accents, so map them to the
   nearest brand accent instead of passing a non-brand colour to the model. */
const BRAND_ACCENTS = ["Orange", "White", "Grey"];

function accent(name) {
  return BRAND_ACCENTS.includes(name) ? name : "Orange";
}

function buildPrompt(data) {
  data = data || {};
  const products = (data.products || []).filter((p) => p && p.enabled);

  const main1 = (data.main_headline_1 || "SENSOR").trim();
  const main2 = (data.main_headline_2 || "MODULES").trim();
  const promoSub = (data.promo_sub_headline || "").trim();
  const promoTag = (data.promo_tagline || "").trim();
  const badgeTop = (data.badge_top_text || "").trim();
  const badgeBottom = (data.badge_bottom_text || "").trim();
  const website = (data.website || "elephantronics.lk").trim();

  const productLines = products
    .map((p, i) => {
      return `     - **Product ${i + 1} (Accent: ${accent(p.color)}):** Name: "${p.name || ""}" | Description: "${p.desc || ""}" | Features: "${p.features || ""}" | Price: "${p.price || ""}"`;
    })
    .join("\n");

  const resolvedProducts = products
    .map((p, i) => {
      return `- **[PRODUCT_${i + 1}_NAME]:** ${p.name || ""}\n  - **[PRODUCT_${i + 1}_DESC]:** ${p.desc || ""}\n  - **[PRODUCT_${i + 1}_FEATURES]:** ${p.features || ""}\n  - **[PRODUCT_${i + 1}_PRICE]:** ${p.price || ""}\n  - **[PRODUCT_${i + 1}_COLOR]:** ${accent(p.color)}`;
    })
    .join("\n");

  return `**Role & Context:** You are an expert graphic designer specializing in high-contrast, tech-focused social media advertising for the Sri Lankan electronics market. You are creating a promotional product poster for "Elephantronics."

**Task:** Generate a 1024x1024 pixel, square social media poster for the brand "Elephantronics." The design must be dense with information, high-energy, and visually follow the established "Elephantronics" brand aesthetic.

**Fixed Design System (DO NOT CHANGE):**

1.  **Background:** A very dark navy base (#151B2B) with subtle PCB (Printed Circuit Board) circuit-trace line work and faint hexagonal motifs in the same navy family, plus a soft radial orange (#FF6B00) glow behind the main product area. The pattern must stay quiet: texture, never decoration that competes with the products. No blue, cyan or neon glows anywhere.
2.  **Color Palette — exactly these five, nothing else:**
    - **Primary accent:** Orange (#FF6B00) — buttons, highlights, important headings, PCB-inspired graphics, price emphasis.
    - **Primary background:** Deep Navy (#151B2B).
    - **Alternative background:** Dark Blue (#182033) — cards, panels, technical layouts.
    - **Text on dark:** White (#FFFFFF) — headlines and main copy.
    - **Secondary text:** Grey (#808080) — specifications, descriptions, dividers.
    - **Forbidden:** cyan, gold, yellow, red, green, purple, neon glows, gradient rainbows, per-product rainbow coding. The aesthetic is dark, technical and modern, not colourful or playful.
3.  **Typography Style:**
    - **Headlines:** Large, bold, clean sans-serif, tight letter spacing, strong but soft shadow. Legible on a phone screen.
    - **Body Text:** Clean sans-serif.
    - **Prices:** Very large, bold numbers in Orange (#FF6B00).
    - **No distressed, rough, grunge or textured type treatment.** Brand type is clean and bold, never weathered.
4.  **Layout Structure (Top to Bottom):**
    - **Top-Left:** The "Elephantronics" logo supplied as an asset, used exactly as given. If the wordmark is typeset rather than supplied, "Elephant" is Orange (#FF6B00) and "ronics" is White (#FFFFFF). Below it the tagline "POWERING YOUR IDEAS" in thin, expanded, grey text.
    - **Top-Right:** A clean angled promotional badge: solid Orange (#FF6B00) panel with Deep Navy (#151B2B) text for contrast, slight rotation. Top line "${badgeTop}", bottom line "${badgeBottom}". No red/yellow split, no lightning bolt.
    - **Center-Main:** The main headline "${main1}" (large white text) and "${main2}" (large orange text #FF6B00).
    - **Center-Sub:** An orange (#FF6B00) promotional strip with Deep Navy (#151B2B) text reading "${promoSub}" and directly below it, a white text line "${promoTag}".
    - **Center-Products:** ${cardNote(products.length)}. Each card must have:
        - A rounded border in Dark Blue (#182033) with an Orange (#FF6B00) accent rule; at most one card may use White as its accent instead.
        - A product photograph (placeholder for now).
        - A product name.
        - A short description.
        - Feature bullets with orange checkmarks.
        - A price badge in Orange with Deep Navy (#151B2B) text.
${productLines}
    - **Mid-Section:** A horizontal panel in Dark Blue (#182033) with five application categories (Arduino/ESP32, Robotics & Drones, IoT & Home Automation, Student Projects, Research & Innovation), each with a relevant icon in Orange and separated by grey vertical lines.
    - **Bottom-Action:** A three-section commercial bar on Deep Navy:
        - **Left:** "BEST PRICE GUARANTEED" with a medal icon.
        - **Center:** "ISLAND-WIDE DELIVERY" with a truck icon, and "FREE OVER RS. 5,000" with "FREE" in Orange.
        - **Right:** "ORDER NOW" (large, bold, white), a shopping cart icon, and an Orange (#FF6B00) button with Deep Navy (#151B2B) text for contrast, reading the URL "${website}".
    - **Bottom-Contact:** The WhatsApp platform mark with "WHATSAPP" and the phone number "+94 75 844 3801". The official WhatsApp green is allowed here because it is a third-party platform logo, not a brand accent.

**Variable Text (Resolved):**
- **[MAIN_HEADLINE_1]:** ${main1}
- **[MAIN_HEADLINE_2]:** ${main2}
- **[PROMO_SUB_HEADLINE]:** ${promoSub}
- **[PROMO_TAGLINE]:** ${promoTag}
- **[BADGE_TOP_TEXT]:** ${badgeTop}
- **[BADGE_BOTTOM_TEXT]:** ${badgeBottom}
${resolvedProducts}

**Asset Instructions:**
- **Logo:** Use the provided "Elephantronics" logo icon exactly as given. Do not generate or redraw a new elephant/logo icon.
- **Product images:** If product photos are provided, use them as the product card images. If no product photos are provided, let the model decide the most suitable product imagery.
`;
}

module.exports = { buildPrompt };
