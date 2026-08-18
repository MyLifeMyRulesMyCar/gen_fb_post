"use strict";

function cardNote(n) {
  if (n === 4) return "Four horizontal product cards side-by-side.";
  if (n === 2) return "Two larger horizontal product cards side-by-side.";
  if (n === 3) return "Three horizontal product cards side-by-side.";
  if (n === 1) return "One full-width product card.";
  return `${n} horizontal product cards side-by-side.`;
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

  const productLines = products
    .map((p, i) => {
      return `     - **Product ${i + 1} (Accent: ${p.color || "Blue"}):** Name: "${p.name || ""}" | Description: "${p.desc || ""}" | Features: "${p.features || ""}" | Price: "${p.price || ""}"`;
    })
    .join("\n");

  const resolvedProducts = products
    .map((p, i) => {
      return `- **[PRODUCT_${i + 1}_NAME]:** ${p.name || ""}\n  - **[PRODUCT_${i + 1}_DESC]:** ${p.desc || ""}\n  - **[PRODUCT_${i + 1}_FEATURES]:** ${p.features || ""}\n  - **[PRODUCT_${i + 1}_PRICE]:** ${p.price || ""}\n  - **[PRODUCT_${i + 1}_COLOR]:** ${p.color || "Blue"}`;
    })
    .join("\n");

  return `**Role & Context:** You are an expert graphic designer specializing in high-contrast, tech-focused social media advertising for the Sri Lankan electronics market. You are creating a promotional product poster for "Elephantronics."

**Task:** Generate a 1024x1024 pixel, square social media poster for the brand "Elephantronics." The design must be dense with information, high-energy, and visually follow the established "Elephantronics" brand aesthetic.

**Fixed Design System (DO NOT CHANGE):**

1.  **Background:** A very dark navy/black base with a glowing blue PCB (Printed Circuit Board) circuit trace pattern running throughout. Include small, bright blue glowing nodes at circuit intersections and a soft radial blue glow behind the main product area.
2.  **Color Palette:**
    - **Background:** Dark Navy (#0B0F19), Black (#000000)
    - **Tech Accent:** Cyan/Blue Glow (#00E5FF)
    - **Headlines:** White (#FFFFFF) and Gold/Yellow (#FFD700)
    - **Promo Strip:** Bright Orange/Yellow (#FF8C00)
    - **Product Accents:** Use a specific color for each product card (Blue, Red, Green, Yellow).
3.  **Typography Style:**
    - **Headlines:** Very large, bold, condensed display font with a slightly distressed/rough texture and strong shadow.
    - **Body Text:** Clean, sans-serif font.
    - **Prices:** Very large, bold numbers.
4.  **Layout Structure (Top to Bottom):**
    - **Top-Left:** The "Elephantronics" logo (a stylized elephant head with an electronic aesthetic, positioned before the brand name). The brand name "Elephant" is Orange, "ronics" is White. Below it, the tagline "POWERING YOUR IDEAS" in thin, expanded, light-gray text.
    - **Top-Right:** A dynamic angled promotional badge with a white "${badgeTop}" text on a red upper section and black "${badgeBottom}" text on a yellow lower section, with a yellow lightning bolt.
    - **Center-Main:** The main headline "${main1}" (in large white text) and "${main2}" (in large gold/yellow text).
    - **Center-Sub:** A yellow/orange promotional strip with black text reading "${promoSub}" and directly below it, a white text line "${promoTag}".
    - **Center-Products:** ${cardNote(products.length)}. Each card must have:
        - A rounded/outlined border matching its accent color.
        - A product photograph (placeholder for now).
        - A product name.
        - A short description.
        - Feature bullets with checkmarks.
        - A price badge.
${productLines}
    - **Mid-Section:** A horizontal panel with five application categories (Arduino/ESP32, Robotics & Drones, IoT & Home Automation, Student Projects, Research & Innovation), each with a relevant icon and separated by vertical lines.
    - **Bottom-Action:** A three-section commercial bar:
        - **Left:** "BEST PRICE GUARANTEED" with a medal icon.
        - **Center:** "ISLAND-WIDE DELIVERY" with a truck icon, and "FREE OVER RS. 5,000" (with "FREE" in yellow).
        - **Right:** "ORDER NOW" (large, bold), a shopping cart icon, and a yellow button with the URL "elephantronics.lk".
    - **Bottom-Contact:** A green WhatsApp icon with "WHATSAPP" and the phone number "+94 75 844 3801".

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
