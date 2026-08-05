// Divination cards whose payout is a random pick from a small pool of
// possible rewards, rather than one fixed item - e.g. The Card Sharp always
// gives ONE Divination Scarab, but which type is picked by weight. These
// can't be priced with the single-reward model in divinationCardRewards.ts
// (there's no single "the" reward), so they get an expected-value model
// instead: EV = sum over each outcome of (its share of total weight) x
// (its reward quantity) x (its live price).
//
// Weights are relative to each other WITHIN the listed outcome set only - if
// a card can give some other reward not listed here, the computed EV will be
// too optimistic (it treats the listed outcomes as the only ones possible).
// Stack size and weights below are user-supplied, not scraped/verified
// against a second source - double check before trusting a big trade, and
// use the results log on the page to sanity-check the weights against what
// you actually pull.
export interface WeightedCardOutcome {
  rewardName: string;
  category: string;
  rewardQuantity: number;
  weight: number;
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
        weight: 1,
      },
      {
        rewardName: "Divination Scarab of Plenty",
        category: "Scarab",
        rewardQuantity: 1,
        weight: 5,
      },
      {
        rewardName: "Divination Scarab of The Cloister",
        category: "Scarab",
        rewardQuantity: 1,
        weight: 5,
      },
    ],
  },
};
