// Boss encounters, priced by "cost of the fragments/keys needed to open the
// fight" vs "expected value of what it drops" - the same shape as the
// Arbitrage section's techniques, but modeled with BossEncounterTable's
// independent-per-item session log instead of ArbitrageTechnique's
// rewardConfig/weightedRewardConfig (a boss fight can drop several of these
// in the same kill, unlike a divination card stack turning into exactly one
// outcome, so "probability" here is timesReceived / fightsRun per item, not
// a shared pool that sums to 100% across outcomes).
export interface BossReward {
  rewardName: string;
  /** poe.ninja category this reward's own price is fetched from. */
  category: string;
  /** Units received per fight this outcome occurs in - 1 for a single unique/gem drop, a representative average for a variable-quantity currency-like drop. */
  rewardQuantity: number;
}

export interface BossEncounter {
  slug: string;
  title: string;
  shortDescription: string;
  overview: string[];
  mechanics: string[];
  risks: string[];
  /** poe.ninja category the entry fragment's own price is fetched from. */
  fragmentCategory: string;
  fragmentName: string;
  /** Fragments consumed per fight (not per kill of each individual boss, if the encounter fights several at once). */
  fragmentQuantity: number;
  possibleRewards: BossReward[];
}

export const BOSS_ENCOUNTERS: BossEncounter[] = [
  {
    slug: "it-that-was-esh-and-tul",
    title: "It That Was Esh & It That Was Tul",
    shortDescription:
      "Open a Hive Colony with a Hivebrain Gland and fight both Breachlords at once for a shot at a Breach unique or a Foulborn item.",
    overview: [
      "A Hivebrain Gland (map fragment) opens the Hive Colony, where It That Was Esh and It That Was Tul are fought together as one encounter - they alternate attacking twice until 40% combined health, then share a single health bar for the rest of the fight. Killing both is one \"fight\" for pricing purposes: one gland in, one shared loot drop out.",
      "The drop table mixes guaranteed drops (Hiveblood every kill, in a wide 1500-2300 quantity range) with several independent unique/gem/jewel chances - you can walk away with nothing but Hiveblood, or several uniques at once, since these aren't mutually exclusive picks from one pool the way a divination card's reward is. Odds here come entirely from your own logged fights, same reasoning as the variable-reward cards page.",
    ],
    mechanics: [
      "Buy Hivebrain Glands (or farm Hive Fortress encounters / Vruun, Marshal of Xesht for them) and log what each fight actually drops.",
      "Expected value per fight = sum over each possible drop of (times you've received it / fights logged) x its reward quantity x its live price.",
      "Defeating both bosses also spawns the Otherworldy Tree (Breachlord Bloodline ascendancy access) - not a priceable drop, but part of why this fight gets run even at a raw chaos loss.",
    ],
    risks: [
      "Reward -> poe.ninja category mapping below is a best-effort guess (unique item slots, and which category things like Hiveblood/Foulgrasp Support/Something Dark live under) for very recently-introduced content - if a whole row shows \"unavailable\", the category guess for that row is probably wrong, not that poe.ninja has no data for it.",
      "Hiveblood's reward quantity is fixed here at 1900 (midpoint of the wiki's stated 1500-2300 range) - edit the value in the session log modal to what you actually received if you want a precise session.",
      "The guaranteed \"Random 1-mod Foulborn original Breach unique item\" drop is modeled below as one of the 18 base Breach uniques it can roll (Xoph's Inception through Eye of Chayula) - priced off that item's plain unique listing, since a Foulborn-specific listing isn't something this app can distinguish. If poe.ninja actually prices Foulborn variants separately, these numbers are an approximation, not the real value.",
      "The odds shown are only as good as your own logged sample size - with few fights logged, an outcome you haven't received yet still shows 0% even though it's possible.",
    ],
    fragmentCategory: "Fragment",
    fragmentName: "Hivebrain Gland",
    fragmentQuantity: 1,
    possibleRewards: [
      { rewardName: "The Will of Esh", category: "UniqueAccessory", rewardQuantity: 1 },
      { rewardName: "The Will of Tul", category: "UniqueAccessory", rewardQuantity: 1 },
      { rewardName: "The Will of Xoph", category: "UniqueAccessory", rewardQuantity: 1 },
      { rewardName: "The Will of Uul-Netol", category: "UniqueAccessory", rewardQuantity: 1 },
      { rewardName: "The Sundered Will", category: "UniqueAccessory", rewardQuantity: 1 },
      { rewardName: "Hand of the Lords", category: "UniqueArmour", rewardQuantity: 1 },
      { rewardName: "The Grey Wind", category: "UniqueWeapon", rewardQuantity: 1 },
      { rewardName: "Uul-Netol's Vow", category: "UniqueAccessory", rewardQuantity: 1 },
      { rewardName: "Flesh of Xesht", category: "UniqueAccessory", rewardQuantity: 1 },
      { rewardName: "Hiveblood", category: "Currency", rewardQuantity: 1900 },
      { rewardName: "Foulgrasp Support", category: "SkillGem", rewardQuantity: 1 },
      { rewardName: "Hiveborn Support", category: "SkillGem", rewardQuantity: 1 },
      { rewardName: "Something Dark", category: "UniqueJewel", rewardQuantity: 1 },
      { rewardName: "The Escape", category: "UniqueJewel", rewardQuantity: 1 },
      // The 18 base ("original") Breach uniques the guaranteed Foulborn
      // drop can roll - see the risk note above on how this is priced.
      // Categories cross-checked against a live poe.ninja UniqueWeapon
      // dump where possible (Xoph's Inception/Tulborn/Hand of Thought and
      // Motion/Uul-Netol's Kiss/Severed in Sleep all confirmed weapons
      // there, correcting earlier armour/accessory/jewel guesses);
      // everything else remains best-effort/unverified.
      { rewardName: "Xoph's Inception", category: "UniqueWeapon", rewardQuantity: 1 },
      { rewardName: "The Formless Flame", category: "UniqueJewel", rewardQuantity: 1 },
      { rewardName: "Xoph's Heart", category: "UniqueAccessory", rewardQuantity: 1 },
      { rewardName: "Tulborn", category: "UniqueWeapon", rewardQuantity: 1 },
      { rewardName: "The Snowblind Grace", category: "UniqueArmour", rewardQuantity: 1 },
      { rewardName: "The Halcyon", category: "UniqueAccessory", rewardQuantity: 1 },
      { rewardName: "Hand of Thought and Motion", category: "UniqueWeapon", rewardQuantity: 1 },
      { rewardName: "Esh's Mirror", category: "UniqueArmour", rewardQuantity: 1 },
      { rewardName: "Voice of the Storm", category: "UniqueAccessory", rewardQuantity: 1 },
      { rewardName: "Uul-Netol's Kiss", category: "UniqueWeapon", rewardQuantity: 1 },
      { rewardName: "The Infinite Pursuit", category: "UniqueArmour", rewardQuantity: 1 },
      { rewardName: "The Anticipation", category: "UniqueArmour", rewardQuantity: 1 },
      { rewardName: "Severed in Sleep", category: "UniqueWeapon", rewardQuantity: 1 },
      { rewardName: "Skin of the Loyal", category: "UniqueArmour", rewardQuantity: 1 },
      { rewardName: "The Red Dream", category: "UniqueJewel", rewardQuantity: 1 },
      { rewardName: "The Green Dream", category: "UniqueJewel", rewardQuantity: 1 },
      { rewardName: "The Blue Dream", category: "UniqueJewel", rewardQuantity: 1 },
      { rewardName: "Eye of Chayula", category: "UniqueAccessory", rewardQuantity: 1 },
    ],
  },
];

export function getBossEncounter(slug: string): BossEncounter | undefined {
  return BOSS_ENCOUNTERS.find((e) => e.slug === slug);
}
