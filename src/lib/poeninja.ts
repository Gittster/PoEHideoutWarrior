// Server-side poe.ninja client, ported from the working Google Apps Script
// IMPORTPOENINJA function: try the stash/item/exchange economy overview
// endpoints in order and return the first one that has data. Must run
// server-side (called from the /api/poeninja route) - poe.ninja's economy
// endpoints don't send CORS headers, so the browser can't call them directly.

export interface PoeNinjaItem {
  id: string;
  name: string;
  chaosValue: number;
  variant: string;
  /**
   * The raw numeric id poe.ninja's "stash" pricing pipeline uses (distinct
   * from `id`, which favors the human-readable detailsId slug). Needed for
   * fetchPoeNinjaItemHistory's stash/current/item/history fallback - see
   * there for why. Empty string when the line doesn't have one.
   */
  ninjaId: string;
}

const CATEGORY_ALIASES: Record<string, string> = {
  skillgem: "SkillGem",
  skillgems: "SkillGem",
  divinationcard: "DivinationCard",
  divinationcards: "DivinationCard",
  essence: "Essence",
  essences: "Essence",
  scarab: "Scarab",
  scarabs: "Scarab",
  currency: "Currency",
  fragment: "Fragment",
  fragments: "Fragment",
};

export function normalizeCategory(category: string): string {
  const key = category.toLowerCase().replace(/\s+/g, "");
  return CATEGORY_ALIASES[key] ?? category;
}

interface NinjaLine {
  id?: string | number;
  detailsId?: string;
  name?: string;
  chaosValue?: number;
  primaryValue?: number;
  gemLevel?: number;
  gemQuality?: number;
  corrupted?: boolean;
  links?: number;
  variant?: string;
}

interface NinjaItemMeta {
  id?: string | number;
  detailsId?: string;
  name?: string;
  gemLevel?: number;
  gemQuality?: number;
  corrupted?: boolean;
  links?: number;
  variant?: string;
}

interface NinjaResponse {
  lines?: NinjaLine[];
  items?: NinjaItemMeta[];
}

function buildEndpoints(category: string, league: string) {
  const base = "https://poe.ninja/poe1/api/economy";
  const qs = `league=${encodeURIComponent(league)}&type=${encodeURIComponent(category)}&language=en`;
  return [
    `${base}/stash/current/item/overview?${qs}`,
    `${base}/item/current/overview?${qs}`,
    `${base}/exchange/current/overview?${qs}`,
  ];
}

function toRow(line: NinjaLine, meta: NinjaItemMeta): PoeNinjaItem {
  const name = line.name ?? meta.name ?? line.detailsId ?? String(line.id ?? "Unknown");
  const price = line.chaosValue ?? line.primaryValue ?? 0;

  const variantParts: string[] = [];
  const gemLvl = line.gemLevel ?? meta.gemLevel;
  const gemQual = line.gemQuality ?? meta.gemQuality;
  const isCorrupted = line.corrupted ?? meta.corrupted;
  const links = line.links ?? meta.links;
  const variant = line.variant ?? meta.variant;

  if (gemLvl) variantParts.push(`Lvl ${gemLvl}${gemQual ? `/${gemQual}%` : ""}`);
  if (isCorrupted) variantParts.push("Corrupted");
  if (links) variantParts.push(`${links}L`);
  if (variant) variantParts.push(variant);

  return {
    // Prefer detailsId - it's the slug the exchange "details" endpoint
    // expects (see fetchPoeNinjaItemHistory), whereas plain `id` isn't
    // guaranteed to be.
    id: String(line.detailsId ?? line.id ?? name),
    name,
    chaosValue: price,
    variant: variantParts.join(", "),
    ninjaId: line.id !== undefined ? String(line.id) : "",
  };
}

export async function fetchPoeNinjaCategory(
  categoryInput: string,
  league: string,
): Promise<PoeNinjaItem[]> {
  const category = normalizeCategory(categoryInput);
  const endpoints = buildEndpoints(category, league);

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { accept: "application/json" },
        // poe.ninja data updates periodically; avoid hammering it on every
        // page load while still staying reasonably fresh.
        next: { revalidate: 600 },
      });
      if (!res.ok) continue;

      const json = (await res.json()) as NinjaResponse;
      const itemMap = new Map<string, NinjaItemMeta>();
      for (const item of json.items ?? []) {
        const key = item.id ?? item.detailsId;
        if (key !== undefined) itemMap.set(String(key), item);
      }

      const lines = json.lines ?? [];
      if (lines.length === 0) continue;

      return lines.map((line) => {
        const key = line.id ?? line.detailsId;
        const meta = (key !== undefined && itemMap.get(String(key))) || {};
        return toRow(line, meta);
      });
    } catch {
      // Try the next endpoint.
    }
  }

  return [];
}

