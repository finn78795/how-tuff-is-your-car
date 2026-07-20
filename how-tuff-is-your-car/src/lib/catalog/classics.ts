import { classicModelRanges } from "@/data/classic-models";
import type { Car, CarSearchResult, ClassicModelRange } from "@/types/car";
import { calculateRatings } from "./scoring";
import { colorPair, slugify } from "./utils";

function classicSlug(year: number, make: string, model: string) {
  return `classic-${year}-${slugify(make)}-${slugify(model)}`;
}

function rangeToCar(range: ClassicModelRange, year: number): Car {
  const tags = range.tags ?? ["classic"];
  const scored = calculateRatings({
    year,
    make: range.make,
    model: range.model,
    bodyStyle: range.bodyStyle,
    drivetrain: range.drivetrain,
    tags,
  });
  const [accent, accent2] = colorPair(`${range.make}-${range.model}`);
  const isOffRoad = /SUV|Truck|Ute/.test(range.bodyStyle);
  const tagline = isOffRoad
    ? "Old-school utility with the kind of character newer trucks try to recreate."
    : "A period-correct classic with design and personality that still stand out.";
  const summary = `${range.make} built the ${range.model} during an era when cars were easier to recognize from a block away. This catalog entry represents the ${year} model year at model level; exact engines and trims varied by market.`;

  return {
    id: classicSlug(year, range.make, range.model),
    slug: classicSlug(year, range.make, range.model),
    year,
    make: range.make,
    model: range.model,
    trim: "Model range",
    bodyStyle: range.bodyStyle,
    drivetrain: range.drivetrain ?? "Varies",
    tagline,
    summary,
    tags,
    ratings: scored.ratings,
    ratingConfidence: scored.confidence,
    ratingReasons: scored.reasons,
    accent,
    accent2,
    specs: {
      bodyStyle: range.bodyStyle,
      drivetrain: range.drivetrain ?? "Varies",
    },
    source: "classic-catalog",
    sourceLabel: "HTIYC classic model catalog",
    imageQuery: `${year} ${range.make} ${range.model} automobile`,
    productionStart: range.startYear,
    productionEnd: range.endYear,
    generation: range.generation,
  };
}

export const classicEntryCount = classicModelRanges.reduce((total, range) => total + (range.endYear - range.startYear + 1), 0);

export function searchClassics(query: string, limit = 20): CarSearchResult[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const yearsInQuery = tokens.map(Number).filter((value) => Number.isInteger(value) && value >= 1900 && value <= 2100);

  const matches: Array<{ score: number; car: CarSearchResult }> = [];
  for (const range of classicModelRanges) {
    const haystack = `${range.make} ${range.model} ${(range.tags ?? []).join(" ")}`.toLowerCase();
    const textHits = tokens.filter((token) => !/^\d{4}$/.test(token) && haystack.includes(token)).length;
    if (textHits === 0) continue;

    const years = yearsInQuery.length
      ? yearsInQuery.filter((year) => year >= range.startYear && year <= range.endYear)
      : [range.endYear, Math.round((range.startYear + range.endYear) / 2), range.startYear];

    for (const year of [...new Set(years)]) {
      if (year < range.startYear || year > range.endYear) continue;
      const car = rangeToCar(range, year);
      matches.push({
        score: textHits * 10 + (haystack.startsWith(normalized.replace(/^\d{4}\s*/, "")) ? 5 : 0) + (yearsInQuery.includes(year) ? 10 : 0),
        car: toSearchResult(car),
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score || b.car.year - a.car.year).slice(0, limit).map((item) => item.car);
}

export function getClassicCarBySlug(slug: string): Car | undefined {
  if (!slug.startsWith("classic-")) return undefined;
  const match = slug.match(/^classic-(\d{4})-(.+)$/);
  if (!match) return undefined;
  const year = Number(match[1]);
  return classicModelRanges
    .filter((range) => year >= range.startYear && year <= range.endYear)
    .map((range) => rangeToCar(range, year))
    .find((car) => car.slug === slug);
}

export function getClassicYears() {
  const years = new Set<number>();
  for (const range of classicModelRanges) {
    for (let year = range.startYear; year <= range.endYear; year += 1) years.add(year);
  }
  return [...years].sort((a, b) => b - a);
}

export function getClassicMakes(year?: number) {
  return [...new Set(classicModelRanges.filter((range) => !year || (year >= range.startYear && year <= range.endYear)).map((range) => range.make))].sort();
}

export function getClassicModels(year: number, make: string) {
  return [...new Set(classicModelRanges.filter((range) => range.make === make && year >= range.startYear && year <= range.endYear).map((range) => range.model))].sort();
}

export function getClassicCarsForSelection(year: number, make: string, model: string) {
  return classicModelRanges
    .filter((range) => range.make === make && range.model === model && year >= range.startYear && year <= range.endYear)
    .map((range) => rangeToCar(range, year));
}


export function getRandomClassicCar() {
  const range = classicModelRanges[Math.floor(Math.random() * classicModelRanges.length)];
  if (!range) return undefined;
  const year = range.startYear + Math.floor(Math.random() * (range.endYear - range.startYear + 1));
  return rangeToCar(range, year);
}

export function getClassicSpotlights(limit = 8) {
  const preferred = [
    [1970, "Plymouth", "Superbird"],
    [1969, "Dodge", "Charger"],
    [1967, "Shelby", "GT500"],
    [1974, "Lamborghini", "Countach"],
    [1961, "Jaguar", "E-Type"],
    [1969, "Datsun", "240Z"],
    [1978, "Mazda", "RX-7"],
    [1970, "Land Rover", "Range Rover"],
  ] as const;
  return preferred.slice(0, limit).map(([year, make, model]) => {
    const range = classicModelRanges.find((item) => item.make === make && item.model === model && year >= item.startYear && year <= item.endYear);
    return range ? rangeToCar(range, year) : undefined;
  }).filter((car): car is Car => Boolean(car));
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

export function getClassicSitemapEntries() {
  return classicModelRanges.flatMap((range) => {
    const entries: Array<{ slug: string; year: number }> = [];
    for (let year = range.startYear; year <= range.endYear; year += 1) {
      entries.push({ slug: classicSlug(year, range.make, range.model), year });
    }
    return entries;
  });
}
