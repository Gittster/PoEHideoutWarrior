import { readLocalStorage, writeLocalStorage } from "@/lib/storage";

// Gold cost is a fixed game mechanic tied to item rarity, not a live market
// price - unlike buy/sell overrides these aren't scoped to a league. Lets
// the divination card reference page work as an entry screen without a
// backend: values you fill in live only in this browser (they don't touch
// goldCosts.ts), layered on top of the static DIVINATION_CARD_GOLD_COSTS
// table the same way price overrides layer on top of poe.ninja's live data.
export type GoldCostOverrideMap = Record<string, number>;

const KEY = "phw:goldcostoverrides:v1";

export function loadGoldCostOverrides(): GoldCostOverrideMap {
  return readLocalStorage(KEY, {} as GoldCostOverrideMap);
}

export function saveGoldCostOverrides(overrides: GoldCostOverrideMap): void {
  writeLocalStorage(KEY, overrides);
}
