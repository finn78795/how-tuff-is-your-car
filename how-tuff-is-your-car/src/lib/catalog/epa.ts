import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import type { Car, CarSearchResult } from "@/types/car";
import { calculateRatings } from "./scoring";
import { colorPair, inferBodyStyle, normalizeDrive, slugify } from "./utils";

const VEHICLES_CSV_URL = "https://www.fueleconomy.gov/feg/epadata/vehicles.csv";
const VEHICLE_API_URL = "https://www.fueleconomy.gov/ws/rest/vehicle";
const SNAPSHOT_PATH = path.join(process.cwd(), "src/data/epa-catalog.json.gz");

interface EpaRow {
  id: string;
  year: string;
  make: string;
  model: string;
  trany?: string;
  drive?: string;
  cylinders?: string;
  displ?: string;
  fuelType?: string;
  fuelType1?: string;
  VClass?: string;
  comb08?: string;
  city08?: string;
  highway08?: string;
  tCharger?: string;
  sCharger?: string;
  evMotor?: string;
  atvType?: string;
  eng_dscr?: string;
  basemodel?: string;
}

let epaRowsPromise: Promise<EpaRow[]> | undefined;

function parseCsv(text: string): EpaRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const headers = rows.shift() ?? [];
  return rows
    .filter((items) => items.length >= headers.length - 2)
    .map((items) => Object.fromEntries(headers.map((header, index) => [header, items[index] ?? ""])) as unknown as EpaRow)
    .filter((item) => item.id && item.year && item.make && item.model);
}

async function loadBundledEpaRows(): Promise<EpaRow[]> {
  try {
    const compressed = await readFile(SNAPSHOT_PATH);
    const parsed: unknown = JSON.parse(gunzipSync(compressed).toString("utf8"));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is EpaRow => {
      if (typeof item !== "object" || item === null || Array.isArray(item)) return false;
      const row = item as Partial<EpaRow>;
      return Boolean(row.id && row.year && row.make && row.model);
    });
  } catch (error) {
    console.warn("Bundled EPA snapshot could not be read", error);
    return [];
  }
}

export async function getEpaRows(): Promise<EpaRow[]> {
  if (!epaRowsPromise) {
    epaRowsPromise = loadBundledEpaRows().then(async (bundledRows) => {
      if (bundledRows.length) return bundledRows;
      try {
        const response = await fetch(VEHICLES_CSV_URL, {
          headers: { "User-Agent": "HowTuffIsYourCar/2.0" },
          next: { revalidate: 60 * 60 * 24 },
        });
        if (!response.ok) throw new Error(`FuelEconomy.gov returned ${response.status}`);
        return parseCsv(await response.text());
      } catch (error) {
        console.error("EPA catalog unavailable", error);
        return [];
      }
    });
  }
  return epaRowsPromise;
}

function epaSlug(row: EpaRow) {
  return `epa-${row.id}-${slugify(`${row.year}-${row.make}-${row.model}`)}`;
}

function engineDescription(row: EpaRow) {
  const details: string[] = [];
  if (row.displ) details.push(`${row.displ}L`);
  if (row.cylinders) details.push(`${row.cylinders}-cylinder`);
  if (row.tCharger === "T") details.push("turbocharged");
  if (row.sCharger === "S") details.push("supercharged");
  if (row.evMotor) details.push(row.evMotor);
  if (row.eng_dscr) details.push(row.eng_dscr);
  return details.join(" · ") || row.atvType || row.fuelType || "Specification varies";
}

