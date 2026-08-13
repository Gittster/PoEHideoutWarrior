import { hasModLine, hasModLineContaining, type ParsedItem } from "./itemParser";

export interface CraftStep {
  n: number;
  title: string;
  detail: string;
  /** False = this can't be reliably read from pasted item text (e.g. Memory Thread count) - shown as a manual checklist entry instead of something the matcher checks. */
  autoDetectable: boolean;
  /** Present only when autoDetectable - true if the pasted item currently sits in this step's state. */
  isSatisfied?: (item: ParsedItem) => boolean;
}

export interface CraftGuide {
  slug: string;
  title: string;
  shortDescription: string;
  overview: string[];
  risks: string[];
  receiverSteps: CraftStep[];
  donorBase: {
    title: string;
    description: string[];
  };
}

// Mod text confirmed against Path of Building's current ModExplicit.lua data
// (pathofbuildingcommunity/pathofbuilding, src/Data/ModExplicit.lua) rather
// than guessed - both are flat values with no roll range, so each is its
// only tier:
//   T1 "Crusader's"          -> HolyPhysicalExplosionInfluence1
//   T0 "Elevated Crusader's" -> HolyPhysicalExplosionInfluenceMaven_ (a
//                                two-line prefix: the AoE roll + this line)
// There is a separate, differently-worded "chance to Explode" Crusader mod
// (a different mod group) - the exact strings below are picked specifically
// to not collide with it.
const T1_EXPLODE = "Enemies you Kill Explode, dealing 3% of their Life as Physical Damage";
const T0_EXPLODE = "Enemies you Kill Explode, dealing 5% of their Life as Physical Damage";
const T0_EXPLODE_AOE_SUBSTRING = "increased Area of Effect";

function hasT1Explode(item: ParsedItem) {
  return hasModLine(item, T1_EXPLODE);
}
function hasT0Explode(item: ParsedItem) {
  return hasModLine(item, T0_EXPLODE) && hasModLineContaining(item, T0_EXPLODE_AOE_SUBSTRING);
}

