# How Tuff Is Your Car? — V3

A dark, mobile-first Next.js car rating site for searching cars, comparing them, saving favorites, and rating a personal build from a photo.

The site tries to feel like somebody's late-night car rabbit hole rather than a car-shopping company. Scores are opinions, but the formulas, data sources, photo labels, and modification impacts are kept consistent and visible.

## What is included

- Next.js 16 App Router, TypeScript, React, and Tailwind CSS
- Search with autocomplete across curated, classic, and modern vehicle records
- Browse by year, make, and model
- Animated ratings for vibe, tuffness, speed, style, and fun
- Comparison mode
- Favorites, recent cars, and photo-rated builds stored in the browser
- Classic model coverage beginning in 1950
- FuelEconomy.gov catalog importer for 1984-current configurations
- NHTSA VIN decoder and modern model validation
- Wikidata discovery for uncommon/global vehicles
- Staged Wikimedia/Wikipedia/Wikidata photo resolver
- Honest photo labels: exact search, same year/model, same generation, model-family, or illustration
- Free photo ratings through Cloudflare Workers AI
- Visible accessory detection and individual 0–10 accessory ratings
- Fixed, deterministic accessory score impact capped at ±1.2 overall points
- User correction controls before a build is saved

## Run locally

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm run lint
npm run build
npm run check
```

## Vehicle data

The catalog combines several layers rather than depending on one company:

1. **Curated enthusiast cars** in `src/data/cars.json`
2. **Classic model ranges** in `src/data/classic-models.ts`
3. **FuelEconomy.gov configurations** compressed into `src/data/epa-catalog.json.gz`
4. **NHTSA vPIC** for VIN decoding and modern model validation
5. **Wikidata** as an uncommon/global discovery fallback

During `npm run build`, `scripts/sync-epa-catalog.mjs` attempts to refresh the official FuelEconomy.gov snapshot. When the upstream service is unavailable, the build continues with the bundled catalog and runtime fallbacks.

## Vehicle photos

Every car card has a supporting visual. The resolver in `src/lib/catalog/images.ts` works through these stages:

1. Exact year, make, model, and useful trim text
2. Year, make, and model
3. Generation-level search
4. Model-family search
5. Wikipedia article image, with its Wikimedia file attribution
6. Wikidata `P18` image
7. Original car illustration when no trustworthy public image is found

The UI says what kind of match is being shown. It does not claim that a nearby year or model-family image is the exact trim. Each real image keeps its source, creator, and license details when Wikimedia provides them.

A small **Suggest a better photo** button opens a prefilled GitHub issue.

## Free photo ratings with Cloudflare Workers AI

The default provider is Cloudflare Workers AI using:

```text
@cf/meta/llama-3.2-11b-vision-instruct
```

The model is open-weight and supports image reasoning. Cloudflare exposes it through a public REST API. Workers AI currently includes a free allocation of 10,000 neurons per day. On a Workers Free account, requests fail after the free daily allowance is used instead of automatically charging overages.

### 1. Create Cloudflare credentials

In the Cloudflare dashboard:

1. Open **Workers AI**.
2. Choose **Use REST API**.
3. Create a Workers AI API token.
4. Copy the **Account ID** and **API token**.
5. The token needs Workers AI Read and Edit permissions.

### 2. Accept the Llama Vision license once

Cloudflare requires a one-time license acceptance for this model. Run:

```bash
curl "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/run/@cf/meta/llama-3.2-11b-vision-instruct" \
  -X POST \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"agree"}'
```

### 3. Add Vercel environment variables

In **Vercel → Project → Settings → Environment Variables**, add:

```text
AI_PROVIDER=cloudflare
AI_FEATURE_ENABLED=true
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_VISION_MODEL=@cf/meta/llama-3.2-11b-vision-instruct
```

Redeploy after adding them.

Never prefix the account ID or token with `NEXT_PUBLIC_`. The site sends photos to its own server route, and only the server calls Cloudflare.

## How build ratings work

The vision model does two jobs:

- suggests the vehicle and rough year/trim
- describes visible accessories and scores their visible quality, fit, installation, and condition

The model does **not** directly decide how many overall points a modification adds. `src/lib/build-scoring.ts` applies fixed category weights to each detected item.

Examples:

- good wheels mostly affect style and vibe
- off-road equipment mostly affects tuffness and fun
- suspension can affect style, speed, and fun
- utility equipment can help tuffness while slightly hurting speed
- poor fit, damage, or messy execution can reduce the score
- factory equipment contributes zero modification points

All accessory effects together are capped at ±1.2 points. The base vehicle therefore remains more important than the modifications.

Before saving a build, visitors can:

- edit the detected make, model, year range, and trim
- choose a different catalog match
- remove an incorrect accessory
- add a missing accessory
- mark a part as factory, aftermarket, or uncertain
- exclude a part from the score
- give the build a nickname

Saved builds and small image previews remain in local storage. They are not uploaded to a public feed.

## AI provider architecture

The public UI calls `VehicleAiProvider` in:

```text
src/lib/ai/provider.ts
```

Server-side provider selection lives in:

```text
src/lib/ai/server-provider.ts
```

Cloudflare's adapter is:

```text
src/lib/ai/cloudflare-provider.ts
```

A different image model can be added later without rewriting the upload interface or build-scoring logic.

## Deploy to Vercel

The existing repository uses an inner project folder. Keep `package.json` in the same Vercel Root Directory that already works.

Recommended settings:

- Framework Preset: **Next.js**
- Install Command: default
- Build Command: default (`npm run build`)
- Output Directory: no override

Vercel automatically redeploys after a commit to the connected branch.

## Important limitations

- Public vehicle datasets differ by country, market, year, and trim.
- The classic catalog is model-level unless a car has curated trim data.
- Photo matching can fall back to the same generation or model family; the label discloses this.
- Vision models can confuse similar generations, factory options, replica parts, and subtle modifications.
- The ratings are entertainment, not safety scores, valuations, or buying advice.
- The free Workers AI allowance is finite and resets daily.
