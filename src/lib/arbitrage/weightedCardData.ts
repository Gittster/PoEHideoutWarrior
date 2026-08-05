import { readLocalStorage, writeLocalStorage } from "@/lib/storage";

// Per-card "your cost" override - just a buy price (no sell override in v1;
// outcome prices always come from live poe.ninja data since there's no
// single "the reward" to override the way the fixed-reward table does).
export type BuyOverrideMap = Record<string, number>;

function buyOverrideKey(league: string, slug: string) {
  return `phw:weightedbuy:v1:${league}:${slug}`;
}

export function loadBuyOverrides(league: string, slug: string): BuyOverrideMap {
  return readLocalStorage(buyOverrideKey(league, slug), {} as BuyOverrideMap);
}

export function saveBuyOverrides(league: string, slug: string, overrides: BuyOverrideMap): void {
  writeLocalStorage(buyOverrideKey(league, slug), overrides);
}

// A running tally of what you've actually pulled from a given card, so the
// documented outcome weights can be sanity-checked against real results.
// Keyed by reward name -> count.
export type CardLogCounts = Record<string, number>;

function cardLogKey(league: string, slug: string, cardName: string) {
  return `phw:cardlog:v1:${league}:${slug}:${cardName}`;
}

export function loadCardLog(league: string, slug: string, cardName: string): CardLogCounts {
  return readLocalStorage(cardLogKey(league, slug, cardName), {} as CardLogCounts);
}

export function recordCardResult(
  league: string,
  slug: string,
  cardName: string,
  rewardName: string,
): CardLogCounts {
  const counts = loadCardLog(league, slug, cardName);
  const next = { ...counts, [rewardName]: (counts[rewardName] ?? 0) + 1 };
  writeLocalStorage(cardLogKey(league, slug, cardName), next);
  return next;
}

export function resetCardLog(league: string, slug: string, cardName: string): void {
  writeLocalStorage(cardLogKey(league, slug, cardName), {});
}
