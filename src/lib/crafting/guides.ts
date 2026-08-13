import { hasModLineContaining, prefixCount, suffixCount, type ParsedItem, type ParsedMod } from "./itemParser";

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

// Target mod confirmed against Path of Building's current ModExplicit.lua
// data (pathofbuildingcommunity/pathofbuilding, src/Data/ModExplicit.lua)
// AND against a real pasted item's own "needs 21+ chance to explode"
// requirement - this is the CHANCE-based Crusader explode mod, not the
// flat-damage one (a separate mod group that also exists on body armour):
//   21-30% roll, "Crusader's"          -> HolyPhysicalExplosionChanceInfluence2_
//   31-35% roll, "Elevated Crusader's" -> HolyPhysicalExplosionChanceInfluenceMaven
//                                          (a two-line prefix: the AoE roll + this line)
// Unlike the flat-damage mod, this one has a roll range, so real item text
// shows it as "value(min-max)% chance to Explode..." (confirmed from a
// real paste) - matched by regex and the rolled value, not exact text.
// The 31%+ Elevated threshold is PoB-sourced only, not independently
// confirmed the way the 21%+ base threshold is.
const CHANCE_EXPLODE_RE =
  /^Enemies you Kill have a (\d+)(?:\(\d+-\d+\))?% chance to Explode, dealing a tenth of their maximum Life as Physical Damage$/;
const CHANCE_EXPLODE_T1_MIN = 21;
const CHANCE_EXPLODE_T0_MIN = 31;
const AOE_SUBSTRING = "increased Area of Effect";

function chanceExplodeValue(item: ParsedItem): number | undefined {
  for (const line of item.modLines) {
    const m = line.match(CHANCE_EXPLODE_RE);
    if (m) return Number(m[1]);
  }
  return undefined;
}
function hasExplodeMod(item: ParsedItem) {
  const v = chanceExplodeValue(item);
  return v !== undefined && v >= CHANCE_EXPLODE_T1_MIN;
}
function isElevatedExplode(item: ParsedItem) {
  const v = chanceExplodeValue(item);
  return v !== undefined && v >= CHANCE_EXPLODE_T0_MIN && hasModLineContaining(item, AOE_SUBSTRING);
}
function hasCrusaderInfluence(item: ParsedItem) {
  return item.influences.includes("Crusader");
}

// Confirmed from a real paste: this craft's Crusader prefixes are
// "Crusader's" (base) and "Elevated Crusader's" - and per the guide
// author, body armour has no Crusader-tagged suffixes at all, so any
// suffix present is always an unrelated mod to annul away.
const CRUSADER_AFFIXES = ["Crusader's", "Elevated Crusader's"];
function isCrusaderPrefix(mod: ParsedMod) {
  return mod.kind === "Prefix" && CRUSADER_AFFIXES.includes(mod.affixName);
}
function allPrefixesCrusader(item: ParsedItem) {
  return item.mods.filter((m) => m.kind === "Prefix").every(isCrusaderPrefix);
}

// Both require the Explode mod itself to be present (not just a matching
// mod count - an item with exactly 1 unrelated prefix would otherwise look
// "clean"), and fall back to the old modLine-count heuristic when a paste
// has no Advanced Mod Description brackets at all (item.mods empty), since
// prefixCount/suffixCount can't tell prefix from suffix without them.
function isCleanSingleExplodePrefix(item: ParsedItem): boolean {
  if (!hasExplodeMod(item)) return false;
  if (item.mods.length > 0) return prefixCount(item) === 1 && suffixCount(item) === 0;
  return item.modLines.length === 1;
}
function isExplodePlusOneCrusaderPrefix(item: ParsedItem): boolean {
  if (!hasExplodeMod(item)) return false;
  if (item.mods.length > 0) return prefixCount(item) === 2 && suffixCount(item) === 0 && allPrefixesCrusader(item);
  return item.modLines.length >= 2;
}

// Bypass threshold from the guide's own notes: Orb of Remembrance is
// recommended up to 80+ Memory Strands, but it's fine to move on once
// you're at 70+.
const MEMORY_STRANDS_BYPASS = 70;

