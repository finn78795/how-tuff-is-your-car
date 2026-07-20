import type { Car, CarSearchResult } from "@/types/car";
import { calculateRatings } from "./scoring";
import { colorPair, slugify } from "./utils";

const API = "https://www.wikidata.org/w/api.php";

interface WikidataSearchHit {
  id: string;
  label: string;
  description?: string;
}

type Claim = {
  mainsnak?: {
    datavalue?: { value?: unknown };
  };
};

type Entity = {
  id: string;
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  claims?: Record<string, Claim[]>;
};

function claimEntityId(entity: Entity, property: string) {
  const value = entity.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
  return typeof value === "object" && value && "id" in value ? String((value as { id: string }).id) : undefined;
}

function claimString(entity: Entity, property: string) {
  const value = entity.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
  return typeof value === "string" ? value : undefined;
}

function claimYear(entity: Entity, property: string) {
  const value = entity.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;
  if (typeof value !== "object" || !value || !("time" in value)) return undefined;
  const match = String((value as { time: string }).time).match(/[+-](\d{4})-/);
  return match ? Number(match[1]) : undefined;
}

function looksLikeCar(description = "") {
  return /(automobile|car model|motor vehicle|sports car|roadster|sedan|coupe|hatchback|suv|pickup|vehicle)/i.test(description);
}

async function getEntities(ids: string[]) {
  if (!ids.length) return {} as Record<string, Entity>;
  const url = new URL(API);
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("format", "json");
  url.searchParams.set("ids", ids.join("|"));
  url.searchParams.set("languages", "en");
  url.searchParams.set("props", "labels|descriptions|claims");
  const response = await fetch(url, { headers: { "User-Agent": "HowTuffIsYourCar/2.0" }, next: { revalidate: 60 * 60 * 24 * 7 } });
  if (!response.ok) return {} as Record<string, Entity>;
  const payload = await response.json();
  return (payload.entities ?? {}) as Record<string, Entity>;
}

export async function searchWikidata(query: string, limit = 6): Promise<CarSearchResult[]> {
  const value = query.trim();
  if (value.length < 3) return [];
  try {
    const url = new URL(API);
    url.searchParams.set("action", "wbsearchentities");
    url.searchParams.set("format", "json");
    url.searchParams.set("language", "en");
    url.searchParams.set("type", "item");
    url.searchParams.set("limit", String(Math.min(limit * 3, 20)));
    url.searchParams.set("search", `${value} car`);
    const response = await fetch(url, { headers: { "User-Agent": "HowTuffIsYourCar/2.0" }, next: { revalidate: 60 * 60 * 24 } });
    if (!response.ok) return [];
    const payload = await response.json();
    const hits = (payload.search ?? []) as WikidataSearchHit[];
    const filtered = hits.filter((hit) => looksLikeCar(hit.description)).slice(0, limit);
    const cars = await Promise.all(filtered.map((hit) => getWikidataCar(hit.id)));
    return cars.filter((car): car is Car => Boolean(car)).map(toSearchResult);
  } catch (error) {
    console.error("Wikidata search unavailable", error);
    return [];
  }
}

export async function getWikidataCar(qidOrSlug: string): Promise<Car | undefined> {
  const qid = qidOrSlug.startsWith("wikidata-") ? qidOrSlug.slice("wikidata-".length).split("-")[0] : qidOrSlug;
  if (!/^Q\d+$/.test(qid)) return undefined;
  try {
    const entities = await getEntities([qid]);
    const entity = entities[qid];
    if (!entity) return undefined;
    const description = entity.descriptions?.en?.value ?? "";
    if (!looksLikeCar(description)) return undefined;

    const manufacturerId = claimEntityId(entity, "P176");
    const manufacturerEntities = manufacturerId ? await getEntities([manufacturerId]) : {};
    const make = manufacturerId ? manufacturerEntities[manufacturerId]?.labels?.en?.value ?? "Unknown make" : "Unknown make";
    const model = entity.labels?.en?.value ?? qid;
    const startYear = claimYear(entity, "P571") ?? claimYear(entity, "P577") ?? claimYear(entity, "P580");
    const endYear = claimYear(entity, "P576") ?? claimYear(entity, "P582");
    const year = startYear ?? new Date().getFullYear();
    const imageFile = claimString(entity, "P18");
    const bodyStyle = /suv|off-road/i.test(description) ? "SUV" : /pickup|truck/i.test(description) ? "Truck" : /roadster|sports car/i.test(description) ? "Sports car" : /coupe/i.test(description) ? "Coupe" : /hatchback/i.test(description) ? "Hatchback" : /sedan/i.test(description) ? "Sedan" : "Car";
    const scored = calculateRatings({ year, make, model, bodyStyle, tags: [description] });
    const [accent, accent2] = colorPair(`${make}-${model}`);
    const slug = `wikidata-${qid}-${slugify(model)}`;

    return {
      id: `wikidata-${qid}`,
      slug,
      year,
      make,
      model,
      trim: startYear && endYear ? `${startYear}–${endYear} model range` : "Model range",
      bodyStyle,
      drivetrain: "Varies",
      tagline: "An additional global model discovered through Wikidata's open vehicle knowledge graph.",
      summary: `${model} is listed in Wikidata as ${description || "an automobile model"}. This is a model-level entry, so specifications and trims may vary by year and market.`,
      tags: ["global catalog", "Wikidata"],
      ratings: scored.ratings,
      ratingConfidence: "estimated",
      ratingReasons: scored.reasons,
      accent,
      accent2,
      specs: { bodyStyle, drivetrain: "Varies" },
      source: "wikidata",
      sourceLabel: "Wikidata (CC0 data)",
      sourceId: qid,
      sourceUrl: `https://www.wikidata.org/wiki/${qid}`,
      imageQuery: `${make} ${model} automobile`,
      image: imageFile
        ? {
            url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageFile)}?width=1600`,
            sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(imageFile.replace(/ /g, "_"))}`,
          }
        : undefined,
      productionStart: startYear,
      productionEnd: endYear,
    };
  } catch (error) {
    console.error("Wikidata entity lookup unavailable", error);
    return undefined;
  }
}

function toSearchResult(car: Car): CarSearchResult {
  return {
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
  };
}
