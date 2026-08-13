// Parses the plain text produced by copying an item in-game (Ctrl+C) into a
// structured shape crafting guides can match against. Deliberately tolerant:
// unrecognised lines are kept in modLines rather than dropped, and fields
// that can't be found are left undefined rather than guessed.
//
// Advanced Mod Descriptions (Options -> UI) adds a "{ Prefix Modifier "X"
// (Tier: N) ... }" annotation line above each mod - we strip those out of
// modLines (their exact bracket formatting isn't verified against a real
// paste yet) and match on the plain stat text instead, which is stable
// regardless of that setting.

export interface ParsedItem {
  raw: string;
  itemClass?: string;
  rarity?: "Normal" | "Magic" | "Rare" | "Unique";
  quality?: number;
  itemLevel?: number;
  corrupted: boolean;
  mirrored: boolean;
  /** e.g. ["Crusader"] for a Crusader-influenced item, ["Shaper", "Elder"] for double-influenced. */
  influences: string[];
  /** Every stat line found from the Item Level block onward (implicit + explicit combined - see note above on why they aren't split out). */
  modLines: string[];
}

const RARITIES = ["Normal", "Magic", "Rare", "Unique"] as const;
const INFLUENCE_LINE = /^(Shaper|Elder|Crusader|Redeemer|Hunter|Warlord) Item$/;

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

  const item: ParsedItem = { raw: trimmed, corrupted: false, mirrored: false, influences: [], modLines: [] };
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
    for (let i = itemLevelBlockIndex + 1; i < blocks.length; i++) {
      const block = blocks[i];
      if (/^(Corrupted|Mirrored|Unidentified)$/.test(block) || /^Note:/.test(block) || isInfluenceOnlyBlock(block)) {
        continue;
      }
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !/^\{.*\}$/.test(l));
      item.modLines.push(...lines);
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
