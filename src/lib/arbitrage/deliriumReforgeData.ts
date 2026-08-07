import { readLocalStorage, writeLocalStorage } from "@/lib/storage";

// Per-orb "your cost" + "how many are you reforging" overrides. Quantity
// isn't a fixed recipe stack size here (unlike divination cards) - the
// Harvest reforge takes whatever quantity you bring, so it's a real slider
// per row rather than static data.
export interface ReforgeOverride {
  buy: number;
  quantity: number;
}

export type ReforgeOverrideMap = Record<string, ReforgeOverride>;

function overridesKey(league: string, slug: string) {
  return `phw:reforgeoverrides:v1:${league}:${slug}`;
}

export function loadReforgeOverrides(league: string, slug: string): ReforgeOverrideMap {
  return readLocalStorage(overridesKey(league, slug), {} as ReforgeOverrideMap);
}

export function saveReforgeOverrides(league: string, slug: string, overrides: ReforgeOverrideMap): void {
  writeLocalStorage(overridesKey(league, slug), overrides);
}

// One shared results log for the whole technique, not per starting orb -
// assumes the reforge draws from the same random pool regardless of which
// orb type you fed in. Correct this (split into per-orb logs) if that
// assumption turns out to be wrong in-game.
export type ReforgeLogCounts = Record<string, number>;

function logKey(league: string, slug: string) {
  return `phw:reforgelog:v1:${league}:${slug}`;
}

export function loadReforgeLog(league: string, slug: string): ReforgeLogCounts {
  return readLocalStorage(logKey(league, slug), {} as ReforgeLogCounts);
}

export function recordReforgeResult(league: string, slug: string, outcomeName: string): ReforgeLogCounts {
  const counts = loadReforgeLog(league, slug);
  const next = { ...counts, [outcomeName]: (counts[outcomeName] ?? 0) + 1 };
  writeLocalStorage(logKey(league, slug), next);
  return next;
}

export function resetReforgeLog(league: string, slug: string): void {
  writeLocalStorage(logKey(league, slug), {});
}
