# Elephantronics Prompt Builder

A local web GUI for generating **Elephantronics** marketing prompts. Two tabs — a **Poster** generator and a **Product Comparison** infographic generator. Fill in the placeholders of a fixed master prompt, get the finalized copy-ready prompt as output, auto-polish text with OpenRouter AI, and keep a saved library of all past designs.

## Features

- **Poster tab** — fill placeholders for the poster master prompt (headlines, promo strip, badge, product cards).
- **Comparison tab** — 2- or 3-product comparison infographic (title, subtitle, discount, CTA, and per-product name / image / 4 features / 5 specs / highlight color).
- **AI Suggest** — uses OpenRouter (`openrouter/free` by default, a router that picks a free model) to fill empty fields and lightly polish grammar. Poster mode never invents prices/specs; comparison mode generates specs only from widely-known product facts.
- **Generate Prompt** — renders the full master prompt with variables filled, ready to paste into Gemini (or your image generator).
- **History / memory** — every design is saved to SQLite (`data.db`) with its type, so you can reload, edit, and delete past work across both tabs.
- **Settings** — paste your OpenRouter API key in the UI (stored server-side in `.env`, never exposed to the browser), and pick or type any OpenRouter model slug.

## Requirements

- Node.js 18+ (tested on Node 22)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. (Optional) Create a `.env` file from the example:

   ```bash
   copy .env.example .env
   ```

   Then set your OpenRouter key:

   ```env
   OPENROUTER_API_KEY=sk-or-your-key-here
   LLM_MODEL=openrouter/free
   ```

   You can skip this step and paste the key into the **Settings** panel in the UI instead.

3. Start the server:

   ```bash
   npm start
   ```

4. Open <http://localhost:3000>.

## Usage

1. Pick a tab (**Poster** or **Product Comparison**) and fill in the fields (or click **AI Suggest** to auto-fill empty fields).
2. Click **Generate Prompt** to produce the finalized master prompt.
3. **Copy** it and paste into Gemini (or your image generator).
4. Click **Save** to keep it in your **History**; reload any saved design later (it reopens in the correct tab).

## Configuration

| Env var              | Default                        | Description                       |
| -------------------- | ------------------------------ | --------------------------------- |
| `PORT`               | `3000`                         | Server port                       |
| `OPENROUTER_API_KEY` | (empty)            | OpenRouter API key                |
| `LLM_MODEL`          | `openrouter/free`  | OpenRouter model used for suggestions |

Suggested models (any OpenRouter slug works):

- `openrouter/free` (auto-router for free models — recommended)
- `google/gemma-4-31b-it:free`
- `google/gemma-4-26b-a4b-it:free`
- `z-ai/glm-5.2:free`
- `openai/gpt-oss-20b:free`
- `nvidia/nemotron-3-super-120b-a12b:free`
- `cohere/north-mini-code:free`

The full list of current free models is at <https://openrouter.ai/openrouter/free>.

## API

- `POST /api/render` — body: `{ mode: "poster" | "comparison", ...state }` → `{ prompt }`
- `POST /api/suggest` — body: `{ mode, ...state }` → `{ suggestions }`
- `GET /api/designs` / `POST /api/designs`
- `GET/PUT/DELETE /api/designs/:id`
- `GET/POST /api/settings` — manage the OpenRouter key/model

## Project structure

```
server.js                  Express app + API routes
lib/template.js            Poster master prompt + placeholder renderer
lib/comparison-template.js Comparison infographic master prompt + renderer
lib/llm.js                 OpenRouter client + suggestion logic (both modes)
lib/db.js                  SQLite persistence (designs CRUD)
public/                    Frontend (index.html, styles.css, app.js)
```
