import type { MetadataRoute } from "next";
import { curatedCars, getClassicSitemapEntries } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://how-tuff-is-your-car.vercel.app";
  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/compare`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...curatedCars.map((car) => ({
      url: `${baseUrl}/car/${car.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    ...getClassicSitemapEntries().map(({ slug }) => ({
      url: `${baseUrl}/car/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.55,
    })),
  ];
}
