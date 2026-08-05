import { DIVINATION_CARD_REWARDS, type DivinationCardReward } from "@/lib/arbitrage/divinationCardRewards";
import { WEIGHTED_CARD_REWARDS, type WeightedCardEntry } from "@/lib/arbitrage/weightedCardRewards";

export interface ArbitrageTechnique {
  slug: string;
  title: string;
  shortDescription: string;
  /** poe.ninja category param, e.g. "DivinationCard", "Essence", "Scarab", "Currency" */
  category: string;
  overview: string[];
  mechanics: string[];
  risks: string[];
  /** Default "opportunity" margin threshold, as a percentage of buy price. */
  defaultThresholdPercent: number;
  buyLabel: string;
  sellLabel: string;
  /**
   * Optional: for techniques where a row's true payout comes from a known
   * static reward (e.g. a divination card's full-stack payout) rather than
   * the item's own poe.ninja price. When set, the table also fetches the
   * poe.ninja category(ies) named on each reward and uses it to price that
   * reward, pre-filling the sell slider with the per-unit price and using
   * `stackSize` to scale the buy side into a full-stack cost.
   */
  rewardConfig?: {
    /** Keyed by the row's item name (e.g. divination card name) */
    rewards: Record<string, DivinationCardReward>;
  };
  /**
   * Optional: for cards whose payout is a random pick from a small pool of
   * rewards rather than one fixed item (e.g. The Card Sharp). Rendered by a
   * separate page/component from `rewardConfig` since the math (expected
   * value across several weighted outcomes) and the extra results-log UI
   * don't fit the single-reward table.
   */
  weightedRewardConfig?: {
    rewards: Record<string, WeightedCardEntry>;
  };
}

