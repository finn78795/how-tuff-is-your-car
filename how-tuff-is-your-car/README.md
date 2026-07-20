# How Tuff Is Your Car?

A dark, mobile-first Next.js app for vibe-based car ratings.

## Included

- Next.js App Router, TypeScript, Tailwind CSS v4
- Large search with autocomplete
- Browse by year, make, and model
- Local JSON car database (`src/data/cars.json`)
- Dynamic result pages with animated gauges
- Side-by-side comparison mode
- Favorites and search history in local storage
- Image-upload UI plus swappable AI provider interface
- Placeholder route handlers for vehicle recognition, accessory detection, and style rating

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Connect a real AI model

The browser calls the `VehicleAiProvider` interface in `src/lib/ai/provider.ts`. Replace the placeholder route implementations under:

- `src/app/api/ai/recognize/route.ts`
- `src/app/api/ai/accessories/route.ts`
- `src/app/api/ai/style/route.ts`

Keep the return shapes defined in `src/lib/ai/types.ts`, or replace `ApiVehicleAiProvider` with another implementation.

## Data note

The included cars, specs, copy, and ratings are seed/demo data meant to make the experience immediately testable. Expand or replace `src/data/cars.json` before treating it as a comprehensive vehicle database.
