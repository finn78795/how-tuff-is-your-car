import type { CarImageCredit, CarImageMatchLevel } from "@/types/car";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";

export interface VehicleImageLookup {
  year?: number;
  make: string;
  model: string;
  trim?: string;
  generation?: string;
  imageQuery?: string;
}

type SearchStage = { query: string; level: CarImageMatchLevel; label: string; requiredTokens: string[] };

export async function findVehicleImage(input: VehicleImageLookup | string): Promise<CarImageCredit> {
  const lookup = typeof input === "string" ? parseLooseQuery(input) : normalizeLookup(input);
  const stages = buildStages(lookup);

  for (const stage of stages) {
    const commons = await searchCommons(stage);
    if (commons) return commons;
  }

  const articleImage = await searchWikipediaArticleImage(lookup);
  if (articleImage) return articleImage;

  const wikidataImage = await searchWikidataImage(lookup);
  if (wikidataImage) return wikidataImage;

  return fallbackImage();
}

function buildStages(lookup: VehicleImageLookup): SearchStage[] {
  const make = cleanPart(lookup.make);
  const model = cleanPart(lookup.model);
  const trim = cleanTrim(lookup.trim);
  const year = lookup.year ? String(lookup.year) : "";
  const generation = cleanPart(lookup.generation);
  const required = tokenize(`${make} ${model}`);
  const stages: SearchStage[] = [];

  if (lookup.imageQuery) {
    stages.push({ query: lookup.imageQuery, level: "exact", label: "Exact model search", requiredTokens: required });
  }
  if (year && trim) {
    stages.push({ query: `${year} ${make} ${model} ${trim}`, level: "exact", label: "Exact year and trim photo", requiredTokens: required });
  }
  if (year) {
    stages.push({ query: `${year} ${make} ${model}`, level: "year-model", label: "Same year and model photo", requiredTokens: required });
  }
  if (generation) {
    stages.push({ query: `${make} ${model} ${generation}`, level: "generation", label: "Same generation photo", requiredTokens: required });
  }
  stages.push({ query: `${make} ${model}`, level: "model-family", label: "Model-family photo", requiredTokens: required });

  return dedupeStages(stages);
}

