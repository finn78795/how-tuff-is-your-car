import type { Car, CarSearchResult } from "@/types/car";
import { classicEntryCount, getClassicCarBySlug, getClassicCarsForSelection, getClassicMakes, getClassicModels, getClassicSpotlights, getRandomClassicCar, getClassicYears, searchClassics } from "./classics";
import { curatedCars, getCuratedCar } from "./curated";
import { getEpaCarBySlug, getEpaCarsForSelection, getEpaCount, getEpaMakes, getEpaModels, getEpaYears, searchEpa } from "./epa";
import { getWikidataCar, searchWikidata } from "./wikidata";
import { createNhtsaModelCar, getNhtsaCarBySlug, getNhtsaModels } from "./nhtsa";
import { getOverallScoreFromRatings } from "./utils";

export { ratingKeys, ratingLabels, getOverallScoreFromRatings } from "./utils";
export { getVerdict, getVerdictCopy } from "./scoring";
export { classicEntryCount, getClassicSitemapEntries } from "./classics";
export { curatedCars } from "./curated";

export function getCarLabel(car: Pick<Car, "year" | "make" | "model" | "trim">) {
  const trim = car.trim && car.trim !== "Model range" ? ` ${car.trim}` : "";
  return `${car.year} ${car.make} ${car.model}${trim}`;
}

export function getOverallScore(car: Pick<Car, "ratings">) {
  return getOverallScoreFromRatings(car.ratings);
}

function curatedSearch(query: string): CarSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const tokens = normalized.split(/\s+/).filter(Boolean);
  return curatedCars
    .map((car) => {
      const haystack = `${car.year} ${car.make} ${car.model} ${car.trim} ${car.tags.join(" ")}`.toLowerCase();
      if (!tokens.every((token) => haystack.includes(token))) return undefined;
      const score = (haystack.startsWith(normalized) ? 20 : 0) + tokens.reduce((sum, token) => sum + (haystack.indexOf(token) < 12 ? 4 : 1), 0);
      return { score, car };
    })
    .filter((item): item is { score: number; car: Car } => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .map(({ car }) => ({
      id: car.id,
      slug: car.slug,
      year: car.year,
      make: car.make,
      model: car.model,
      trim: car.trim,
      bodyStyle: car.bodyStyle,
      source: car.source,
      sourceLabel: car.sourceLabel,
      ratings: car.ratings,
      ratingConfidence: car.ratingConfidence,
      imageQuery: car.imageQuery,
    }));
}

export async function searchCatalog(query: string, limit = 20) {
  const normalized = query.trim();
  if (!normalized) return [];
  const local = [...curatedSearch(normalized), ...searchClassics(normalized, limit)];
  const seen = new Set(local.map((item) => item.slug));
  const remaining = Math.max(limit - local.length, 0);
  const epa = remaining > 0 ? await searchEpa(normalized, Math.max(remaining, 10)) : [];
  const combined = [...local, ...epa.filter((item) => !seen.has(item.slug))];
  for (const item of epa) seen.add(item.slug);

  if (combined.length < Math.min(6, limit)) {
    const wikidata = await searchWikidata(normalized, Math.min(6, limit - combined.length));
    combined.push(...wikidata.filter((item) => !seen.has(item.slug)));
  }

  return combined.slice(0, limit);
}

export async function getCarBySlug(slug: string): Promise<Car | undefined> {
  return getCuratedCar(slug)
    ?? getClassicCarBySlug(slug)
    ?? (slug.startsWith("epa-") ? await getEpaCarBySlug(slug) : undefined)
    ?? (slug.startsWith("wikidata-") ? await getWikidataCar(slug) : undefined)
    ?? getNhtsaCarBySlug(slug);
}

export async function getCatalogYears() {
  const [epaYears, classicYears] = await Promise.all([getEpaYears(), Promise.resolve(getClassicYears())]);
  const curatedYears = curatedCars.map((car) => car.year);
  return [...new Set([...epaYears, ...classicYears, ...curatedYears])].sort((a, b) => b - a);
}

export async function getCatalogMakes(year?: number) {
  const [epaMakes, classicMakes] = await Promise.all([getEpaMakes(year), Promise.resolve(getClassicMakes(year))]);
  const curatedMakes = curatedCars.filter((car) => !year || car.year === year).map((car) => car.make);
  return [...new Set([...epaMakes, ...classicMakes, ...curatedMakes])].sort((a, b) => a.localeCompare(b));
}

export async function getCatalogModels(year: number, make: string) {
  const [epaModels, classicModels, nhtsaModels] = await Promise.all([
    getEpaModels(year, make),
    Promise.resolve(getClassicModels(year, make)),
    getNhtsaModels(year, make),
  ]);
  const curatedModels = curatedCars.filter((car) => car.year === year && car.make === make).map((car) => car.model);
  return [...new Set([...epaModels, ...classicModels, ...nhtsaModels, ...curatedModels])].sort((a, b) => a.localeCompare(b));
}

export async function getCarsForSelection(year: number, make: string, model: string) {
  const [epaCars, classicCars] = await Promise.all([
    getEpaCarsForSelection(year, make, model),
    Promise.resolve(getClassicCarsForSelection(year, make, model)),
  ]);
  const curated = curatedCars.filter((car) => car.year === year && car.make === make && (car.model === model || car.model.startsWith(model)));
  const nhtsa = year >= 1996 ? [createNhtsaModelCar(year, make, model)] : [];
  const seen = new Set<string>();
  return [...curated, ...classicCars, ...epaCars, ...nhtsa].filter((car) => {
    const key = `${car.year}|${car.make}|${car.model}|${car.trim}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getRelatedCars(car: Car, limit = 4) {
  // Keep related-car rendering fast and dependable during static builds. The live
  // search still reaches FuelEconomy.gov and Wikidata, but this section uses the
  // bundled catalog so a temporary upstream outage cannot delay a result page.
  const slugs = new Set([car.slug]);
  const results: Car[] = [];
  const localCandidates: Car[] = [
    ...curatedCars.filter((item) => item.make === car.make),
    ...searchClassics(car.make, 18).map((item) => getClassicCarBySlug(item.slug)).filter((item): item is Car => Boolean(item)),
    ...curatedCars.filter((item) => item.bodyStyle === car.bodyStyle),
    ...getClassicSpotlights(12),
  ];

  for (const candidate of localCandidates) {
    if (slugs.has(candidate.slug)) continue;
    slugs.add(candidate.slug);
    results.push(candidate);
    if (results.length >= limit) break;
  }
  return results;
}

export function getFeaturedCars(limit = 4) {
  return [...curatedCars].sort((a, b) => getOverallScore(b) - getOverallScore(a)).slice(0, limit);
}

export function getClassicFeaturedCars(limit = 8) {
  return getClassicSpotlights(limit);
}


export function getRandomCar() {
  if (Math.random() < 0.7) return getRandomClassicCar() ?? curatedCars[0];
  return curatedCars[Math.floor(Math.random() * curatedCars.length)] ?? curatedCars[0];
}

export async function getCatalogStats() {
  const epaCount = await getEpaCount();
  return {
    curated: curatedCars.length,
    classicYearModels: classicEntryCount,
    epaConfigurations: epaCount,
    totalSearchable: curatedCars.length + classicEntryCount + epaCount,
  };
}
