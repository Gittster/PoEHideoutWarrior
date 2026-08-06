// Gold cost per single unit bought through the in-game Currency Exchange
// (the instant-fill bulk market, not classic player trade/whispers - that
// doesn't cost gold). Charged on the "want/buy" side of an order, scaling
// with the item's rarity. Sourced directly from the user, not fetched live
// (there's no API for this) and not independently verified - GGG doesn't
// publish an official table either.
//
// Only unambiguous, single-value items are mapped below. Left out
// deliberately rather than guessed:
//  - Categories with multiple tiers and no clear item-name -> value mapping
//    (scarabs, essences, fossils, oils, catalysts, omens, tattoos,
//    resonators, legion emblems, delirium orbs, runegrafts, eldritch
//    ichor/ember, foulborn currency, most fragments, Chromatic Orb).
//  - Rate-based costs rather than a flat per-unit cost (Crystallised
//    Lifeforce at "1 gold per 8", Rogue Markers at "1 per 1000") - the
//    tables here model a flat cost per unit bought, not a quantity-scaled
//    rate, so these don't fit without a "how many are you buying" input.
//  - A few names given without enough detail to pin down the exact in-game
//    item ("Mist", "Astrolabes", "Voidborn key", "Influenced exalted
//    orbs").
// Fill any of these in as you confirm the exact item name and value.
export const CURRENCY_GOLD_COSTS: Record<string, number> = {
  "Chaos Orb": 15,
  "Orb of Fusing": 15,
  "Orb of Alchemy": 15,
  "Orb of Scouring": 15,
  "Divine Orb": 250,
  "Orb of Annulment": 250,
  "Ancient Orb": 250,
  "Portal Scroll": 1,
  "Scroll of Wisdom": 1,
  "Orb of Transmutation": 3,
  "Orb of Augmentation": 5,
  "Jeweller's Orb": 10,
  "Orb of Chance": 10,
  "Orb of Alteration": 10,
  "Exalted Orb": 20,
  "Regal Orb": 20,
  "Orb of Regret": 20,
  "Orb of Unmaking": 20,
  "Vaal Orb": 20,
  "Orb of Binding": 20,
  "Instilling Orb": 20,
  "Armourer's Scrap": 25,
  "Blacksmith's Whetstone": 30,
  "Blessed Orb": 35,
  "Enkindling Orb": 35,
  "Stacked Deck": 35,
  "Gemcutter's Prism": 50,
  "Glassblower's Bauble": 50,
  "Veiled Chaos Orb": 250,
  "Sacred Orb": 250,
  "Tempering Orb": 250,
  "Tailoring Orb": 250,
  "Fracturing Orb": 500,
  "Hinekora's Lock": 6250,
  "Mirror Shard": 1250,
  "Mirror of Kalandra": 25000,
  "Maven's Chisel": 200,
};

export function getCurrencyGoldCost(itemName: string): number | undefined {
  return CURRENCY_GOLD_COSTS[itemName];
}

// Divination-card gold cost, per single card bought. Unlike currency this is
// fully variable per card with no pattern to infer from - build it up
// entry-by-entry as real values are confirmed in-game, same as
// divinationCardRewards.ts.
export const DIVINATION_CARD_GOLD_COSTS: Record<string, number> = {
  "The Card Sharp": 275,
  "The Hoarder": 150,
  "The Cache": 100,
  "Loyalty": 20,
  "The Rusted Bard": 425,
  "The Innocent": 200,
  "Ambitious Obsession": 1850,
};

export function getDivinationCardGoldCost(cardName: string): number | undefined {
  return DIVINATION_CARD_GOLD_COSTS[cardName];
}