async function searchCommons(stage: SearchStage): Promise<CarImageCredit | undefined> {
  try {
    const url = new URL(COMMONS_API);
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", `${stage.query} automobile`);
    url.searchParams.set("gsrnamespace", "6");
    url.searchParams.set("gsrlimit", "24");
    url.searchParams.set("prop", "imageinfo");
    url.searchParams.set("iiprop", "url|mime|size|extmetadata");
    url.searchParams.set("iiurlwidth", "1600");

    const response = await fetch(url, {
      headers: { "User-Agent": "HowTuffIsYourCar/3.0 (vehicle image lookup; github.com/finn78795/how-tuff-is-your-car)" },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!response.ok) return undefined;
    const pages = extractPages(await response.json());
    const ranked = pages
      .map((page) => ({ page, score: scoreCommonsPage(page, stage) }))
      .filter(({ score }) => score > -20)
      .sort((a, b) => b.score - a.score);

    for (const { page, score } of ranked) {
      if (score < minimumScore(stage)) continue;
      const credit = pageToCredit(page, stage);
      if (credit) return credit;
    }
  } catch (error) {
    console.error("Wikimedia Commons image stage failed", stage.query, error);
  }
  return undefined;
}

async function searchWikipediaArticleImage(lookup: VehicleImageLookup): Promise<CarImageCredit | undefined> {
  try {
    const query = `${lookup.make} ${lookup.model} automobile`;
    const url = new URL(WIKIPEDIA_API);
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", query);
    url.searchParams.set("gsrlimit", "8");
    url.searchParams.set("prop", "pageimages|info");
    url.searchParams.set("piprop", "name");
    url.searchParams.set("inprop", "url");

    const response = await fetch(url, {
      headers: { "User-Agent": "HowTuffIsYourCar/3.0 (vehicle image lookup)" },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!response.ok) return undefined;
    const payload = await response.json() as unknown;
    const pages = extractWikipediaPages(payload);
    const tokens = tokenize(`${lookup.make} ${lookup.model}`);
    const page = pages
      .filter((candidate) => candidate.pageimage)
      .map((candidate) => ({ candidate, score: tokens.filter((token) => candidate.title.toLowerCase().includes(token)).length }))
      .sort((a, b) => b.score - a.score)[0]?.candidate;
    if (!page?.pageimage) return undefined;

    const credit = await getCommonsFileCredit(page.pageimage, "model-family", "Wikipedia model-family photo", query);
    if (credit) return credit;
  } catch (error) {
    console.error("Wikipedia article image lookup failed", error);
  }
  return undefined;
}

async function searchWikidataImage(lookup: VehicleImageLookup): Promise<CarImageCredit | undefined> {
  try {
    const searchUrl = new URL(WIKIDATA_API);
    searchUrl.searchParams.set("action", "wbsearchentities");
    searchUrl.searchParams.set("format", "json");
    searchUrl.searchParams.set("origin", "*");
    searchUrl.searchParams.set("language", "en");
    searchUrl.searchParams.set("type", "item");
    searchUrl.searchParams.set("limit", "8");
    searchUrl.searchParams.set("search", `${lookup.make} ${lookup.model}`);
    const searchResponse = await fetch(searchUrl, {
      headers: { "User-Agent": "HowTuffIsYourCar/3.0 (vehicle image lookup)" },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!searchResponse.ok) return undefined;
    const searchPayload = await searchResponse.json() as { search?: Array<{ id?: string; label?: string; description?: string }> };
    const candidates = (searchPayload.search ?? []).filter((item) => item.id);
    if (!candidates.length) return undefined;

    const entityUrl = new URL(WIKIDATA_API);
    entityUrl.searchParams.set("action", "wbgetentities");
    entityUrl.searchParams.set("format", "json");
    entityUrl.searchParams.set("origin", "*");
    entityUrl.searchParams.set("props", "claims");
    entityUrl.searchParams.set("ids", candidates.map((item) => item.id).join("|"));
    const entityResponse = await fetch(entityUrl, {
      headers: { "User-Agent": "HowTuffIsYourCar/3.0 (vehicle image lookup)" },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!entityResponse.ok) return undefined;
    const entityPayload = await entityResponse.json() as { entities?: Record<string, { claims?: Record<string, Array<{ mainsnak?: { datavalue?: { value?: unknown } } }>> }> };

    for (const candidate of candidates) {
      const value = entityPayload.entities?.[candidate.id!]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      if (typeof value !== "string") continue;
      const credit = await getCommonsFileCredit(value, "model-family", "Wikidata model-family photo", `${lookup.make} ${lookup.model}`);
      if (credit) return credit;
    }
  } catch (error) {
    console.error("Wikidata image lookup failed", error);
  }
  return undefined;
}

async function getCommonsFileCredit(filename: string, level: CarImageMatchLevel, label: string, queryUsed: string) {
  const title = filename.startsWith("File:") ? filename : `File:${filename}`;
  const url = new URL(COMMONS_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("titles", title);
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|mime|extmetadata");
  url.searchParams.set("iiurlwidth", "1600");
  const response = await fetch(url, {
    headers: { "User-Agent": "HowTuffIsYourCar/3.0 (vehicle image lookup)" },
    next: { revalidate: 60 * 60 * 24 * 30 },
  });
  if (!response.ok) return undefined;
  const page = extractPages(await response.json())[0];
  if (!page) return undefined;
  return pageToCredit(page, { query: queryUsed, level, label, requiredTokens: [] });
}

function pageToCredit(page: CommonsPage, stage: SearchStage): CarImageCredit | undefined {
  const info = page.imageinfo?.[0];
  if (!info?.thumburl && !info?.url) return undefined;
  if (info.mime && !["image/jpeg", "image/png", "image/webp"].includes(info.mime)) return undefined;
  if (info.width && info.height && info.width < 500 && info.height < 350) return undefined;
  const metadata = info.extmetadata ?? {};
  return {
    url: info.thumburl ?? info.url!,
    sourceUrl: info.descriptionurl,
    author: stripHtml(metadata.Artist?.value || metadata.Credit?.value),
    license: stripHtml(metadata.LicenseShortName?.value || metadata.UsageTerms?.value),
    matchLevel: stage.level,
    matchLabel: stage.label,
    queryUsed: stage.query,
  };
}

function scoreCommonsPage(page: CommonsPage, stage: SearchStage) {
  const title = normalize(page.title ?? "");
  const queryTokens = tokenize(stage.query);
  let score = 0;
  for (const token of queryTokens) {
    if (title.includes(token)) score += /^\d{4}$/.test(token) ? 3 : 2;
  }
  for (const token of stage.requiredTokens) {
    if (title.includes(token)) score += 4;
    else score -= 5;
  }
  if (/\b(front|rear|side|coupe|sedan|wagon|convertible|truck|suv|roadster)\b/.test(title)) score += 1;
  if (/\b(logo|badge|emblem|engine|interior|dashboard|diagram|drawing|sketch|poster|toy|hot wheels|matchbox|wreck|crash|police|race crash)\b/.test(title)) score -= 18;
  const info = page.imageinfo?.[0];
  if (info?.width && info?.height && info.width >= 1000 && info.height >= 600) score += 2;
  return score;
}

function minimumScore(stage: SearchStage) {
  if (stage.level === "exact") return Math.max(5, stage.requiredTokens.length * 3);
  if (stage.level === "year-model") return Math.max(4, stage.requiredTokens.length * 3);
  return Math.max(2, stage.requiredTokens.length * 2);
}

function normalizeLookup(input: VehicleImageLookup): VehicleImageLookup {
  return {
    year: input.year,
    make: cleanPart(input.make),
    model: cleanPart(input.model),
    trim: cleanPart(input.trim),
    generation: cleanPart(input.generation),
    imageQuery: cleanPart(input.imageQuery),
  };
}

function parseLooseQuery(query: string): VehicleImageLookup {
  const clean = query.replace(/\s+automobile\s*$/i, "").trim();
  const yearMatch = clean.match(/\b(18|19|20)\d{2}\b/);
  const withoutYear = yearMatch ? clean.replace(yearMatch[0], "").trim() : clean;
  const parts = withoutYear.split(/\s+/);
  return { year: yearMatch ? Number(yearMatch[0]) : undefined, make: parts[0] || "car", model: parts.slice(1).join(" ") || "automobile", imageQuery: clean };
}

function cleanPart(value?: string) {
  return (value ?? "").replace(/[_|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}

function cleanTrim(value?: string) {
  const trim = cleanPart(value);
  return /^(base|standard|varies|unknown|model range)$/i.test(trim) ? "" : trim;
}

function tokenize(value: string) {
  return normalize(value).split(/\s+/).filter((token) => token.length > 1 && !["the", "and", "car", "automobile", "model"].includes(token));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/^file:/, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function dedupeStages(stages: SearchStage[]) {
  const seen = new Set<string>();
  return stages.filter((stage) => {
    const key = normalize(stage.query);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackImage(): CarImageCredit {
  return {
    url: "/images/fallback-car.svg",
    fallback: true,
    author: "How Tuff Is Your Car",
    license: "Original site illustration",
    matchLevel: "fallback",
    matchLabel: "Original vehicle illustration",
  };
}

function stripHtml(value?: string) {
  if (!value) return undefined;
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

type CommonsPage = {
  title?: string;
  imageinfo?: Array<{
    thumburl?: string;
    url?: string;
    descriptionurl?: string;
    mime?: string;
    width?: number;
    height?: number;
    extmetadata?: Record<string, { value?: string }>;
  }>;
};

function extractPages(payload: unknown): CommonsPage[] {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return [];
  const query = (payload as Record<string, unknown>).query;
  if (typeof query !== "object" || query === null || Array.isArray(query)) return [];
  const pages = (query as Record<string, unknown>).pages;
  if (typeof pages !== "object" || pages === null || Array.isArray(pages)) return [];
  return Object.values(pages).filter((page): page is CommonsPage => typeof page === "object" && page !== null && !Array.isArray(page));
}

function extractWikipediaPages(payload: unknown): Array<{ title: string; pageimage?: string }> {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return [];
  const query = (payload as Record<string, unknown>).query;
  if (typeof query !== "object" || query === null || Array.isArray(query)) return [];
  const pages = (query as Record<string, unknown>).pages;
  if (typeof pages !== "object" || pages === null || Array.isArray(pages)) return [];
  return Object.values(pages).flatMap((page) => {
    if (typeof page !== "object" || page === null || Array.isArray(page)) return [];
    const record = page as Record<string, unknown>;
    return typeof record.title === "string" ? [{ title: record.title, pageimage: typeof record.pageimage === "string" ? record.pageimage : undefined }] : [];
  });
}