export const CRAFT_GUIDES: CraftGuide[] = [
  {
    slug: "double-elevated-necro-body",
    title: "Double Elevated Necromantic Body Armour (Explode)",
    shortDescription:
      "Craft a Necromantic body armour with an Elevated Crusader's \"Enemies you Kill Explode\" prefix plus an Elevated Shaper mod, using Orb of Dominance to combine a receiver and donor base.",
    overview: [
      "Two bases run in parallel: a \"receiver\" that gets pushed toward a locked T1 Crusader Explode prefix, and a \"donor\" that supplies a second influence mod for Orb of Dominance to elevate. Paste your receiver's current item text below and the guide will point at the step your item is sitting at.",
      "The T1 vs T0 (Elevated) Explode prefix is detected by its exact stat text, confirmed against Path of Building's current mod data: T1 reads \"Enemies you Kill Explode, dealing 3% of their Life as Physical Damage\"; the Elevated version reads \"...dealing 5%...\" and always comes paired with an \"increased Area of Effect\" line, since Elevated Crusader's is a two-line prefix.",
    ],
    risks: [
      "This matcher only reads what's in the pasted item text - it cannot see Memory Thread count, Beastcrafting Imprint/Lock state, or which specific mod your Orb of Dominance roll picked. Steps needing that are marked \"manual\" below and won't be auto-detected.",
      "Prefix/suffix counts beyond the Explode mod are approximated from total mod-line count, not a full affix lookup - if Advanced Mod Descriptions is on (confirmed enabled), pasting real item text once game access is back will let this be tightened to read the actual Prefix/Suffix tier annotations instead of approximating.",
      "If a pasted item's Item Class isn't \"Body Armours\", double check you copied the right item - the guide will still try to match it, but the mod text it's looking for is specific to body armour Crusader/Shaper influence rolls.",
    ],
    receiverSteps: [
      {
        n: 1,
        title: "Acquire the base",
        detail: "High-quality Twilight Regalia base, Normal rarity, item level 86+. Expand for trade links and acquisition options.",
        autoDetectable: true,
        isSatisfied: (item) => item.rarity === "Normal" && (item.itemLevel ?? 0) >= 86 && (item.quality ?? 0) > 0,
      },
      {
        n: 2,
        title: "Orb of Remembrance",
        detail: "Apply Orb of Remembrance repeatedly until the item has 80+ Memory Threads.",
        autoDetectable: false,
      },
      {
        n: 3,
        title: "Bench craft to rare",
        detail: "Bench-craft the item up to Rare.",
        autoDetectable: true,
        isSatisfied: (item) => item.rarity === "Rare" && !hasT1Explode(item) && !hasT0Explode(item),
      },
      {
        n: 4,
        title: "Reforge for T1 Explode",
        detail: "Physical reforge until the item is Rare with exactly 1 prefix: the T1 Crusader \"Enemies you Kill Explode, dealing 3%\" mod.",
        autoDetectable: true,
        isSatisfied: (item) => item.rarity === "Rare" && hasT1Explode(item) && !hasT0Explode(item) && item.modLines.length === 1,
      },
      {
        n: 5,
        title: "Lock and scour",
        detail: "Beastcraft to lock the Explode prefix, then Scour - the mod can't be changed from here on out.",
        autoDetectable: false,
      },
      {
        n: 6,
        title: "Imprint",
        detail: "Item should now be Magic with only the locked T1 Explode prefix. Beastcraft an Imprint of it before continuing.",
        autoDetectable: true,
        isSatisfied: (item) => item.rarity === "Magic" && hasT1Explode(item) && !hasT0Explode(item) && item.modLines.length === 1,
      },
      {
        n: 7,
        title: "Regal + Harvest reforge",
        detail: "Regal, then Harvest-reforge (crit) until you land the T1 Explode prefix plus a Crusader-influence mod, with no other prefixes.",
        autoDetectable: true,
        isSatisfied: (item) => item.rarity === "Rare" && hasT1Explode(item) && !hasT0Explode(item) && item.modLines.length >= 2,
      },
      {
        n: 8,
        title: "Orb of Dominance",
        detail: "Use Orb of Dominance with your donor base to elevate one of the two influence mods to T0. If it doesn't land on the Explode line, restore from your Imprint and go back to step 4.",
        autoDetectable: false,
      },
      {
        n: 9,
        title: "Scour again",
        detail: "Item should now be Rare with the T0 Elevated Explode prefix locked in. Scour it back down.",
        autoDetectable: true,
        isSatisfied: (item) => item.rarity === "Rare" && hasT0Explode(item),
      },
      {
        n: 10,
        title: "Ready for the beast lock",
        detail: "Item is Magic with the T0 Elevated Explode prefix - ready for the beastcraft lock/multimod pass on top.",
        autoDetectable: true,
        isSatisfied: (item) => item.rarity === "Magic" && hasT0Explode(item),
      },
    ],
    donorBase: {
      title: "Donor base (not paste-tracked - reference only)",
      description: [
        "Find or roll a Shaper-influenced body armour with a top-tier \"rarity\" mod plus 1-3 additional Shaper mods (up to 6 total prefix/suffix lines split 1-3 prefixes / 0-2 suffixes) - this is what Orb of Dominance draws its second influence mod from in step 8, so it's consumed there rather than tracked through its own steps here.",
        "More donor bases in reserve means more value retained and a higher chance of hitting a beast lock overall - current plan is settling around 4 donor bases on hand.",
      ],
    },
  },
];

export function getCraftGuide(slug: string): CraftGuide | undefined {
  return CRAFT_GUIDES.find((g) => g.slug === slug);
}

export interface StepMatch {
  step: CraftStep;
  confidence: "high" | "low";
}

/**
 * Best matching step for a parsed item, checked from the most advanced step
 * backward - later-stage signatures are more specific (T0 Explode can only
 * appear after Dominance), so checking them first avoids an early loose
 * match (e.g. step 3's "Rare, no Explode yet") stealing a later state.
 */
export function matchCurrentStep(guide: CraftGuide, item: ParsedItem): StepMatch | null {
  const detectable = guide.receiverSteps.filter((s) => s.autoDetectable && s.isSatisfied);
  const reversed = [...detectable].reverse();
  for (const step of reversed) {
    if (step.isSatisfied!(item)) {
      return { step, confidence: step.n === 3 || step.n === 1 ? "low" : "high" };
    }
  }
  return null;
}
