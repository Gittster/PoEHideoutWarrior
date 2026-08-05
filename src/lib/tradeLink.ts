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
//
// Also restricts results to listings priced in Chaos Orbs, via
// filters.trade_filters.filters.price.option - same "option" shape as every
// other dropdown filter in the site's own query format (status.option,
// type_filters.filters.category.option, ...), nested the same way as
// map_filters/type_filters. Confirmed working against a live search.
//
// And excludes corrupted items and Foulborn uniques (the Keepers of the
// Flame variant that swaps in an alternate mod on an existing unique, same
// display name as the base item) via misc_filters, same "option": "false"
// shape as corrupted - so a plain name search doesn't mix Foulborn copies in
// with normal ones.
export function buildTradeSearchUrl(itemName: string, category: string, league: string): string {
  const isUnique = category.startsWith("Unique");

  const query: Record<string, unknown> = {
    status: { option: "securable" },
    stats: [{ type: "and", filters: [] }],
    filters: {
      trade_filters: {
        disabled: false,
        filters: {
          price: { option: "chaos" },
        },
      },
      misc_filters: {
        disabled: false,
        filters: {
          corrupted: { option: "false" },
          foulborn: { option: "false" },
        },
      },
    },
  };
  if (isUnique) {
    query.name = itemName;
  } else {
    query.type = itemName;
  }

  const body = { query, sort: { price: "asc" } };
  return `https://www.pathofexile.com/trade/search/${encodeURIComponent(league)}?q=${encodeURIComponent(JSON.stringify(body))}`;
}