function normalizeEpaRow(row: EpaRow): Car {
  const year = Number(row.year);
  const bodyStyle = inferBodyStyle(row.VClass, row.model);
  const drivetrain = normalizeDrive(row.drive);
  const specs = {
    bodyStyle,
    drivetrain,
    displacementLiters: row.displ ? Number(row.displ) : undefined,
    cylinders: row.cylinders ? Number(row.cylinders) : undefined,
    transmission: row.trany || undefined,
    fuelType: row.fuelType || row.fuelType1 || undefined,
    combinedMpg: row.comb08 ? Number(row.comb08) : undefined,
    engine: engineDescription(row),
  };
  const tags = [row.atvType, row.tCharger === "T" ? "turbo" : "", row.sCharger === "S" ? "supercharged" : "", drivetrain, bodyStyle]
    .filter(Boolean)
    .map(String);
  const scored = calculateRatings({ year, make: row.make, model: row.model, bodyStyle, drivetrain, tags, specs });
  const [accent, accent2] = colorPair(`${row.make}-${row.model}`);
  const trimParts = [row.trany, engineDescription(row)].filter(Boolean);

  return {
    id: `epa-${row.id}`,
    slug: epaSlug(row),
    year,
    make: row.make,
    model: row.basemodel || row.model,
    trim: row.basemodel && row.model !== row.basemodel ? row.model.replace(row.basemodel, "").trim() || trimParts[0] || "EPA configuration" : trimParts[0] || "EPA configuration",
    bodyStyle,
    drivetrain,
    tagline: "A data-backed configuration from the official FuelEconomy.gov vehicle catalog.",
    summary: `This ${year} ${row.make} ${row.model} entry is built from official EPA and Department of Energy configuration data. The fun ratings are transparent estimates, because the source focuses on powertrain and efficiency rather than enthusiast performance testing.`,
    tags,
    ratings: scored.ratings,
    ratingConfidence: scored.confidence,
    ratingReasons: scored.reasons,
    accent,
    accent2,
    specs,
    source: "epa",
    sourceLabel: "FuelEconomy.gov",
    sourceId: row.id,
    sourceUrl: `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=${row.id}`,
    imageQuery: `${year} ${row.make} ${row.model} automobile`,
  };
}

export async function searchEpa(query: string, limit = 20): Promise<CarSearchResult[]> {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const rows = await getEpaRows();

  return rows
    .map((row) => {
      const haystack = `${row.year} ${row.make} ${row.model} ${row.trany ?? ""} ${row.VClass ?? ""}`.toLowerCase();
      if (!tokens.every((token) => haystack.includes(token))) return undefined;
      const starts = haystack.startsWith(normalized) ? 15 : 0;
      const exactModel = row.model.toLowerCase() === normalized ? 20 : 0;
      const score = starts + exactModel + tokens.reduce((sum, token) => sum + (haystack.indexOf(token) < 8 ? 3 : 1), 0);
      return { score, row };
    })
    .filter((item): item is { score: number; row: EpaRow } => Boolean(item))
    .sort((a, b) => b.score - a.score || Number(b.row.year) - Number(a.row.year))
    .slice(0, limit)
    .map(({ row }) => toSearchResult(normalizeEpaRow(row)));
}

export async function getEpaCarBySlug(slug: string): Promise<Car | undefined> {
  const match = slug.match(/^epa-(\d+)-/);
  if (!match) return undefined;
  const id = match[1];

  try {
    const response = await fetch(`${VEHICLE_API_URL}/${id}`, {
      headers: { Accept: "application/json", "User-Agent": "HowTuffIsYourCar/2.0" },
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (response.ok) {
      const payload = await response.json();
      const data = (payload.vehicle ?? payload) as Record<string, unknown>;
      const row = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value == null ? "" : String(value)])) as unknown as EpaRow;
      if (row.id) return normalizeEpaRow(row);
    }
  } catch (error) {
    console.error("EPA vehicle lookup failed", error);
  }

  const rows = await getEpaRows();
  const row = rows.find((item) => item.id === id);
  return row ? normalizeEpaRow(row) : undefined;
}

export async function getEpaYears() {
  const rows = await getEpaRows();
  return [...new Set(rows.map((row) => Number(row.year)).filter(Number.isFinite))].sort((a, b) => b - a);
}

export async function getEpaMakes(year?: number) {
  const rows = await getEpaRows();
  return [...new Set(rows.filter((row) => !year || Number(row.year) === year).map((row) => row.make))].sort();
}

export async function getEpaModels(year: number, make: string) {
  const rows = await getEpaRows();
  return [...new Set(rows.filter((row) => Number(row.year) === year && row.make === make).map((row) => row.basemodel || row.model))].sort();
}

export async function getEpaCarsForSelection(year: number, make: string, model: string) {
  const rows = await getEpaRows();
  return rows
    .filter((row) => Number(row.year) === year && row.make === make && ((row.basemodel || row.model) === model))
    .slice(0, 60)
    .map(normalizeEpaRow);
}

export async function getEpaCount() {
  return (await getEpaRows()).length;
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
