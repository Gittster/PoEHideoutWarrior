// Builds a pathofexile.com/trade search link pre-filled with an item name, so
// the price-history popup can jump straight to live listings. This mirrors
// the query shape official.pathofexile.com/trade itself generates when you
// type a name into the search box and pick a suggestion - it isn't in GGG's
// public API docs, but it's the same format long-standing community tools
// (Awakened PoE Trade, poe-trade-macro, ...) rely on. If a generated link
// ever comes back empty/malformed, this query shape is the first thing to
// re-check against a fresh example from the live site.
//
// Two variants:
//  - Unique items (weapons, armour, accessories, jewels, flasks) have a name
//    distinct from their base item type, which we don't track - so search by
//    `name` alone and let the site match it.
//  - Everything else (divination cards, currency, fragments, gems, ...) uses
//    its display name as the `type` field instead, since that's the same
//    string the trade site's own "item" search box expects there.
export function buildTradeSearchUrl(itemName: string, category: string, league: string): string {
  const isUnique = category.startsWith("Unique");

  const query: Record<string, unknown> = {
    status: { option: "securable" },
    stats: [{ type: "and", filters: [] }],
  };
  if (isUnique) {
    query.name = itemName;
  } else {
    query.type = itemName;
  }

  const body = { query, sort: { price: "asc" } };
  return `https://www.pathofexile.com/trade/search/${encodeURIComponent(league)}?q=${encodeURIComponent(JSON.stringify(body))}`;
}
