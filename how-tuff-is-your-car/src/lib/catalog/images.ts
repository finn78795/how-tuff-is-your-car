import type { CarImageCredit } from "@/types/car";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

function stripHtml(value?: string) {
  if (!value) return undefined;
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function findVehicleImage(query: string): Promise<CarImageCredit> {
  try {
    const cleanQuery = query.replace(/\s+automobile\s*$/i, "").trim();
    const url = new URL(COMMONS_API);
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", `${cleanQuery} automobile`);
    url.searchParams.set("gsrnamespace", "6");
    url.searchParams.set("gsrlimit", "12");
    url.searchParams.set("prop", "imageinfo");
    url.searchParams.set("iiprop", "url|mime|extmetadata");
    url.searchParams.set("iiurlwidth", "1400");

    const response = await fetch(url, {
      headers: { "User-Agent": "HowTuffIsYourCar/2.0 (vehicle image lookup)" },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!response.ok) throw new Error(`Commons returned ${response.status}`);
    const payload: unknown = await response.json();
    const pages = extractPages(payload);
    const tokens = cleanQuery.toLowerCase().split(/\s+/).filter((token) => token.length > 2);

    const ranked = pages
      .map((page) => ({ page, score: tokens.reduce((sum, token) => sum + (page.title?.toLowerCase().includes(token) ? 1 : 0), 0) }))
      .sort((a, b) => b.score - a.score);

    for (const { page } of ranked) {
      const info = page.imageinfo?.[0];
      if (!info?.thumburl && !info?.url) continue;
      if (info.mime && !["image/jpeg", "image/png", "image/webp"].includes(info.mime)) continue;
      const metadata = info.extmetadata ?? {};
      return {
        url: info.thumburl ?? info.url!,
        sourceUrl: info.descriptionurl,
        author: stripHtml(metadata.Artist?.value || metadata.Credit?.value),
        license: stripHtml(metadata.LicenseShortName?.value || metadata.UsageTerms?.value),
      };
    }
  } catch (error) {
    console.error("Wikimedia Commons image lookup failed", error);
  }

  return {
    url: "/images/fallback-car.svg",
    fallback: true,
    author: "How Tuff Is Your Car",
    license: "Original site illustration",
  };
}

type CommonsPage = {
  title?: string;
  imageinfo?: Array<{
    thumburl?: string;
    url?: string;
    descriptionurl?: string;
    mime?: string;
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
