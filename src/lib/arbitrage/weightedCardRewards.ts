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
};
