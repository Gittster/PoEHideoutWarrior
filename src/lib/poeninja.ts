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

// The per-item price history behind the "click an item for a chart" feature.
// This is poe.ninja's bulk-currency-exchange "details" endpoint - it returns
// daily rate history for trading the item against chaos (and divine), which
// is what the exchange order book actually is, not a description of what the
// item "converts into" (see divinationCardRewards.ts for why that's a
// separate, hand-maintained thing).
export async function fetchPoeNinjaItemHistory(
  categoryInput: string,
  itemId: string,
  league: string,
): Promise<PriceHistory | null> {
  const category = normalizeCategory(categoryInput);
  const url = `https://poe.ninja/poe1/api/economy/exchange/current/details?league=${encodeURIComponent(league)}&type=${encodeURIComponent(category)}&id=${encodeURIComponent(itemId)}`;

  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as NinjaDetailsResponse;
    const chaosPair = json.pairs?.find((pair) => pair.id === "chaos");
    const history = chaosPair?.history ?? [];
    if (history.length === 0) return null;

    // poe.ninja returns newest-first; charts read left-to-right chronologically.
    const points = [...history]
      .reverse()
      .map((entry) => ({ date: entry.timestamp, chaosValue: entry.rate }));

    return { itemName: json.item?.name ?? itemId, points };
  } catch {
    return null;
  }
}
