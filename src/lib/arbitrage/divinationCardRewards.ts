// Card -> full-stack reward, for cards whose reward is a plain, individually
// priceable currency item. Sourced from poedb.tw/us/Divination_Cards - poe.ninja
// has no API for this mapping (its exchange "details" endpoint only returns
// bulk-exchange trading rates for the card itself, not what it converts into).
//
// This is static game data (reward + stack size don't change with league), so
// it's safe to hardcode - only the live price of the reward item is fetched.
// Cards that give a random/non-specific reward (e.g. "Currency", "Essence",
// "Oil" without a tier) are intentionally omitted since there's no single item
// to price. GGG occasionally rebalances card rewards between leagues - verify
// here if a row looks off, and update as needed.
export interface DivinationCardReward {
  stackSize: number;
  rewardQuantity: number;
  rewardName: string;
}

export const DIVINATION_CARD_REWARDS: Record<string, DivinationCardReward> = {
  "A Sea of Blue": { stackSize: 3, rewardQuantity: 13, rewardName: "Orb of Alteration" },
  "Abandoned Wealth": { stackSize: 5, rewardQuantity: 3, rewardName: "Exalted Orb" },
  "Acclimatisation": { stackSize: 2, rewardQuantity: 20, rewardName: "Orb of Alteration" },
  "Alluring Bounty": { stackSize: 7, rewardQuantity: 10, rewardName: "Exalted Orb" },
  "Altered Perception": { stackSize: 3, rewardQuantity: 1, rewardName: "Simulacrum" },
  "Ambitious Obsession": { stackSize: 4, rewardQuantity: 1, rewardName: "Skittering Delirium Orb" },
  "Avian Pursuit": { stackSize: 3, rewardQuantity: 1500, rewardName: "Vivid Crystallised Lifeforce" },
  "Brother's Gift": { stackSize: 1, rewardQuantity: 5, rewardName: "Divine Orb" },
  "Brother's Stash": { stackSize: 1, rewardQuantity: 5, rewardName: "Exalted Orb" },
  "Chaotic Disposition": { stackSize: 1, rewardQuantity: 5, rewardName: "Chaos Orb" },
  "Checkmate": { stackSize: 8, rewardQuantity: 76, rewardName: "Simulacrum Splinter" },
  "Coveted Possession": { stackSize: 9, rewardQuantity: 5, rewardName: "Regal Orb" },
  "Darker Half": { stackSize: 3, rewardQuantity: 5, rewardName: "Eldritch Chaos Orb" },
  "Dementophobia": { stackSize: 11, rewardQuantity: 10, rewardName: "Delirium Orb" },
  "Demigod's Wager": { stackSize: 7, rewardQuantity: 1, rewardName: "Orb of Annulment" },
  "Disdain": { stackSize: 5, rewardQuantity: 1, rewardName: "Delirium Orb" },
  "Divine Beauty": { stackSize: 12, rewardQuantity: 7, rewardName: "Divine Orb" },
  "Emperor's Luck": { stackSize: 5, rewardQuantity: 5, rewardName: "Currency" },
  "Ever-Changing": { stackSize: 3, rewardQuantity: 10, rewardName: "Orb of Unmaking" },
  "Harmony of Souls": { stackSize: 9, rewardQuantity: 9, rewardName: "Shrieking Essence" },
  "History": { stackSize: 5, rewardQuantity: 2, rewardName: "Hinekora's Lock" },
  "House of Mirrors": { stackSize: 9, rewardQuantity: 1, rewardName: "Mirror of Kalandra" },
  "I See Brothers": { stackSize: 2, rewardQuantity: 2, rewardName: "Fracturing Orb" },
  "Imperfect Memories": { stackSize: 5, rewardQuantity: 1, rewardName: "Astrolabe" },
  "Loyalty": { stackSize: 5, rewardQuantity: 3, rewardName: "Orb of Fusing" },
  "Lucky Connections": { stackSize: 7, rewardQuantity: 20, rewardName: "Orb of Fusing" },
  "Lucky Deck": { stackSize: 9, rewardQuantity: 10, rewardName: "Stacked Deck" },
  "Monochrome": { stackSize: 3, rewardQuantity: 1, rewardName: "Valdo's Puzzle Box" },
  "No Traces": { stackSize: 9, rewardQuantity: 30, rewardName: "Orb of Scouring" },
  "Outfoxed": { stackSize: 2, rewardQuantity: 1, rewardName: "Veiled Exalted Orb" },
  "Rain of Chaos": { stackSize: 8, rewardQuantity: 1, rewardName: "Chaos Orb" },
  "Runic Luck": { stackSize: 4, rewardQuantity: 10, rewardName: "Vendor Refresh Currency" },
  "Seven Years Bad Luck": { stackSize: 13, rewardQuantity: 1, rewardName: "Mirror Shard" },
  "Society's Remorse": { stackSize: 1, rewardQuantity: 10, rewardName: "Orb of Alteration" },
  "The Cacophony": { stackSize: 8, rewardQuantity: 3, rewardName: "Deafening Essence" },
  "The Catalyst": { stackSize: 3, rewardQuantity: 1, rewardName: "Vaal Orb" },
  "The Finishing Touch": { stackSize: 2, rewardQuantity: 1, rewardName: "Fertile Catalyst" },
  "The Fool": { stackSize: 4, rewardQuantity: 20, rewardName: "Orb of Chance" },
  "The Fortunate": { stackSize: 12, rewardQuantity: 2, rewardName: "Divine Orb" },
  "The Gemcutter": { stackSize: 3, rewardQuantity: 1, rewardName: "Gemcutter's Prism" },
  "The Heroic Shot": { stackSize: 1, rewardQuantity: 17, rewardName: "Chromatic Orb" },
  "The Hoarder": { stackSize: 12, rewardQuantity: 1, rewardName: "Exalted Orb" },
  "The Innocent": { stackSize: 10, rewardQuantity: 40, rewardName: "Orb of Regret" },
  "The Inventor": { stackSize: 6, rewardQuantity: 10, rewardName: "Vaal Orb" },
  "The Journey": { stackSize: 4, rewardQuantity: 1, rewardName: "Journey Tattoo" },
  "The Lake": { stackSize: 8, rewardQuantity: 1, rewardName: "Reflecting Mist" },
  "The Long Con": { stackSize: 4, rewardQuantity: 1, rewardName: "Elderslayer's Exalted Orb" },
  "The Master Artisan": { stackSize: 5, rewardQuantity: 20, rewardName: "Quality Currency" },
  "The Rabbit's Foot": { stackSize: 8, rewardQuantity: 10, rewardName: "Incursion Vial" },
  "The Rusted Bard": { stackSize: 9, rewardQuantity: 4, rewardName: "Tainted Mythic Orb" },
  "The Saint's Treasure": { stackSize: 10, rewardQuantity: 2, rewardName: "Exalted Orb" },
  "The Scholar": { stackSize: 3, rewardQuantity: 40, rewardName: "Scroll of Wisdom" },
  "The Scout": { stackSize: 8, rewardQuantity: 7, rewardName: "Exalted Orb" },
  "The Seeker": { stackSize: 9, rewardQuantity: 3, rewardName: "Orb of Annulment" },
  "The Sephirot": { stackSize: 11, rewardQuantity: 10, rewardName: "Divine Orb" },
  "The Slumbering Beast": { stackSize: 5, rewardQuantity: 1, rewardName: "Hinekora's Lock" },
  "The Survivalist": { stackSize: 3, rewardQuantity: 7, rewardName: "Orb of Alchemy" },
  "The Tinkerer's Table": { stackSize: 5, rewardQuantity: 5, rewardName: "Fossil" },
  "The Tireless Extractor": { stackSize: 8, rewardQuantity: 10, rewardName: "Oil" },
  "The Transformation": { stackSize: 5, rewardQuantity: 1, rewardName: "Tainted Mythic Orb" },
  "The Union": { stackSize: 7, rewardQuantity: 10, rewardName: "Gemcutter's Prism" },
  "The Wrath": { stackSize: 8, rewardQuantity: 10, rewardName: "Chaos Orb" },
  "Three Faces in the Dark": { stackSize: 7, rewardQuantity: 3, rewardName: "Chaos Orb" },
  "Three Voices": { stackSize: 3, rewardQuantity: 3, rewardName: "Essence" },
  "Underground Forest": { stackSize: 4, rewardQuantity: 10, rewardName: "Grand Eldritch Ichor" },
  "Unrequited Love": { stackSize: 16, rewardQuantity: 19, rewardName: "Mirror Shard" },
  "Vinia's Token": { stackSize: 5, rewardQuantity: 10, rewardName: "Orb of Regret" },
};
