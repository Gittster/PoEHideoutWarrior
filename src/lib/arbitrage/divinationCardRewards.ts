// Card -> full-stack reward, for cards whose reward is a plain, individually
// priceable item. Sourced from poedb.tw/us/Divination_Cards - poe.ninja has
// no API for this mapping (its exchange "details" endpoint only returns
// bulk-exchange trading rates for the card itself, not what it converts into).
//
// This is static game data (reward + stack size don't change with league), so
// it's safe to hardcode - only the live price of the reward item is fetched.
// Cards that give a random/non-specific reward (e.g. "Currency", "Essence",
// "Oil" without a tier) are intentionally omitted since there's no single item
// to price. GGG occasionally rebalances card rewards between leagues - verify
// here if a row looks off, and update as needed.
//
// `category` is the poe.ninja economy category the reward item itself lives
// in - most rewards are plain Currency, but several league-mechanic items
// (fragments, essences, fossils, delirium orbs, vials, tattoos) are their own
// category and 404 if queried as Currency. A wrong/uncertain guess here is
// safe: it just shows as "price unavailable" rather than a wrong number
// (OpportunityTable never falls back to a made-up price).
export interface DivinationCardReward {
  stackSize: number;
  rewardQuantity: number;
  rewardName: string;
  category: string;
}

