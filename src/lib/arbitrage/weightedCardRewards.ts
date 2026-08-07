// Divination cards whose payout is a random pick from a small pool of
// possible rewards, rather than one fixed item - e.g. The Card Sharp always
// gives ONE Divination Scarab, but which type is picked is randomized. These
// can't be priced with the single-reward model in divinationCardRewards.ts
// (there's no single "the" reward), and unlike that file, GGG doesn't
// publish the odds anywhere we can source from - so there's no `weight`
// field here at all. Instead, WeightedCardTable derives each outcome's
// probability purely from what you've logged on the page (count for this
// outcome / total logged for the card), and computes expected value from
// that. Until you've logged results, EV is left unavailable rather than
// guessed at.
export interface WeightedCardOutcome {
  rewardName: string;
  category: string;
  rewardQuantity: number;
}

export interface WeightedCardEntry {
  stackSize: number;
  outcomes: WeightedCardOutcome[];
}

export const WEIGHTED_CARD_REWARDS: Record<string, WeightedCardEntry> = {
  "The Card Sharp": {
    stackSize: 4,
    outcomes: [
      {
        rewardName: "Divination Scarab of Pilfering",
        category: "Scarab",
        rewardQuantity: 1,
      },
      {
        rewardName: "Divination Scarab of Plenty",
        category: "Scarab",
        rewardQuantity: 1,
      },
      {
        rewardName: "Divination Scarab of The Cloister",
        category: "Scarab",
        rewardQuantity: 1,
      },
    ],
  },
  // A set of 8 exchanges for a stack of 10 oils of one weighted-random type
  // (not previously mappable under divinationCardRewards.ts's single-reward
  // model - "Oil" isn't a real priceable item, the 13 types below are).
  // Wiki states the weighting favors Clear over Golden but doesn't publish
  // exact odds, same situation as The Card Sharp - odds come from your log.
  "The Tireless Extractor": {
    stackSize: 8,
    outcomes: [
      { rewardName: "Clear Oil", category: "Oil", rewardQuantity: 10 },
      { rewardName: "Golden Oil", category: "Oil", rewardQuantity: 10 },
      { rewardName: "Crimson Oil", category: "Oil", rewardQuantity: 10 },
      { rewardName: "Sepia Oil", category: "Oil", rewardQuantity: 10 },
      { rewardName: "Amber Oil", category: "Oil", rewardQuantity: 10 },
      { rewardName: "Indigo Oil", category: "Oil", rewardQuantity: 10 },
      { rewardName: "Azure Oil", category: "Oil", rewardQuantity: 10 },
      { rewardName: "Silver Oil", category: "Oil", rewardQuantity: 10 },
      { rewardName: "Verdant Oil", category: "Oil", rewardQuantity: 10 },
      { rewardName: "Opalescent Oil", category: "Oil", rewardQuantity: 10 },
      { rewardName: "Teal Oil", category: "Oil", rewardQuantity: 10 },
      { rewardName: "Violet Oil", category: "Oil", rewardQuantity: 10 },
      { rewardName: "Black Oil", category: "Oil", rewardQuantity: 10 },
    ],
  },
  // A set of 5 exchanges for a stack of 5 fossils of one weighted-random
  // type - same situation as the two cards above ("Fossil" isn't a real
  // priceable item, the types below are), odds come from your log.
  "The Tinkerer's Table": {
    stackSize: 5,
    outcomes: [
      { rewardName: "Lucent Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Scorched Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Fundamental Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Glyphic Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Faceted Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Deft Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Serrated Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Prismatic Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Bound Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Shuddering Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Dense Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Gilded Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Hollow Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Frigid Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Fractured Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Bloodstained Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Jagged Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Pristine Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Sanctified Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Metallic Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Aberrant Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Opulent Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Tangled Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Corroded Fossil", category: "Fossil", rewardQuantity: 5 },
      { rewardName: "Aetheric Fossil", category: "Fossil", rewardQuantity: 5 },
    ],
  },
};
