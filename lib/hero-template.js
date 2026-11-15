"use strict";

function clean(v) {
  return String(v == null ? "" : v).trim();
}

function buildHeroPrompt(data) {
  data = data || {};

  const kicker = clean(data.kicker);
  const productName = clean(data.product_name) || "PRODUCT NAME";
  const productDesc = clean(data.product_desc);
  const price = clean(data.price);
  const wasPrice = clean(data.was_price);
  const badge = clean(data.badge_text);
  const accent = ["Orange", "White", "Grey"].includes(clean(data.accent)) ? clean(data.accent) : "Orange";
  const cta = clean(data.cta_text) || "ORDER NOW";
  const website = clean(data.website) || "elephantronics.lk";
  const whatsapp = clean(data.whatsapp) || "+94 75 844 3801";
  const delivery = clean(data.delivery_note) || "ISLAND-WIDE DELIVERY";
  const freeOver = clean(data.free_over) || "FREE OVER RS. 5,000";

  const features = (Array.isArray(data.features) ? data.features : []).map(clean).filter(Boolean);
  const featureBlock = features.length
    ? features.map((f, i) => `     - **Feature ${i + 1}:** ${f}`).join("\n")
    : "     - (no features supplied — leave the feature row out entirely)";

  const priceBlock = price
    ? wasPrice
      ? `**${price}** in very large bold Orange (#FF6B00) numerals, with **${wasPrice}** directly beside it in smaller grey text carrying a clean horizontal strikethrough line.`
      : `**${price}** in very large bold Orange (#FF6B00) numerals.`
    : "No price supplied — omit the price line completely. Never invent a price.";

  return `**Role & Context:** You are an expert graphic designer specializing in high-contrast, tech-focused social media advertising for the Sri Lankan electronics market. You are creating a single-product hero poster for "Elephantronics."

**Task:** Generate a 1024x1024 pixel, square social media poster for the brand "Elephantronics" featuring **one** product as the hero. The design must feel premium and confident, with the product large and unmistakable. Follow the established "Elephantronics" brand aesthetic exactly.

**Fixed Design System (DO NOT CHANGE):**

1.  **Background:** Deep Navy (#151B2B) base with a soft radial Orange (#FF6B00) glow behind the hero product, plus very quiet PCB circuit-trace line work and faint hexagonal motifs in the navy family. No blue or cyan glow.
2.  **Color Palette — exactly these five, nothing else:**
    - **Primary accent:** Orange (#FF6B00) — highlights, badges, buttons, PCB-inspired graphics, price emphasis.
    - **Design accent for this poster:** ${accent} — used only for the feature chips and kicker. Orange remains the dominant promotional colour.
    - **Primary background:** Deep Navy (#151B2B).
    - **Alternative background:** Dark Blue (#182033) — panels and technical blocks.
    - **Text on dark:** White (#FFFFFF).
    - **Secondary text:** Grey (#808080) — descriptions, specifications, dividers.
    - **Forbidden:** cyan, gold, yellow, red, green, purple, rainbow per-product coding, neon glows. The aesthetic is dark, technical and modern, not colourful or playful.
3.  **Typography Style:**
    - **Headlines:** Large, bold, clean sans-serif with tight letter spacing and a soft shadow. Readable on a phone.
    - **Body Text:** Clean sans-serif.
    - **Prices:** Very large, bold numerals in Orange (#FF6B00).
    - **Kicker:** Thin uppercase label with wide letter spacing.
    - **No distressed, rough, grunge or textured type.** Clean and bold only.
4.  **Layout Structure (Top to Bottom):**
    - **Top-Left:** The supplied "Elephantronics" logo used exactly as given. If the wordmark is typeset, "Elephant" is Orange (#FF6B00) and "ronics" is White (#FFFFFF). Below it, the tagline "POWERING YOUR IDEAS" in thin, expanded, grey text.
    - **Top-Right:** A clean angled badge: solid Orange (#FF6B00) panel with Deep Navy (#151B2B) text for contrast, reading "${badge || "LIMITED STOCK"}". Slight rotation. No red/yellow split, no lightning bolt.
    - **Center-Kicker:** A small letter-spaced uppercase label above the product name: "${kicker}", in Orange. Render it only if a kicker is supplied.
    - **Center-Product Name:** "${productName}" as the largest text on the poster — bold, clean, white with a soft shadow, wrapping to at most two lines.
    - **Center-Product Image:** One large, realistic product photograph or render of the product, centered, roughly 45% of the poster height, floating with a soft shadow and a subtle Orange rim glow. Do not distort it, do not add a second product, do not invent accessories that are not part of the product.
    - **Center-Description:** One short line under the product name, grey: "${productDesc}". Render it only if supplied.
    - **Center-Price:** ${priceBlock}
    - **Center-Features:** A row or two of short feature chips, using ${accent} for the tick and white for the text. Keep each chip to 2–5 words. Features supplied:
${featureBlock}
    - **Bottom-Action:** A three-section commercial bar on Deep Navy, separated by a single Orange rule:
        - **Left:** "BEST PRICE GUARANTEED" with a medal icon.
        - **Center:** "${delivery}" with a truck icon, and "${freeOver}" with "FREE" in Orange.
        - **Right:** "${cta}" (large, bold, white), a shopping cart icon, and an Orange (#FF6B00) button with Deep Navy (#151B2B) text for contrast, reading "${website}".
    - **Bottom-Contact:** The WhatsApp platform mark with "WHATSAPP" and the phone number "${whatsapp}". WhatsApp green is allowed here only because it is a third-party platform logo.

**Variable Text (Resolved):**
- **[KICKER]:** ${kicker}
- **[PRODUCT_NAME]:** ${productName}
- **[PRODUCT_DESC]:** ${productDesc}
- **[PRICE]:** ${price}
- **[WAS_PRICE]:** ${wasPrice}
- **[BADGE_TEXT]:** ${badge}
- **[ACCENT_COLOR]:** ${accent}
- **[CTA_TEXT]:** ${cta}
- **[WEBSITE]:** ${website}

**Hierarchy Rules:**
1. The product must be the visual hero — bigger than any text block.
2. The price is the second thing the eye finds.
3. Everything else supports those two.
4. Do not overcrowd the poster: if the description is long, shorten it to one clean line rather than shrinking the product.
5. Keep at least 8% clear margin on all four sides.

**Content Rules:**
- Never invent a price, model number, certification mark, warranty length, or technical specification. Use only the text supplied above.
- If a field is empty, omit that element. Do not fill it with a plausible-looking guess.
- Do not add "CE", "FCC", "certified", or manufacturer logos that were not supplied.

**Asset Instructions:**
- **Logo:** Use the provided "Elephantronics" logo icon exactly as given. Do not generate or redraw a new elephant/logo icon.
- **Product image:** If a product photo is provided, use it unchanged. If none is provided, render the product described by "${productName}" as a clean, realistic product shot on a dark background, with no text printed on the product that was not supplied.
`;
}

module.exports = { buildHeroPrompt };