export const DIVINATION_CARD_REWARDS: Record<string, DivinationCardReward> = {
  "A Sea of Blue": { stackSize: 3, rewardQuantity: 13, rewardName: "Orb of Alteration", category: "Currency" },
  "Abandoned Wealth": { stackSize: 5, rewardQuantity: 3, rewardName: "Exalted Orb", category: "Currency" },
  "Acclimatisation": { stackSize: 2, rewardQuantity: 20, rewardName: "Orb of Alteration", category: "Currency" },
  "Alluring Bounty": { stackSize: 7, rewardQuantity: 10, rewardName: "Exalted Orb", category: "Currency" },
  "Altered Perception": { stackSize: 3, rewardQuantity: 1, rewardName: "Simulacrum", category: "Fragment" },
  "Ambitious Obsession": { stackSize: 4, rewardQuantity: 1, rewardName: "Skittering Delirium Orb", category: "DeliriumOrb" },
  "Avian Pursuit": { stackSize: 3, rewardQuantity: 1500, rewardName: "Vivid Crystallised Lifeforce", category: "Currency" },
  "Brother's Gift": { stackSize: 1, rewardQuantity: 5, rewardName: "Divine Orb", category: "Currency" },
  "Brother's Stash": { stackSize: 1, rewardQuantity: 5, rewardName: "Exalted Orb", category: "Currency" },
  "Chaotic Disposition": { stackSize: 1, rewardQuantity: 5, rewardName: "Chaos Orb", category: "Currency" },
  "Checkmate": { stackSize: 8, rewardQuantity: 76, rewardName: "Simulacrum Splinter", category: "Fragment" },
  "Coveted Possession": { stackSize: 9, rewardQuantity: 5, rewardName: "Regal Orb", category: "Currency" },
  "Darker Half": { stackSize: 3, rewardQuantity: 5, rewardName: "Eldritch Chaos Orb", category: "Currency" },
  "Dementophobia": { stackSize: 11, rewardQuantity: 10, rewardName: "Delirium Orb", category: "DeliriumOrb" },
  "Demigod's Wager": { stackSize: 7, rewardQuantity: 1, rewardName: "Orb of Annulment", category: "Currency" },
  "Disdain": { stackSize: 5, rewardQuantity: 1, rewardName: "Delirium Orb", category: "DeliriumOrb" },
  "Divine Beauty": { stackSize: 12, rewardQuantity: 7, rewardName: "Divine Orb", category: "Currency" },
  "Emperor's Luck": { stackSize: 5, rewardQuantity: 5, rewardName: "Currency", category: "Currency" },
  "Ever-Changing": { stackSize: 3, rewardQuantity: 10, rewardName: "Orb of Unmaking", category: "Currency" },
  "Harmony of Souls": { stackSize: 9, rewardQuantity: 9, rewardName: "Shrieking Essence", category: "Essence" },
  "History": { stackSize: 5, rewardQuantity: 2, rewardName: "Hinekora's Lock", category: "Currency" },
  "House of Mirrors": { stackSize: 9, rewardQuantity: 1, rewardName: "Mirror of Kalandra", category: "Currency" },
  "I See Brothers": { stackSize: 2, rewardQuantity: 2, rewardName: "Fracturing Orb", category: "Currency" },
  "Imperfect Memories": { stackSize: 5, rewardQuantity: 1, rewardName: "Astrolabe", category: "Currency" },
  "Loyalty": { stackSize: 5, rewardQuantity: 3, rewardName: "Orb of Fusing", category: "Currency" },
  "Lucky Connections": { stackSize: 7, rewardQuantity: 20, rewardName: "Orb of Fusing", category: "Currency" },
  "Lucky Deck": { stackSize: 9, rewardQuantity: 10, rewardName: "Stacked Deck", category: "Currency" },
  "Monochrome": { stackSize: 3, rewardQuantity: 1, rewardName: "Valdo's Puzzle Box", category: "Currency" },
  "No Traces": { stackSize: 9, rewardQuantity: 30, rewardName: "Orb of Scouring", category: "Currency" },
  "Outfoxed": { stackSize: 2, rewardQuantity: 1, rewardName: "Veiled Exalted Orb", category: "Currency" },
  "Rain of Chaos": { stackSize: 8, rewardQuantity: 1, rewardName: "Chaos Orb", category: "Currency" },
  "Runic Luck": { stackSize: 4, rewardQuantity: 10, rewardName: "Vendor Refresh Currency", category: "Currency" },
  "Seven Years Bad Luck": { stackSize: 13, rewardQuantity: 1, rewardName: "Mirror Shard", category: "Currency" },
  "Society's Remorse": { stackSize: 1, rewardQuantity: 10, rewardName: "Orb of Alteration", category: "Currency" },
  "The Cacophony": { stackSize: 8, rewardQuantity: 3, rewardName: "Deafening Essence", category: "Essence" },
  "The Catalyst": { stackSize: 3, rewardQuantity: 1, rewardName: "Vaal Orb", category: "Currency" },
  "The Finishing Touch": { stackSize: 2, rewardQuantity: 1, rewardName: "Fertile Catalyst", category: "Currency" },
  "The Fool": { stackSize: 4, rewardQuantity: 20, rewardName: "Orb of Chance", category: "Currency" },
  "The Fortunate": { stackSize: 12, rewardQuantity: 2, rewardName: "Divine Orb", category: "Currency" },
  "The Gemcutter": { stackSize: 3, rewardQuantity: 1, rewardName: "Gemcutter's Prism", category: "Currency" },
  "The Heroic Shot": { stackSize: 1, rewardQuantity: 17, rewardName: "Chromatic Orb", category: "Currency" },
  "The Hoarder": { stackSize: 12, rewardQuantity: 1, rewardName: "Exalted Orb", category: "Currency" },
  "The Innocent": { stackSize: 10, rewardQuantity: 40, rewardName: "Orb of Regret", category: "Currency" },
  "The Inventor": { stackSize: 6, rewardQuantity: 10, rewardName: "Vaal Orb", category: "Currency" },
  "The Journey": { stackSize: 4, rewardQuantity: 1, rewardName: "Journey Tattoo", category: "Tattoo" },
  "The Lake": { stackSize: 8, rewardQuantity: 1, rewardName: "Reflecting Mist", category: "Currency" },
  "The Long Con": { stackSize: 4, rewardQuantity: 1, rewardName: "Elderslayer's Exalted Orb", category: "Currency" },
  "The Master Artisan": { stackSize: 5, rewardQuantity: 20, rewardName: "Quality Currency", category: "Currency" },
  "The Rabbit's Foot": { stackSize: 8, rewardQuantity: 10, rewardName: "Incursion Vial", category: "Vial" },
  "The Rusted Bard": { stackSize: 9, rewardQuantity: 4, rewardName: "Tainted Mythic Orb", category: "Currency" },
  "The Saint's Treasure": { stackSize: 10, rewardQuantity: 2, rewardName: "Exalted Orb", category: "Currency" },
  "The Scholar": { stackSize: 3, rewardQuantity: 40, rewardName: "Scroll of Wisdom", category: "Currency" },
  "The Scout": { stackSize: 8, rewardQuantity: 7, rewardName: "Exalted Orb", category: "Currency" },
  "The Seeker": { stackSize: 9, rewardQuantity: 3, rewardName: "Orb of Annulment", category: "Currency" },
  "The Sephirot": { stackSize: 11, rewardQuantity: 10, rewardName: "Divine Orb", category: "Currency" },
  "The Slumbering Beast": { stackSize: 5, rewardQuantity: 1, rewardName: "Hinekora's Lock", category: "Currency" },
  "The Survivalist": { stackSize: 3, rewardQuantity: 7, rewardName: "Orb of Alchemy", category: "Currency" },
  "The Tinkerer's Table": { stackSize: 5, rewardQuantity: 5, rewardName: "Fossil", category: "Fossil" },
  "The Tireless Extractor": { stackSize: 8, rewardQuantity: 10, rewardName: "Oil", category: "Oil" },
  "The Transformation": { stackSize: 5, rewardQuantity: 1, rewardName: "Tainted Mythic Orb", category: "Currency" },
  "The Union": { stackSize: 7, rewardQuantity: 10, rewardName: "Gemcutter's Prism", category: "Currency" },
  "The Wrath": { stackSize: 8, rewardQuantity: 10, rewardName: "Chaos Orb", category: "Currency" },
  "Three Faces in the Dark": { stackSize: 7, rewardQuantity: 3, rewardName: "Chaos Orb", category: "Currency" },
  "Three Voices": { stackSize: 3, rewardQuantity: 3, rewardName: "Essence", category: "Essence" },
  "Underground Forest": { stackSize: 4, rewardQuantity: 10, rewardName: "Grand Eldritch Ichor", category: "Currency" },
  "Unrequited Love": { stackSize: 16, rewardQuantity: 19, rewardName: "Mirror Shard", category: "Currency" },
  "Vinia's Token": { stackSize: 5, rewardQuantity: 10, rewardName: "Orb of Regret", category: "Currency" },
};
