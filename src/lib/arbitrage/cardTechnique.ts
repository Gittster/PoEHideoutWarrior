import { WEIGHTED_CARD_REWARDS } from "@/lib/arbitrage/weightedCardRewards";

// Which arbitrage technique a divination card's margin should be computed
// under - shared by the card reference page (for favoriting) and the
// dashboard (for recomputing favorited cards' current margin), so both
// agree on where a given card "lives".
export function techniqueSlugForCard(cardName: string): "variable-reward-cards" | "divination-card-flipping" {
  if (WEIGHTED_CARD_REWARDS[cardName]) return "variable-reward-cards";
  return "divination-card-flipping";
}
