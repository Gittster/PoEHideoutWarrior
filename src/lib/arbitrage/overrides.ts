import { readLocalStorage, writeLocalStorage } from "@/lib/storage";

export interface PriceOverride {
  buy: number;
  sell: number;
}

export type OverrideMap = Record<string, PriceOverride>;

// v2: the divination-card "sell" override changed meaning from full-stack
// total to per-unit reward price. Bumping the key means old total-based
// values (which would now get re-multiplied by quantity) are simply never
// read, instead of silently producing wildly wrong margins.
function overridesKey(league: string, slug: string) {
  return `phw:overrides:v2:${league}:${slug}`;
}

function thresholdKey(league: string, slug: string) {
  return `phw:threshold:${league}:${slug}`;
}

export function loadOverrides(league: string, slug: string): OverrideMap {
  return readLocalStorage(overridesKey(league, slug), {} as OverrideMap);
}

export function saveOverrides(league: string, slug: string, overrides: OverrideMap): void {
  writeLocalStorage(overridesKey(league, slug), overrides);
}

export function loadThreshold(league: string, slug: string, fallback: number): number {
  return readLocalStorage(thresholdKey(league, slug), fallback);
}

export function saveThreshold(league: string, slug: string, value: number): void {
  writeLocalStorage(thresholdKey(league, slug), value);
}
