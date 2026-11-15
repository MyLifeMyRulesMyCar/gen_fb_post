"use strict";

const b = "`";
const fence = "```";

function list(items) {
  return (items || [])
    .map((x) => (x == null ? "" : String(x).trim()))
    .filter(Boolean)
    .join(", ");
}

const BRAND_ACCENTS = ["Orange", "White", "Grey"];

function accent(name) {
  return BRAND_ACCENTS.includes(String(name || "").trim()) ? String(name).trim() : "Orange";
}

function buildComparisonPrompt(data) {
  data = data || {};
  const count = data.product_count === 3 ? 3 : 2;
  const products = [];
  for (let i = 0; i < count; i++) {
    const p = (data.products && data.products[i]) || {};
    products.push({
      name: p.name || "",
      image: p.image || "",
      highlight_color: accent(p.highlight_color || (i === 0 ? "Orange" : "White")),
      features: Array.isArray(p.features) ? p.features : [],
      specs: Array.isArray(p.specs) ? p.specs : [],
    });
  }

  const discountAmount = (data.discount_amount || "").trim();
  const discountText = (data.discount_text || "").trim();
  const title = (data.comparison_title || "").trim();
  const subtitle = (data.comparison_subtitle || "").trim();
  const cta = (data.cta_text || "").trim();
  const website = (data.website || "elephantronics.lk").trim();

  const varBlockLines = [];
  varBlockLines.push(`PRODUCT_COUNT = ${count}`);
  varBlockLines.push("");
  products.forEach((p, i) => {
    const n = i + 1;
    varBlockLines.push(`PRODUCT_${n}_NAME = ${p.name}`);
    varBlockLines.push(`PRODUCT_${n}_IMAGE = ${p.image || "Realistic product image/render"}`);
    varBlockLines.push(`PRODUCT_${n}_FEATURES = ${list(p.features)}`);
    varBlockLines.push(`PRODUCT_${n}_SPECS = ${list(p.specs)}`);
    varBlockLines.push(`PRODUCT_${n}_HIGHLIGHT_COLOR = ${p.highlight_color}`);
    varBlockLines.push("");
  });
  varBlockLines.push(`DISCOUNT_AMOUNT = ${discountAmount}`);
  varBlockLines.push(`DISCOUNT_TEXT = ${discountText}`);
  varBlockLines.push("");
  varBlockLines.push(`COMPARISON_TITLE = ${title}`);
  varBlockLines.push(`COMPARISON_SUBTITLE = ${subtitle}`);
  varBlockLines.push("");
  varBlockLines.push(`CTA_TEXT = ${cta}`);
  varBlockLines.push(`WEBSITE = ${website}`);
  const varBlock = varBlockLines.join("\n");

  const setLines = [];
  setLines.push(`PRODUCT_COUNT = ${count}`);
  setLines.push("");
  products.forEach((p, i) => {
    const n = i + 1;
    setLines.push(`PRODUCT_${n}_NAME = ${p.name}`);
    setLines.push(`PRODUCT_${n}_FEATURES = ${list(p.features)}`);
    setLines.push(`PRODUCT_${n}_SPECS = ${list(p.specs)}`);
    setLines.push(`PRODUCT_${n}_HIGHLIGHT_COLOR = ${p.highlight_color}`);
    setLines.push("");
  });
  setLines.push(`DISCOUNT_AMOUNT = ${discountAmount}`);
  setLines.push(`DISCOUNT_TEXT = ${discountText}`);
  setLines.push("");
  setLines.push(`COMPARISON_TITLE = ${title}`);
  setLines.push(`COMPARISON_SUBTITLE = ${subtitle}`);
  setLines.push("");
  setLines.push(`CTA_TEXT = ${cta}`);
  setLines.push(`WEBSITE = ${website}`);
  const varSet = setLines.join("\n");

  return `## ELEPHANTRONICS — PRODUCT COMPARISON INFOGRAPHIC GENERATOR

Create a premium, modern electronics marketing infographic for **Elephantronics**, a Sri Lankan electronics component and development-board store.

### 1. INPUT VARIABLES

Use the following variables to dynamically generate the infographic:

${fence}text
${varBlock}
${fence}

If ${b}PRODUCT_COUNT = 2${b}, use a clean **two-column comparison layout**.

If ${b}PRODUCT_COUNT = 3${b}, use a clean **three-column comparison layout**.

Do not display unused product sections.

---

### 2. FORMAT

**Aspect Ratio:** 1:1 square

Designed specifically for:

* Facebook
* Instagram
* Social media advertising
* Electronics ecommerce promotion

Maintain excellent readability on mobile screens.

---

### 3. BRAND STYLE

Create a futuristic electronics / IoT / embedded-systems aesthetic.

Use:

* Deep Navy background: ${b}#151B2B${b}
* Dark Blue panels: ${b}#182033${b}
* Brand Orange: ${b}#FF6B00${b}
* White primary typography: ${b}#FFFFFF${b}
* Grey secondary typography: ${b}#808080${b}
* Orange glowing highlights
* Subtle PCB traces in the navy family
* Minimal circuit patterns
* Soft orange technological glow

Do not introduce cyan, gold, yellow, red, green or purple. The palette is these five colours only, and the aesthetic is dark, technical and modern rather than colourful.

The design should feel like a **premium electronics hardware advertisement**, not a generic template.

---

### 4. HEADER

At the top center, display the Elephantronics logo.

Logo treatment:

**Elephant** → vivid orange ${b}#FF6B00${b}

**ronics** → white ${b}#FFFFFF${b}

Use bold, clean, modern sans-serif typography. No distressed or rough texture.

Under the logo:

**POWERING YOUR IDEAS**

Use:

* Thin uppercase typography
* Light gray
* Increased letter spacing
* Minimal premium engineering aesthetic

---

### 5. COMPARISON TITLE

Below the branding, display:

**{COMPARISON_TITLE}**

Large, bold, white typography.

Underneath:

**{COMPARISON_SUBTITLE}**

Use smaller light-gray typography.

Keep this section visually clean and centered.

---

### 6. DISCOUNT BADGE

Place a visually prominent promotional badge near the upper-middle section.

Display:

**{DISCOUNT_AMOUNT}**

and underneath:

**{DISCOUNT_TEXT}**

Example:

**15% OFF**

**ON DEVELOPMENT BOARDS**

Design:

* Orange gradient appearance
* Soft orange glow
* Slight 3D depth
* Premium ecommerce promotion style
* Strong visual hierarchy

Do not allow the badge to overpower the product comparison.

---

### 7. PRODUCT COMPARISON AREA

Create either **2 or 3 equal product cards**, depending on ${b}PRODUCT_COUNT${b}.

Each product card should contain:

#### PRODUCT IMAGE

Use the supplied product image/render.

Make it:

* Realistic
* High quality
* Correct proportions
* Clearly recognizable
* Professionally lit
* Slightly floating above the card
* Subtle shadow/glow

Do not distort the product.

---

#### PRODUCT NAME

Display:

**{PRODUCT_NAME}**

Use large bold typography.

---

#### KEY FEATURES

Display the supplied features:

* Feature 1
* Feature 2
* Feature 3
* Feature 4

Use small check icons or clean bullet indicators.

Keep feature descriptions short and easy to scan.

---

#### SPECIFICATIONS

Display the supplied specifications in a compact technical-information section.

Example:

**Specifications**

* ATmega328P
* 16 MHz
* 14 Digital I/O
* 6 Analog Inputs
* 5V Operation

Use a clean technical typography style.

---

### 8. PRODUCT COLOR CODING

Use each product's assigned highlight color:

${b}{PRODUCT_HIGHLIGHT_COLOR}${b}

The only allowed values are Orange ${b}#FF6B00${b}, White ${b}#FFFFFF${b} and Grey ${b}#808080${b}. If a value outside that set is supplied, use Orange.

Use it only for:

* Product title accents
* Small borders
* Icons
* Glow
* Specification highlights
* PCB lighting

Do not allow accent colors to dominate the overall Elephantronics brand identity.

Brand orange should remain the primary promotional color.

---

### 9. COMPARISON HIERARCHY

The infographic should allow the viewer to understand the difference between the products **within 3–5 seconds**.

Prioritize information in this order:

1. Product name
2. Product image
3. Main selling point
4. Key features
5. Technical specifications

Avoid excessive technical text.

Convert long descriptions into short, marketing-friendly phrases.

---

### 10. BOTTOM CTA

Create a clean promotional footer.

Display:

**{CTA_TEXT}**

Example:

**BUILD • CREATE • INNOVATE**

Underneath:

**Available Now At**

Then display prominently:

**{WEBSITE}**

Use bright Elephantronics orange with a subtle glow.

---

### 11. CATEGORY INDICATORS

At the bottom, optionally include small clean category icons with labels such as:

* Arduino Boards
* ESP32 Modules
* Raspberry Pi
* Sensors
* Robotics
* Development Boards
* Electronics Components

Only show categories relevant to the products being promoted.

---

### 12. VISUAL RULES

The final design must have:

* Premium ecommerce quality
* Strong visual hierarchy
* Clean spacing
* Balanced composition
* High contrast
* Realistic product renders
* Professional lighting
* Subtle PCB technology elements
* Modern engineering aesthetic
* Mobile-friendly typography
* No unnecessary decorative elements
* No overcrowding

Use depth through:

* Soft shadows
* Subtle glows
* Layered panels
* Controlled gradients
* Product lighting

Avoid:

* Cheap-looking graphics
* Excessive neon
* Too many colors
* Excessive text
* Cluttered backgrounds
* Tiny unreadable specifications
* Cartoon-style products
* Distorted product images
* Random technical symbols

---

### 13. LAYOUT LOGIC

Automatically adapt the composition based on ${b}PRODUCT_COUNT${b}.

**2 PRODUCTS**

Use:

${fence}text
                 LOGO
          POWERING YOUR IDEAS

       PRODUCT COMPARISON TITLE
              SUBTITLE

              DISCOUNT

    ┌─────────────────────────────┐
    │                             │
    │   PRODUCT 1   |   PRODUCT 2 │
    │     IMAGE     |     IMAGE   │
    │     NAME      |     NAME    │
    │   FEATURES    |   FEATURES  │
    │   SPECS       |   SPECS     │
    │                             │
    └─────────────────────────────┘

        BUILD • CREATE • INNOVATE

          Available Now At
         elephantronics.lk
${fence}

**3 PRODUCTS**

Use:

${fence}text
                 LOGO
          POWERING YOUR IDEAS

       PRODUCT COMPARISON TITLE
              SUBTITLE

              DISCOUNT

   ┌──────────┬──────────┬──────────┐
   │ PRODUCT 1│ PRODUCT 2│ PRODUCT 3│
   │   IMAGE   │   IMAGE   │   IMAGE  │
   │   NAME    │   NAME    │   NAME   │
   │ FEATURES  │ FEATURES  │ FEATURES │
   │   SPECS   │   SPECS   │   SPECS  │
   └──────────┴──────────┴──────────┘

        BUILD • CREATE • INNOVATE

          Available Now At
         elephantronics.lk
${fence}

Automatically adjust font sizes, spacing, card widths and image sizes so that everything remains readable.

---

### 14. CONTENT RULE

Do not invent product specifications.

Use only the specifications supplied in the variables.

If information is missing, omit that field rather than creating fictional technical specifications.

Keep the product comparison technically accurate.

---

### 15. FINAL DESIGN OBJECTIVE

Create an infographic that communicates:

**"Which product is right for me?"**

while simultaneously promoting:

**Elephantronics + the discount + the website.**

The final image should look like a professionally designed advertisement from a premium electronics hardware company.

### Variable Set

${fence}text
${varSet}
${fence}

**Asset Instructions:**
- **Logo:** Use the provided "Elephantronics" logo icon exactly as given. Do not generate or redraw a new elephant/logo icon.
- **Product images:** If product photos are provided, use them as the product card images. If no product photos are provided, let the model decide the most suitable product imagery.
`;
}

module.exports = { buildComparisonPrompt };
