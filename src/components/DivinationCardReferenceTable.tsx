"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLeague } from "@/lib/league-context";
import { DIVINATION_CARD_REWARDS } from "@/lib/arbitrage/divinationCardRewards";
import { WEIGHTED_CARD_REWARDS } from "@/lib/arbitrage/weightedCardRewards";
import { DIVINATION_CARD_GOLD_COSTS } from "@/lib/arbitrage/goldCosts";
import { techniqueSlugForCard } from "@/lib/arbitrage/cardTechnique";
import type { PoeNinjaItem } from "@/lib/poeninja";
import { formatChaos } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { useCopyToClipboard } from "@/lib/useCopyToClipboard";
import { useFavorites } from "@/lib/useFavorites";
import { downloadCsv } from "@/lib/csv";
import { PriceHistoryModal } from "@/components/PriceHistoryModal";
import { FavoriteButton } from "@/components/FavoriteButton";

async function fetchDivinationCards(league: string): Promise<PoeNinjaItem[]> {
  const res = await fetch(
    `/api/poeninja?category=DivinationCard&league=${encodeURIComponent(league)}`,
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Failed to load prices");
  return body.items as PoeNinjaItem[];
}

function rewardDisplay(cardName: string): { text: string; mapped: boolean } {
  const single = DIVINATION_CARD_REWARDS[cardName];
  if (single) {
    return { text: `${single.rewardQuantity}x ${single.rewardName}`, mapped: true };
  }
  const weighted = WEIGHTED_CARD_REWARDS[cardName];
  if (weighted) {
    const names = weighted.outcomes.map((o) => o.rewardName).join(", ");
    return { text: `${weighted.outcomes.length} possible: ${names}`, mapped: true };
  }
  return { text: "unmapped", mapped: false };
}

function stackSizeFor(cardName: string): number | undefined {
  return DIVINATION_CARD_REWARDS[cardName]?.stackSize ?? WEIGHTED_CARD_REWARDS[cardName]?.stackSize;
}

export function DivinationCardReferenceTable() {
  const { league } = useLeague();
  return <DivinationCardReferenceTableForLeague key={league} league={league} />;
}

function DivinationCardReferenceTableForLeague({ league }: { league: string }) {
  const [items, setItems] = useState<PoeNinjaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [missingRewardOnly, setMissingRewardOnly] = useState(false);
  const [missingGoldOnly, setMissingGoldOnly] = useState(false);
  const [sortMode, setSortMode] = useState<"name" | "value">("name");
  const { copiedKey, copy } = useCopyToClipboard();
  const { toggle: toggleFavorite, isFavorite } = useFavorites();
  const [historyTarget, setHistoryTarget] = useState<{
    category: string;
    itemId: string;
    itemName: string;
    rawId: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    fetchDivinationCards(league)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [league]);

  const rows = useMemo(() => {
    if (!items) return [];
    const term = search.trim().toLowerCase();
    const withRewards = items.map((item) => {
      const reward = rewardDisplay(item.name);
      const stackSize = stackSizeFor(item.name);
      const goldCost = DIVINATION_CARD_GOLD_COSTS[item.name];
      return { item, reward, stackSize, goldCost };
    });

    const filtered = withRewards.filter((row) => {
      if (missingRewardOnly && row.reward.mapped) return false;
      if (missingGoldOnly && row.goldCost !== undefined) return false;
      if (!term) return true;
      return (
        row.item.name.toLowerCase().includes(term) || row.reward.text.toLowerCase().includes(term)
      );
    });

    filtered.sort((a, b) => {
      if (sortMode === "value") return b.item.chaosValue - a.item.chaosValue;
      return a.item.name.localeCompare(b.item.name);
    });

    return filtered;
  }, [items, search, missingRewardOnly, missingGoldOnly, sortMode]);

  const mappedRewardCount = items?.filter((i) => rewardDisplay(i.name).mapped).length ?? 0;
  const mappedGoldCount = items?.filter((i) => DIVINATION_CARD_GOLD_COSTS[i.name] !== undefined).length ?? 0;

  // Exports the full live card list (not just the filtered/visible rows) so
  // it's a complete worksheet to fill in gold costs against offline, then
  // hand back to update goldCosts.ts with.
  const exportCsv = () => {
    if (!items) return;
    const header = ["Card Name", "Stack Size", "Reward", "Cost per Card (chaos)", "Gold Cost"];
    const dataRows = items
      .map((item) => {
        const reward = rewardDisplay(item.name);
        const stackSize = stackSizeFor(item.name);
        const goldCost = DIVINATION_CARD_GOLD_COSTS[item.name];
        return [
          item.name,
          stackSize ?? "",
          reward.text,
          item.chaosValue,
          goldCost ?? "",
        ];
      })
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    downloadCsv(`divination-card-gold-costs-${league}.csv`, [header, ...dataRows]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--muted)]">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by card or reward name..."
            className="rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--muted)]">Sort by</label>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as "name" | "value")}
            className="rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
          >
            <option value="name">Card name</option>
            <option value="value">Market value</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={missingRewardOnly}
            onChange={(e) => setMissingRewardOnly(e.target.checked)}
          />
          Missing reward only
        </label>

        <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={missingGoldOnly}
            onChange={(e) => setMissingGoldOnly(e.target.checked)}
          />
          Missing gold cost only
        </label>

        {items && (
          <>
            <button
              onClick={exportCsv}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            >
              Export CSV
            </button>
            <div className="ml-auto text-sm text-[var(--muted)]">
              <span className="font-medium text-[var(--foreground)]">{mappedRewardCount}</span>/
              {items.length} rewards mapped, <span className="font-medium text-[var(--foreground)]">{mappedGoldCount}</span>/
              {items.length} gold costs known
            </div>
          </>
        )}
      </div>

      {loading && <p className="text-sm text-[var(--muted)]">Loading live prices for {league}...</p>}
      {error && (
        <p className="text-sm text-[var(--bad)]">
          {error}. Double check the league name on the{" "}
          <Link href="/config" className="underline">
            config page
          </Link>
          .
        </p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="scroll-x-visible overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)] text-left text-xs text-[var(--muted)]">
                <th className="px-3 py-2 font-medium">Card</th>
                <th className="px-3 py-2 font-medium">Stack size</th>
                <th className="px-3 py-2 font-medium">Reward</th>
                <th className="px-3 py-2 font-medium">Cost per card (chaos)</th>
                <th className="px-3 py-2 font-medium">Gold cost</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ item, reward, stackSize, goldCost }) => (
                <tr key={item.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-2">
                    <FavoriteButton
                      active={isFavorite(techniqueSlugForCard(item.name), item.name)}
                      onClick={() =>
                        toggleFavorite({
                          techniqueSlug: techniqueSlugForCard(item.name),
                          itemName: item.name,
                        })
                      }
                    />{" "}
                    <button
                      onClick={() => {
                        copy(item.id, item.name);
                        setHistoryTarget({
                          category: "DivinationCard",
                          itemId: slugify(item.name),
                          itemName: item.name,
                          rawId: item.ninjaId,
                        });
                      }}
                      className="font-medium underline decoration-dotted underline-offset-2 hover:text-[var(--accent)]"
                      title="Click to copy name, view price history"
                    >
                      {item.name}
                    </button>
                    {copiedKey === item.id && (
                      <span className="ml-1 text-xs text-[var(--good)]">Copied!</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{stackSize ?? "-"}</td>
                  <td className={`px-3 py-2 ${reward.mapped ? "" : "text-[var(--muted)]"}`}>
                    {reward.text}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatChaos(item.chaosValue)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-[var(--muted)]">
                    {goldCost === undefined ? "unknown" : goldCost.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="text-sm text-[var(--muted)]">No cards matched.</p>
      )}

      {historyTarget && (
        <PriceHistoryModal
          category={historyTarget.category}
          itemId={historyTarget.itemId}
          itemName={historyTarget.itemName}
          rawId={historyTarget.rawId}
          league={league}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  );
}