export const CRAFT_GUIDES: CraftGuide[] = [
  {
    slug: "double-elevated-necro-body",
    title: "Double Elevated Necromantic Body Armour (Explode)",
    shortDescription:
      "Craft a Necromantic body armour with an Elevated Crusader's \"Enemies you Kill Explode\" prefix plus an Elevated Shaper mod, using Orb of Dominance to combine a receiver and donor base.",
    overview: [
      "Two bases run in parallel: a \"receiver\" that gets pushed toward a locked chance-to-Explode Crusader prefix, and a \"donor\" that supplies a second influence mod for Orb of Dominance to elevate. Paste your receiver's current item text below and the guide will point at the step your item is sitting at.",
      "The base vs Elevated tier of the Explode prefix is detected by its rolled value: 21%+ chance to Explode is the base tier, 31%+ paired with an \"increased Area of Effect\" line is Elevated (Elevated Crusader's is a two-line prefix). Prefix/suffix counts and which prefixes are Crusader-tagged are read from the Advanced Mod Description bracket above each mod, confirmed against a real paste - if that setting is off, those counts fall back to being unavailable rather than guessed.",
    ],
    risks: [
      "This matcher only reads what's in the pasted item text - it cannot see Beastcrafting Imprint/Lock state or which specific mod your Orb of Dominance roll picked (it can read Memory Strands directly, from the item's \"Memory Strands: N\" property line, and prefix/suffix counts from Advanced Mod Description brackets). Steps needing state it truly can't see are marked \"manual\" below.",
      "A Rare item carrying the chance-to-Explode mod plus several other mods can't always be told apart from the later Regal + Harvest reforge state (step 8) purely from text - the matcher prefers the more-advanced interpretation when both could fit, so double check against the step list if that seems off for where you actually are.",
      "If a pasted item's Item Class isn't \"Body Armours\", double check you copied the right item - the guide will still try to match it, but the mod text it's looking for is specific to body armour Crusader/Shaper influence rolls.",
    ],
    receiverSteps: [
      {
        n: 1,
        title: "Acquire the base",
        detail: "High-quality Twilight Regalia base, Normal rarity, item level 86+. Expand for trade links and acquisition options.",
        autoDetectable: true,
        isSatisfied: (item) =>
          item.rarity === "Normal" &&
          (item.itemLevel ?? 0) >= 86 &&
          (item.quality ?? 0) > 0 &&
          !hasCrusaderInfluence(item),
      },
      {
        n: 2,
        title: "Orb of Remembrance",
        detail: `Apply Orb of Remembrance repeatedly until the item has 80+ Memory Strands. Recommended but optional - okay to bypass if the item ends up with fewer than ${MEMORY_STRANDS_BYPASS} Memory Strands.`,
        autoDetectable: true,
        isSatisfied: (item) =>
          item.rarity === "Normal" &&
          hasCrusaderInfluence(item) &&
          (item.memoryStrands ?? 0) < MEMORY_STRANDS_BYPASS,
      },
      {
        n: 3,
        title: "Bench craft & imprint",
        detail: "Bench-craft a minimum-tier +maximum Life mod, then Beastcraft an Imprint with a Craicic Croaker before regaling, to protect your Memory Strands. If the regal costs more than ~5-6 Memory Strands, restore the imprint and retry. Optional, same as the Memory Strands step - bypass entirely if the item already has Memory Strands and is Rare.",
        autoDetectable: true,
        isSatisfied: (item) =>
          (item.rarity === "Normal" &&
            hasCrusaderInfluence(item) &&
            (item.memoryStrands ?? 0) >= MEMORY_STRANDS_BYPASS) ||
          (item.rarity === "Rare" && !hasExplodeMod(item)),
      },
      {
        n: 4,
        title: "Reforge for the Explode mod",
        detail: "Physical reforge until the item is Rare with the Crusader \"chance to Explode\" mod at 21%+ (\"Enemies you Kill have a chance to Explode, dealing a tenth of their maximum Life as Physical Damage\") - other mods landing alongside it are fine here, the next step cleans them up.",
        autoDetectable: true,
        // Covers both "haven't landed the Explode mod yet" and "landed it
        // but still has other mods to annul away" - anything Rare that
        // hasn't reached step 5's clean state or step 8+'s Elevated state
        // is still "at step 4."
        isSatisfied: (item) =>
          item.rarity === "Rare" &&
          !isElevatedExplode(item) &&
          !isCleanSingleExplodePrefix(item) &&
          !isExplodePlusOneCrusaderPrefix(item),
      },
      {
        n: 5,
        title: "Annul to lock it in",
        detail: "Orb of Annulment repeatedly until only 1 prefix remains: the chance-to-Explode mod. 2 prefixes is fine to stop at if both are Crusader-tagged - there are no Crusader suffixes on this base, so any suffix present should get annulled away too.",
        autoDetectable: true,
        isSatisfied: (item) =>
          item.rarity === "Rare" &&
          !isElevatedExplode(item) &&
          (isCleanSingleExplodePrefix(item) || isExplodePlusOneCrusaderPrefix(item)),
      },
      {
        n: 6,
        title: "Lock and scour",
        detail: "Beastcraft to lock the Explode prefix, then Scour - the mod can't be changed from here on out.",
        autoDetectable: false,
      },
      {
        n: 7,
        title: "Imprint",
        detail: "Item should now be Magic with only the locked Explode prefix. Beastcraft an Imprint of it before continuing.",
        autoDetectable: true,
        isSatisfied: (item) => item.rarity === "Magic" && !isElevatedExplode(item) && isCleanSingleExplodePrefix(item),
      },
      {
        n: 8,
        title: "Regal + Harvest reforge",
        detail: "Regal, then Harvest-reforge (crit) until you land the Explode prefix plus a Crusader-tagged prefix, with no other prefixes or suffixes.",
        autoDetectable: true,
        isSatisfied: (item) => item.rarity === "Rare" && !isElevatedExplode(item) && isExplodePlusOneCrusaderPrefix(item),
      },
      {
        n: 9,
        title: "Orb of Dominance",
        detail: "Use Orb of Dominance with your donor base to elevate one of the two influence mods to Elevated. If it doesn't land on the Explode line, restore from your Imprint and go back to step 4.",
        autoDetectable: false,
      },
      {
        n: 10,
        title: "Scour again",
        detail: "Item should now be Rare with the Elevated Explode prefix locked in. Scour it back down.",
        autoDetectable: true,
        isSatisfied: (item) => item.rarity === "Rare" && isElevatedExplode(item),
      },
      {
        n: 11,
        title: "Ready for the beast lock",
        detail: "Item is Magic with the Elevated Explode prefix - ready for the beastcraft lock/multimod pass on top.",
        autoDetectable: true,
        isSatisfied: (item) => item.rarity === "Magic" && isElevatedExplode(item),
      },
    ],
    donorBase: {
      title: "Donor base (not paste-tracked - reference only)",
      description: [
        "Find or roll a Shaper-influenced body armour with a top-tier \"rarity\" mod plus 1-3 additional Shaper mods (up to 6 total prefix/suffix lines split 1-3 prefixes / 0-2 suffixes) - this is what Orb of Dominance draws its second influence mod from in step 9, so it's consumed there rather than tracked through its own steps here.",
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
 * backward - later-stage signatures are more specific (Elevated Explode can
 * only appear after Dominance), so checking them first avoids an early loose
 * match (e.g. step 4's "Rare, has the Explode mod" - true for several later
 * steps too) stealing a later state.
 */
export function matchCurrentStep(guide: CraftGuide, item: ParsedItem): StepMatch | null {
  const detectable = guide.receiverSteps.filter((s) => s.autoDetectable && s.isSatisfied);
  const reversed = [...detectable].reverse();
  for (const step of reversed) {
    if (step.isSatisfied!(item)) {
      const lowConfidenceSteps = [1, 3, 4];
      return { step, confidence: lowConfidenceSteps.includes(step.n) ? "low" : "high" };
    }
  }
  return null;
}
