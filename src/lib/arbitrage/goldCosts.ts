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
  "A Dab of Ink": 250,
  "A Modest Request": 475,
  "A Mother's Parting Gift": 200,
  "A Note in the Wind": 350,
  "A Sea of Blue": 90,
  "Abandoned Wealth": 275,
  "Acclimatisation": 125,
  "Alivia's Grace": 175,
  "Alluring Bounty": 375,
  "Altered Perception": 725,
  "Anarchy's Price": 1250,
  "Apocalypse": 700,
  "Assassin's Gift": 1850,
  "Audacity": 525,
  "Avian Pursuit": 500,
  "Brother's Gift": 600,
  "Brother's Stash": 600,
  "Chaotic Disposition": 125,
  "Checkmate": 325,
  "Coveted Possession": 150,
  "Cursed Words": 125,
  "Darker Half": 750,
  "Dementophobia": 500,
  "Demigod's Wager": 225,
  "Disdain": 300,
  "Divine Beauty": 275,
  "Divine Shard": 250,
  "Emperor's Luck": 10,
  "Ever-Changing": 175,
  "Harmony of Souls": 375,
  "History": 1850,
  "House of Mirrors": 1850,
  "I See Brothers": 775,
  "Imperfect Memories": 650,
  "Lucky Connections": 95,
  "Lucky Deck": 350,
  "Monochrome": 275,
  "No Traces": 150,
  "Outfoxed": 1000,
  "Rain of Chaos": 5,
  "Runic Luck": 550,
  "Seven Years Bad Luck": 550,
  "Society's Remorse": 125,
  "The Cacophony": 375,
  "The Finishing Touch": 275,
  "The Fool": 125,
  "The Formless Sea": 275,
  "The Fortunate": 175,
  "The Gemcutter": 125,
  "The Heroic Shot": 150,
  "The Inventor": 105,
  "The Journey": 225,
  "The Lake": 1500,
  "The Long Con": 600,
  "The Master Artisan": 125,
  "The Saint's Treasure": 200,
  "The Scholar": 15,
  "The Scout": 325,
  "The Seeker": 325,
  "The Sephirot": 325,
  "The Slumbering Beast": 500,
  "The Survivalist": 90,
  "The Tinkerer's Table": 350,
  "The Tireless Extractor": 70,
  "The Transformation": 325,
  "The Union": 175,
  "The Wrath": 85,
  "Three Faces in the Dark": 25,
  "Three Voices": 55,
  "Underground Forest": 350,
  "Unrequited Love": 1450,
  "Vinia's Token": 60,
};

export function getDivinationCardGoldCost(cardName: string): number | undefined {
  return DIVINATION_CARD_GOLD_COSTS[cardName];
}

// Scarab gold cost, per single scarab bought. Empty to start - deliberately
// left out of the flat CURRENCY_GOLD_COSTS table above since scarabs have no
// single rarity-based rate, same reasoning as essences/fossils/oils. Fill
// this in from the Scarab Reference page's CSV export as values are
// confirmed in-game.
export const SCARAB_GOLD_COSTS: Record<string, number> = {};

export function getScarabGoldCost(scarabName: string): number | undefined {
  return SCARAB_GOLD_COSTS[scarabName];
}

// Resolves a technique's goldCostSource tag (see techniques.ts) to the
// actual lookup function. Takes the tag rather than the technique object so
// this can live in the same module as the cost tables without techniques.ts
// and goldCosts.ts importing each other.
export function goldCostLookupFor(
  goldCostSource: "currency" | "divinationCard" | "scarab" | undefined,
): ((itemName: string) => number | undefined) | undefined {
  if (goldCostSource === "currency") return getCurrencyGoldCost;
  if (goldCostSource === "divinationCard") return getDivinationCardGoldCost;
  if (goldCostSource === "scarab") return getScarabGoldCost;
  return undefined;
}
