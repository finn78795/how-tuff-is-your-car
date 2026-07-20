import type { Car } from "@/types/car";

const HISTORY_KEY = "htiyc-search-history";
const FAVORITES_KEY = "htiyc-favorites";
const MAX_HISTORY = 8;

function safeParse(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function getSearchHistory() {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(HISTORY_KEY));
}

export function addToSearchHistory(car: Car) {
  if (typeof window === "undefined") return;
  const current = getSearchHistory().filter((slug) => slug !== car.slug);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([car.slug, ...current].slice(0, MAX_HISTORY)));
  window.dispatchEvent(new Event("htiyc-storage"));
}

export function clearSearchHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
  window.dispatchEvent(new Event("htiyc-storage"));
}

export function getFavorites() {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(FAVORITES_KEY));
}

export function isFavorite(slug: string) {
  return getFavorites().includes(slug);
}

export function toggleFavorite(slug: string) {
  if (typeof window === "undefined") return false;
  const current = getFavorites();
  const next = current.includes(slug)
    ? current.filter((item) => item !== slug)
    : [slug, ...current];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("htiyc-storage"));
  return next.includes(slug);
}