export const ARBITRAGE_TECHNIQUES: ArbitrageTechnique[] = [
  {
    slug: "currency-exchange",
    title: "Currency Exchange Arbitrage",
    shortDescription:
      "Spot spreads between currency pairs (e.g. chaos/divine/exalt) that are wider than the market's true rate.",
    category: "Currency",
    overview: [
      "The currency market is really a set of exchange rates between chaos orbs, divine orbs, exalted orbs, and dozens of other currencies. Because listings are posted by many individual players, the effective rate on any one pair can drift away from the 'true' market rate poe.ninja publishes.",
      "This page pulls poe.ninja's live chaos-equivalent value for each currency. Use it as your baseline, then use the sliders to model a specific trade you're seeing in-game (what you can actually buy at, and what you can actually sell at) to see if it clears your margin bar.",
    ],
    mechanics: [
      "Watch for a currency whose live/bulk buy price is meaningfully below its poe.ninja chaos value.",
      "Buy it with a cheaper currency, then convert or resell it near the poe.ninja rate.",
      "Triangular variant: chaos -> A -> B -> chaos, where the round trip nets more chaos than you started with.",
    ],
    risks: [
      "Rates move fast during league start and league end; a stale poe.ninja snapshot can look better than what's actually available.",
      "Bulk trade listings often have minimum/maximum stock - the quoted rate may not hold at the volume you want.",
    ],
    defaultThresholdPercent: 8,
    buyLabel: "Your buy price (chaos)",
    sellLabel: "Your sell price (chaos)",
  },
  {
    slug: "divination-card-flipping",
    title: "Divination Card Flipping",
    shortDescription:
      "Buy undervalued divination cards and turn in full stacks for a reward worth more than the stack cost.",
    category: "DivinationCard",
    overview: [
      "Each divination card has a stack size and a reward (an item or amount of currency) you get once you've collected the full stack and turn it in at a stash tab. For cards with a plain currency reward, this page looks up the reward's live price and computes the full-stack payout directly - Stack Cost (card price x stack size) vs Reward Value (reward quantity x reward price).",
      "Cards without a mapped reward (mostly ones that give a unique item, rare item, or a random category rather than a fixed currency) fall back to comparing the card's own poe.ninja price against a manual sell price you set, same as before.",
    ],
    mechanics: [
      "Compare the total cost of buying a full stack against the resale value of the card's reward.",
      "Cards with a swingy or chase reward (unique item, expensive map, etc.) are worth tracking manually since poe.ninja's average can lag the reward's own price swings.",
      "Bulk-buying a stack is usually cheaper per-card than buying singles - factor that into your 'buy' slider.",
    ],
    risks: [
      "The card -> reward mapping is hand-maintained static data, not fetched live - GGG occasionally rebalances rewards between leagues, so double-check a card here before trusting it for a big trade.",
      "Reward items can themselves be illiquid - selling the payout may take longer than assembling the stack did.",
      "Some rewards are randomized within a range (e.g. currency shards), adding variance to the real payout.",
    ],
    defaultThresholdPercent: 15,
    buyLabel: "Your cost per card (chaos)",
    sellLabel: "Reward price per unit (chaos)",
    rewardConfig: {
      rewards: DIVINATION_CARD_REWARDS,
    },
  },
  {
    slug: "variable-reward-cards",
    title: "Variable-Reward Divination Cards",
    shortDescription:
      "Cards that pay out a random pick from a small pool of rewards, priced by expected value instead of one fixed payout.",
    category: "DivinationCard",
    overview: [
      "Most divination cards give one fixed reward, but a handful randomize between a small set of possible payouts - The Card Sharp always gives a Divination Scarab, for example, but which type you get varies. GGG doesn't publish the odds for these, so this page doesn't guess: log what you actually pull each time you turn in a stack, and it builds up your own odds from that log, then computes an expected value from those odds and each outcome's live price.",
      "The more results you log, the more the computed odds (and the expected value built from them) should converge on the real thing. With few results logged, treat the number as rough.",
    ],
    mechanics: [
      "Expected value = sum over each possible outcome of (your logged share of results for it) x (its reward quantity) x (its live price).",
      "Compare the full-stack cost against the expected value, same as the fixed-reward page.",
      "The single outcome you get on any one stack can be far off the average - this is a long-run edge across many stacks, not a guaranteed profit per stack.",
    ],
    risks: [
      "The odds shown are only as good as your own logged sample size - with few results logged, an outcome you haven't pulled yet still shows 0% even though it's possible, which understates the expected value.",
      "A possible outcome missing from the list entirely would also understate the expected value the same way - if your logged results keep landing on something not in the pool, let me know so it can be added.",
      "Some individual outcomes may have no live price at all, in which case the expected value can't be computed until poe.ninja has data for it.",
    ],
    defaultThresholdPercent: 15,
    buyLabel: "Your cost per card (chaos)",
    sellLabel: "Expected value per stack (chaos)",
    weightedRewardConfig: {
      rewards: WEIGHTED_CARD_REWARDS,
    },
  },
  {
    slug: "essence-flipping",
    title: "Essence Flipping",
    shortDescription:
      "Buy essences in bulk below market and resell at (or craft with and resell above) the going per-unit rate.",
    category: "Essence",
    overview: [
      "Essences are consumed on crafting bases to guarantee a modifier, which keeps steady demand from crafters. Bulk sellers frequently under-cut the per-unit poe.ninja price to move stock quickly, which is where the flip comes from.",
      "poe.ninja's chaosValue below is the going per-essence rate. Use the buy slider for what a bulk lot actually costs you per unit, and the sell slider for what you can realistically list singles at.",
    ],
    mechanics: [
      "Watch for sellers pricing full tabs of essences well under the per-unit rate for quick bulk sales.",
      "Higher-tier essences (Deafening/Shrieking) of in-demand modifiers hold value best.",
      "Corrupted/unique-only essences are a separate, thinner market - treat their prices as noisier.",
    ],
    risks: [
      "Reselling singles takes listing effort and time - factor in whether the spread is worth the trade volume.",
      "Meta shifts (build patches, new unique interactions) can move demand for specific essence types quickly.",
    ],
    defaultThresholdPercent: 20,
    buyLabel: "Your bulk cost per unit (chaos)",
    sellLabel: "Your resale price per unit (chaos)",
  },
  {
    slug: "scarab-arbitrage",
    title: "Scarab Bulk-to-Retail Arbitrage",
    shortDescription:
      "Buy scarabs in bulk stacks below market and resell individually near the poe.ninja per-scarab rate.",
    category: "Scarab",
    overview: [
      "Scarabs are consumed one at a time on maps, so most buyers only want a handful at once - but sellers looking to offload large stacks quickly often price the whole stack below the sum of its per-unit values.",
      "This is the classic 'buy the stack wholesale, sell the pieces at retail' arbitrage. The live price below is poe.ninja's per-scarab rate; use the sliders to model your actual bulk cost and resale price.",
    ],
    mechanics: [
      "Look for stack listings priced below (per-unit rate x stack size).",
      "Rarer scarabs (boss-reward tiers, league-mechanic scarabs) have the widest bulk-vs-retail spreads.",
      "Splitting a big stack into sale-sized listings (1-4x) usually sells faster than relisting the full stack.",
    ],
    risks: [
      "Popular scarab types are actively watched by other flippers, so spreads close quickly.",
      "Scarab value is tied to current league-mechanic popularity, which can shift week to week.",
    ],
    defaultThresholdPercent: 15,
    buyLabel: "Your bulk cost per scarab (chaos)",
    sellLabel: "Your resale price per scarab (chaos)",
  },
];

export function getArbitrageTechnique(slug: string): ArbitrageTechnique | undefined {
  return ARBITRAGE_TECHNIQUES.find((t) => t.slug === slug);
}
