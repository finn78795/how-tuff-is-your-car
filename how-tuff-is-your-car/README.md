# How Tuff Is Your Car?

A dark, mobile-first car hobby site built with Next.js, TypeScript, React, and Tailwind CSS. It mixes a large open vehicle catalog with explainable just-for-fun ratings, comparisons, local favorites, community-sourced car photos, VIN decoding, and optional AI photo analysis.

## What is included

- Full-catalog autocomplete search
- Browse by year, make, model, and available configuration
- 2,375 bundled classic year/model entries covering 1950–1983
- Tens of thousands of modern configurations loaded from FuelEconomy.gov
- NHTSA vPIC model discovery and a 17-character VIN decoder
- Wikidata discovery for extra global and unusual models
- Wikimedia Commons photo lookup with visible source links and an original fallback illustration
- Animated ratings for vibe, tuffness, speed, style, and fun
- Confidence labels and a “Why this score?” explanation for every result
- Side-by-side comparison mode
- Favorites and recently viewed cars stored locally in the browser
- Real OpenAI vision integration for vehicle recognition, visible accessory detection, and style notes
- Browser-side image resizing to stay below Vercel’s function upload limit
- Responsive loading, error, empty, and not-found states

## Data architecture

The app deliberately does not depend on one commercial car database.

### Bundled classic catalog

`src/data/classic-models.ts` contains model production ranges for enthusiast, everyday, utility, and unusual cars. The app expands each range into individual year/model entries. These pages are model-level estimates because exact trims and engines varied by market.

### FuelEconomy.gov

Before each production build, `scripts/sync-epa-catalog.mjs` downloads the official vehicle CSV, keeps the useful configuration fields, and stores a compressed server-side snapshot in `src/data/epa-catalog.json.gz`. That gives production search fast access to tens of thousands of configurations without downloading the full CSV on a visitor’s first search.

If the build-time refresh is temporarily unavailable, the script keeps the previous snapshot. When no populated snapshot exists, `src/lib/catalog/epa.ts` can still fetch and cache the official CSV at runtime. Bundled classics and curated cars remain available either way.

### NHTSA vPIC

`src/lib/catalog/nhtsa.ts` supplements model browsing and powers the VIN decoder. It is used for identification and factory-description data, not performance claims.

### Wikidata

`src/lib/catalog/wikidata.ts` acts as a fallback discovery layer for global and uncommon models. Wikidata results are labeled as estimated model-level records.

### Photos

`src/lib/catalog/images.ts` searches Wikimedia Commons. Every car card and result page always shows either:

1. A matching community photo with a link to its Commons source, or
2. The original fallback car illustration in `public/images/fallback-car.svg`.

The app does not copy third-party photos into the repository.

## Rating system

Curated seed cars use hand-tuned ratings. Imported vehicles use the deterministic engine in `src/lib/catalog/scoring.ts`, which considers available specifications, body style, drivetrain, age, enthusiast significance, and intended use.

Imported ratings are clearly marked `medium` or `estimated`. The scores are entertainment, not safety ratings, market values, or buying advice.

## AI photo analyzer

The public UI calls one combined endpoint:

```text
POST /api/ai/analyze
```

The server returns structured data for:

- Likely vehicle recognition
- Likely year range and trim
- Visible accessories or modifications
- Style score and short reasoning
- Closest catalog match

The current adapter lives in:

```text
src/lib/ai/openai-provider.ts
```

The provider contract and selector live in:

```text
src/lib/ai/server-provider.ts
```

To swap models or providers, add another adapter implementing `ServerVehicleVisionProvider`, then select it through `AI_PROVIDER`. The catalog matching and UI do not need to change.

## Environment variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

Required only for AI:

```text
OPENAI_API_KEY=your_api_key
```

Optional:

```text
AI_PROVIDER=openai
OPENAI_VISION_MODEL=gpt-4o-mini
AI_FEATURE_ENABLED=true
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

Keep `OPENAI_API_KEY` server-side. Do not prefix it with `NEXT_PUBLIC_`.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Refresh the modern catalog manually:

```bash
npm run sync:catalog
```

Run the complete quality check:

```bash
npm run check
```

## Deploy on Vercel

1. Push the project contents to GitHub. `package.json` must be inside the selected Vercel root directory.
2. Import the repository in Vercel.
3. Select the **Next.js** framework preset.
4. Leave Build Command and Output Directory on their defaults. The normal `npm run build` command refreshes the compressed FuelEconomy.gov snapshot before compiling Next.js.
5. Add `OPENAI_API_KEY` under **Settings → Environment Variables** if you want photo analysis.
6. Redeploy after adding or changing environment variables.

The site and catalog work without an AI key. The photo analyzer will show a setup message until one is added.

## Main folders

```text
src/app                    Pages and API routes
src/components             Search, cards, comparison, AI, VIN, and storage UI
src/data/cars.json          Curated detailed seed cars
src/data/classic-models.ts  Bundled classic model ranges
src/data/epa-catalog.json.gz Build-refreshed modern configuration snapshot
scripts/sync-epa-catalog.mjs FuelEconomy.gov snapshot builder
src/lib/catalog             Catalog adapters, normalization, scoring, and images
src/lib/ai                  Browser transport and swappable server AI providers
src/types                   Shared vehicle and AI types
```

## Important limitations

- Upstream free services can be temporarily unavailable. The compressed EPA snapshot, bundled classics, and curated cars keep the core catalog useful when that happens.
- A model-level entry does not guarantee a particular trim or engine.
- AI can confuse similar generations, trims, badges, wheels, or accessories.
- Wikimedia photo matches can occasionally be imperfect; the source link makes corrections and verification possible.
- OpenAI API usage is billed separately from ChatGPT subscriptions.