export interface PriceHistoryPoint {
  date: string;
  chaosValue: number;
}

export interface PriceHistory {
  itemName: string;
  points: PriceHistoryPoint[];
}

interface NinjaHistoryEntry {
  timestamp: string;
  rate: number;
}

interface NinjaPair {
  id: string;
  rate?: number;
  history?: NinjaHistoryEntry[];
}

interface NinjaDetailsResponse {
  item?: { name?: string };
  pairs?: NinjaPair[];
}

interface NinjaStashHistoryEntry {
  count: number;
  value: number;
  daysAgo: number;
}

async function fetchExchangeHistory(
  category: string,
  slugId: string,
  league: string,
): Promise<PriceHistory | null> {
  const url = `https://poe.ninja/poe1/api/economy/exchange/current/details?league=${encodeURIComponent(league)}&type=${encodeURIComponent(category)}&id=${encodeURIComponent(slugId)}`;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: 600 },
  });
  if (!res.ok) return null;

  const json = (await res.json()) as NinjaDetailsResponse;
  const chaosPair = json.pairs?.find((pair) => pair.id === "chaos");
  const history = chaosPair?.history ?? [];
  if (history.length === 0) return null;

  // poe.ninja returns newest-first here; charts read left-to-right chronologically.
  const points = [...history]
    .reverse()
    .map((entry) => ({ date: entry.timestamp, chaosValue: entry.rate }));

  return { itemName: json.item?.name ?? slugId, points };
}

async function fetchStashHistory(
  category: string,
  rawId: string,
  league: string,
): Promise<PriceHistory | null> {
  const url = `https://poe.ninja/poe1/api/economy/stash/current/item/history?league=${encodeURIComponent(league)}&type=${encodeURIComponent(category)}&id=${encodeURIComponent(rawId)}`;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: 600 },
  });
  if (!res.ok) return null;

  const json = (await res.json()) as NinjaStashHistoryEntry[];
  if (!Array.isArray(json) || json.length === 0) return null;

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  // Already oldest-first (daysAgo descending) in practice, but sort
  // defensively rather than assume poe.ninja's ordering is guaranteed.
  const points = [...json]
    .sort((a, b) => b.daysAgo - a.daysAgo)
    .map((entry) => ({
      date: new Date(now - entry.daysAgo * DAY_MS).toISOString(),
      chaosValue: entry.value,
    }));

  return { itemName: rawId, points };
}

// The per-item price history behind the "click an item for a chart" feature.
// poe.ninja splits pricing across two different pipelines depending on the
// item type (mirroring the stash/item/exchange split in buildEndpoints
// above), and each has its own, incompatible history endpoint:
//  - "exchange" items (Currency, Fragment, DivinationCard, ...) - keyed by a
//    human-readable slug (e.g. "reflecting-mist"), history comes from
//    exchange/current/details' `pairs[].history`.
//  - "stash" items (unique items, gems, ...) - keyed by an internal numeric
//    id (e.g. 2089, poe.ninja's PoeNinjaItem.ninjaId), history comes from
//    stash/current/item/history as a flat {value, daysAgo}[] array.
// Try the slug/exchange route first (the common case), and only fall back to
// the numeric/stash route if that comes back empty and a rawId was given -
// see divinationCardRewards.ts for why that's a separate, hand-maintained
// thing from what the reward mapping itself describes.
export async function fetchPoeNinjaItemHistory(
  categoryInput: string,
  itemId: string,
  league: string,
  rawId?: string,
): Promise<PriceHistory | null> {
  const category = normalizeCategory(categoryInput);

  try {
    const bySlug = await fetchExchangeHistory(category, itemId, league);
    if (bySlug) return bySlug;
  } catch {
    // Fall through to the stash-history attempt.
  }

  if (rawId) {
    try {
      const byRawId = await fetchStashHistory(category, rawId, league);
      if (byRawId) return byRawId;
    } catch {
      // Both attempts failed - fall through to the null return below.
    }
  }

  return null;
}
