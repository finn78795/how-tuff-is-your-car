import type { Car, CarSearchResult } from "@/types/car";
import type { AccessoryObservation, BuildRatingResult, StyleRatingResult, VehicleRecognitionResult } from "@/lib/ai/types";

const HISTORY_KEY = "htiyc-search-history";
const FAVORITES_KEY = "htiyc-favorites";
const BUILDS_KEY = "htiyc-saved-builds";
const MAX_HISTORY = 8;
const MAX_BUILDS = 12;

export interface SavedBuild {
  id: string;
  nickname: string;
  createdAt: string;
  previewDataUrl?: string;
  recognition: VehicleRecognitionResult;
  matchedCar?: CarSearchResult;
  accessories: AccessoryObservation[];
  styleRating: StyleRatingResult;
  buildRating: BuildRatingResult;
}

function safeStringArray(value: string | null): string[] {
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
  return safeStringArray(localStorage.getItem(HISTORY_KEY));
}

export function addToSearchHistory(car: Car) {
  if (typeof window === "undefined") return;
  const current = getSearchHistory().filter((slug) => slug !== car.slug);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([car.slug, ...current].slice(0, MAX_HISTORY)));
  notifyStorage();
}

export function clearSearchHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
  notifyStorage();
}

export function getFavorites() {
  if (typeof window === "undefined") return [];
  return safeStringArray(localStorage.getItem(FAVORITES_KEY));
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
  notifyStorage();
  return next.includes(slug);
}

export function getSavedBuilds(): SavedBuild[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(BUILDS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isSavedBuild).slice(0, MAX_BUILDS) : [];
  } catch {
    return [];
  }
}

export function saveBuild(build: SavedBuild) {
  if (typeof window === "undefined") return;
  const existing = getSavedBuilds().filter((item) => item.id !== build.id);
  const next = [build, ...existing].slice(0, MAX_BUILDS);
  try {
    localStorage.setItem(BUILDS_KEY, JSON.stringify(next));
  } catch {
    // Safari local storage can fill up quickly if several thumbnails are saved.
    const withoutPreview = { ...build, previewDataUrl: undefined };
    localStorage.setItem(BUILDS_KEY, JSON.stringify([withoutPreview, ...existing].slice(0, MAX_BUILDS)));
  }
  notifyStorage();
}

export function deleteBuild(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BUILDS_KEY, JSON.stringify(getSavedBuilds().filter((item) => item.id !== id)));
  notifyStorage();
}

function isSavedBuild(value: unknown): value is SavedBuild {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === "string" && typeof record.nickname === "string" && typeof record.createdAt === "string";
}

function notifyStorage() {
  window.dispatchEvent(new Event("htiyc-storage"));
}
