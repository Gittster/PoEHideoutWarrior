import { readLocalStorage, writeLocalStorage } from "@/lib/storage";

export interface PriceOverride {
  buy: number;
  sell: number;
}

export type OverrideMap = Record<string, PriceOverride>;

function overridesKey(league: string, slug: string) {
  return `phw:overrides:${league}:${slug}`;
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
