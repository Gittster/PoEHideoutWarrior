// Parses the plain text produced by copying an item in-game (Ctrl+C) into a
// structured shape crafting guides can match against. Deliberately tolerant:
// unrecognised lines are kept in modLines rather than dropped, and fields
// that can't be found are left undefined rather than guessed.
//
// Advanced Mod Descriptions (Options -> UI, confirmed enabled for this
// guide's author) adds a bracket line above each mod, confirmed against a
// real paste in two forms:
//   { Prefix Modifier "Crusader's" (Tier: 1) — Damage, Physical }
//   { Master Crafted Prefix Modifier "Upgraded" (Rank: 1) — Life }
// One bracket can describe more than one following stat line (a two-line
// Elevated prefix grants both its lines under a single bracket). Parsed
// into `mods` (kind/affix/tier, when a bracket is present) in addition to
// the flat `modLines` (every stat line regardless of whether it had a
// bracket) so callers that only care about presence/text can ignore mods
// entirely, and callers that need prefix/suffix counts don't have to.

export interface ParsedMod {
  /** The stat line(s) this bracket describes - 2 for a two-line Elevated-style prefix, 1 otherwise. */
  lines: string[];
  kind: "Prefix" | "Suffix";
  masterCrafted: boolean;
  affixName: string;
  tier: number;
}

export interface ParsedItem {
  raw: string;
  itemClass?: string;
  rarity?: "Normal" | "Magic" | "Rare" | "Unique";
  quality?: number;
  itemLevel?: number;
  /** From the "Memory Strands: N" property line. */
  memoryStrands?: number;
  corrupted: boolean;
  mirrored: boolean;
  /** e.g. ["Crusader"] for a Crusader-influenced item, ["Shaper", "Elder"] for double-influenced. */
  influences: string[];
  /** Every stat line found from the Item Level block onward (implicit + explicit combined - see note above on why they aren't split out). */
  modLines: string[];
  /** Only the mods whose Advanced Mod Description bracket was present and parsed - empty if that setting was off for this paste. */
  mods: ParsedMod[];
}

const RARITIES = ["Normal", "Magic", "Rare", "Unique"] as const;
const INFLUENCE_LINE = /^(Shaper|Elder|Crusader|Redeemer|Hunter|Warlord) Item$/;
const MOD_BRACKET = /^\{\s*(Master Crafted\s+)?(Prefix|Suffix)\s+Modifier\s+"([^"]+)"\s*\((?:Tier|Rank):\s*(\d+)\)/;

function isInfluenceOnlyBlock(block: string): boolean {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 && lines.every((l) => INFLUENCE_LINE.test(l));
}

export function parseItemText(text: string): ParsedItem | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const blocks = trimmed
    .split(/\n\s*-{3,}\s*\n?/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (blocks.length === 0) return null;

  const item: ParsedItem = {
    raw: trimmed,
    corrupted: false,
    mirrored: false,
    influences: [],
    modLines: [],
    mods: [],
  };
  let itemLevelBlockIndex = -1;

  blocks.forEach((block, i) => {
    const classMatch = block.match(/^Item Class:\s*(.+)$/m);
    if (classMatch) item.itemClass = classMatch[1].trim();

    const rarityMatch = block.match(/^Rarity:\s*(\w+)/m);
    if (rarityMatch && (RARITIES as readonly string[]).includes(rarityMatch[1])) {
      item.rarity = rarityMatch[1] as ParsedItem["rarity"];
    }

    const qualityMatch = block.match(/^Quality:\s*\+?(\d+)%/m);
    if (qualityMatch) item.quality = Number(qualityMatch[1]);

    const strandsMatch = block.match(/^Memory Strands:\s*(\d+)/m);
    if (strandsMatch) item.memoryStrands = Number(strandsMatch[1]);

    const ilvlMatch = block.match(/^Item Level:\s*(\d+)/m);
    if (ilvlMatch) {
      item.itemLevel = Number(ilvlMatch[1]);
      itemLevelBlockIndex = i;
    }

    if (/^Corrupted$/m.test(block)) item.corrupted = true;
    if (/^Mirrored$/m.test(block)) item.mirrored = true;

    for (const m of block.matchAll(new RegExp(INFLUENCE_LINE.source, "gm"))) {
      item.influences.push(m[1]);
    }
  });

  // Doesn't look like real item text (no class/rarity/item level found at all).
  if (!item.itemClass && !item.rarity && item.itemLevel === undefined) return null;

  if (itemLevelBlockIndex >= 0) {
    let pendingMod: Omit<ParsedMod, "lines"> | null = null;
    let pendingLines: string[] = [];

    const flush = () => {
      if (pendingMod && pendingLines.length > 0) {
        item.mods.push({ ...pendingMod, lines: pendingLines });
      }
      pendingMod = null;
      pendingLines = [];
    };

    for (let i = itemLevelBlockIndex + 1; i < blocks.length; i++) {
      const block = blocks[i];
      if (/^(Corrupted|Mirrored|Unidentified)$/.test(block) || /^Note:/.test(block) || isInfluenceOnlyBlock(block)) {
        continue;
      }
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        const bracketMatch = line.match(MOD_BRACKET);
        if (bracketMatch) {
          flush();
          pendingMod = {
            masterCrafted: Boolean(bracketMatch[1]),
            kind: bracketMatch[2] as "Prefix" | "Suffix",
            affixName: bracketMatch[3],
            tier: Number(bracketMatch[4]),
          };
        } else {
          item.modLines.push(line);
          pendingLines.push(line);
        }
      }
      flush();
    }
  }

  return item;
}

export function hasModLine(item: ParsedItem, exact: string): boolean {
  return item.modLines.some((l) => l.replace(/\s+/g, " ").trim() === exact);
}

export function hasModLineContaining(item: ParsedItem, substring: string): boolean {
  return item.modLines.some((l) => l.includes(substring));
}

export function prefixCount(item: ParsedItem): number {
  return item.mods.filter((m) => m.kind === "Prefix").length;
}

export function suffixCount(item: ParsedItem): number {
  return item.mods.filter((m) => m.kind === "Suffix").length;
}
