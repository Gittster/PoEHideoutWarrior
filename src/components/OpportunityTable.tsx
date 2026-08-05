"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLeague } from "@/lib/league-context";
import {
  loadOverrides,
  loadThreshold,
  saveOverrides,
  saveThreshold,
  type OverrideMap,
} from "@/lib/arbitrage/overrides";
import type { ArbitrageTechnique } from "@/lib/arbitrage/techniques";
import type { PoeNinjaItem } from "@/lib/poeninja";
import { formatChaos } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { PriceHistoryModal } from "@/components/PriceHistoryModal";

const PAGE_SIZE = 40;

function marginColorClass(margin: number | null): string {
  if (margin === null) return "text-[var(--muted)]";
  if (margin > 0) return "text-[var(--good)]";
  if (margin < 0) return "text-[var(--bad)]";
  return "text-[var(--muted)]";
}

async function fetchCategory(category: string, league: string): Promise<PoeNinjaItem[]> {
  const res = await fetch(
    `/api/poeninja?category=${encodeURIComponent(category)}&league=${encodeURIComponent(league)}`,
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Failed to load prices");
  return body.items as PoeNinjaItem[];
}

function buildRow(
  item: PoeNinjaItem,
  overrides: OverrideMap,
  technique: ArbitrageTechnique,
  rewardPrices: Record<string, number>,
) {
  const reward = technique.rewardConfig?.rewards[item.name];
  // rewardPrice/sell are both PER UNIT of the reward item (mirrors `buy`
  // being per card, not per stack) - reward.rewardQuantity scales it up to
  // the full-stack payout, same as stackSize scales `buy` up to stack cost.
  const rewardPrice = reward ? rewardPrices[reward.rewardName.toLowerCase()] : undefined;
  const quantity = reward?.rewardQuantity ?? 1;
  const computedRewardValue = rewardPrice !== undefined ? rewardPrice * quantity : undefined;
  const stackSize = reward?.stackSize ?? 1;

  const override = overrides[item.id];
  const buy = override?.buy ?? item.chaosValue;
  // When a reward is defined but we have no live price for it AND the user
  // hasn't set one manually, there is no honest number to show - falling
  // back to the card's own price would silently produce a made-up margin
  // (that price has nothing to do with the reward). Leave it unpriced
  // instead: sell defaults to 0 and margin is null until a real value exists.
  const priceUnknown = Boolean(reward) && rewardPrice === undefined && override?.sell === undefined;
  const sell = override?.sell ?? rewardPrice ?? (reward ? 0 : item.chaosValue);
  const stackCost = buy * stackSize;
  const rewardTotal = sell * quantity;
  const margin = priceUnknown ? null : rewardTotal - stackCost;
  const marginPercent = margin === null ? null : stackCost > 0 ? (margin / stackCost) * 100 : 0;
  return {
    item,
    reward,
    computedRewardValue,
    priceUnknown,
    buy,
    sell,
    stackCost,
    rewardTotal,
    margin,
    marginPercent,
  };
}

export function OpportunityTable({ technique }: { technique: ArbitrageTechnique }) {
  const { league } = useLeague();
  // Keying on league forces a clean remount on league switch, so overrides
  // and thresholds can be lazily initialized from storage instead of synced
  // via an effect.
  return <OpportunityTableForLeague key={league} technique={technique} league={league} />;
}

function OpportunityTableForLeague({
  technique,
  league,
}: {
  technique: ArbitrageTechnique;
  league: string;
}) {
  const [items, setItems] = useState<PoeNinjaItem[] | null>(null);
  // Reward-item prices (e.g. Currency), only fetched when the technique has
  // a rewardConfig. Keyed by lowercased item name.
  const [rewardPrices, setRewardPrices] = useState<Record<string, number>>({});
  // The item currently shown in the price-history popup, or null if closed.
  const [historyTarget, setHistoryTarget] = useState<{
    category: string;
    itemId: string;
    itemName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // The parent page mounts this component with key={league}, so these lazy
  // initializers re-run fresh on every league switch instead of needing an
  // effect to re-sync them.
  const [overrides, setOverrides] = useState<OverrideMap>(() =>
    loadOverrides(league, technique.slug),
  );
  const [threshold, setThresholdState] = useState(() =>
    loadThreshold(league, technique.slug, technique.defaultThresholdPercent),
  );
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<"value" | "marginTotal" | "marginPercent">(
    "marginPercent",
  );
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Fetch live prices on mount (and if the technique's category ever changes).
  useEffect(() => {
    let cancelled = false;
    // Resetting loading/error at the start of each fetch is the standard
    // data-fetching-in-an-effect pattern; this effect is keyed to (re)mount
    // per league via the parent, so it isn't a runaway re-render loop.
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Rewards can live in several different poe.ninja categories (Currency,
    // Fragment, Essence, Fossil, ...) - fetch each one referenced, not just a
    // single hardcoded category.
    const rewardCategories = [
      ...new Set(Object.values(technique.rewardConfig?.rewards ?? {}).map((r) => r.category)),
    ];
    Promise.all([
      fetchCategory(technique.category, league),
      Promise.all(rewardCategories.map((cat) => fetchCategory(cat, league).catch(() => []))),
    ])
      .then(([data, rewardDataByCategory]) => {
        if (cancelled) return;
        setItems(data);
        const priceMap: Record<string, number> = {};
        for (const rewardData of rewardDataByCategory) {
          for (const row of rewardData) priceMap[row.name.toLowerCase()] = row.chaosValue;
        }
        setRewardPrices(priceMap);
        setVisibleCount(PAGE_SIZE);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setItems(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [league, technique]);

  const updateOverride = (id: string, next: OverrideMap[string]) => {
    setOverrides((prev) => {
      const merged = { ...prev, [id]: next };
      saveOverrides(league, technique.slug, merged);
      return merged;
    });
  };

  const resetOverride = (id: string) => {
    setOverrides((prev) => {
      const merged = { ...prev };
      delete merged[id];
      saveOverrides(league, technique.slug, merged);
      return merged;
    });
  };

  const updateThreshold = (value: number) => {
    setThresholdState(value);
    saveThreshold(league, technique.slug, value);
  };

  const hasRewardConfig = Boolean(technique.rewardConfig);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  // Row order is intentionally NOT recomputed when `overrides` changes: if it
  // were, dragging a slider on a margin-sorted table would move that row out
  // from under the pointer mid-drag. Order only refreshes when the item list,
  // search, sort mode, or prices change; values inside each row (below) still
  // update live.
  const orderedItems = useMemo(() => {
    const sorted = [...filteredItems];
    sorted.sort((a, b) => {
      if (sortMode === "value") return b.chaosValue - a.chaosValue;
      const rowA = buildRow(a, overrides, technique, rewardPrices);
      const rowB = buildRow(b, overrides, technique, rewardPrices);
      // Unpriced rows (margin === null) sort to the bottom rather than
      // breaking the comparator or clustering at either extreme.
      const valA = (sortMode === "marginTotal" ? rowA.margin : rowA.marginPercent) ?? -Infinity;
      const valB = (sortMode === "marginTotal" ? rowB.margin : rowB.marginPercent) ?? -Infinity;
      return valB - valA;
    });
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above: overrides is read but must not trigger a resort.
  }, [filteredItems, sortMode, technique, rewardPrices]);

  const rows = useMemo(
    () => orderedItems.map((item) => buildRow(item, overrides, technique, rewardPrices)),
    [orderedItems, overrides, technique, rewardPrices],
  );

  const visibleRows = rows.slice(0, visibleCount);
  const opportunityCount = rows.filter(
    (r) => r.margin !== null && r.margin > 0 && r.marginPercent !== null && r.marginPercent >= threshold,
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--muted)]">
            Opportunity threshold: {threshold.toFixed(0)}% margin
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={threshold}
            onChange={(e) => updateThreshold(Number(e.target.value))}
            className="w-48"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--muted)]">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name..."
            className="rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--muted)]">Sort by</label>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as "value" | "marginTotal" | "marginPercent")}
            className="rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
          >
            <option value="value">Market value</option>
            <option value="marginTotal">Margin (total)</option>
            <option value="marginPercent">Margin %</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-[var(--muted)]">
          <span className="font-medium text-[var(--good)]">{opportunityCount}</span> opportunities
          at or above threshold
        </div>
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
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)] text-left text-xs text-[var(--muted)]">
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 font-medium">Market (chaos)</th>
                {hasRewardConfig && <th className="px-3 py-2 font-medium">Reward</th>}
                <th className="px-3 py-2 font-medium">{technique.buyLabel}</th>
                <th className="px-3 py-2 font-medium">{technique.sellLabel}</th>
                <th className="px-3 py-2 font-medium">Margin</th>
                <th className="px-3 py-2 font-medium">Margin %</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(({ item, reward, computedRewardValue, priceUnknown, buy, sell, stackCost, rewardTotal, margin, marginPercent }) => {
                const isOpportunity = margin !== null && margin > 0 && marginPercent !== null && marginPercent >= threshold;
                const buySliderMax = Math.max(item.chaosValue * 2, 10);
                // Based on `sell` alone (not item.chaosValue) - sell is now a
                // per-unit reward price, which can be a very different scale
                // than the card's own price (e.g. 0.05c lifeforce vs a 22c card).
                const sellSliderMax = Math.max(sell * 2, 10);
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-[var(--border)] last:border-0 ${
                      isOpportunity ? "bg-[color-mix(in_srgb,var(--good)_12%,transparent)]" : ""
                    }`}
                  >
                    <td className="px-3 py-2">
                      <button
                        onClick={() =>
                          setHistoryTarget({
                            category: technique.category,
                            itemId: slugify(item.name),
                            itemName: item.name,
                          })
                        }
                        className="font-medium underline decoration-dotted underline-offset-2 hover:text-[var(--accent)]"
                        title="View price history"
                      >
                        {item.name}
                      </button>
                      {item.variant && (
                        <div className="text-xs text-[var(--muted)]">{item.variant}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatChaos(item.chaosValue)}</td>
                    {hasRewardConfig && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        {reward ? (
                          <>
                            <div>
                              {reward.stackSize > 1 ? `${reward.stackSize}x stack -> ` : ""}
                              {reward.rewardQuantity}x{" "}
                              <button
                                onClick={() =>
                                  setHistoryTarget({
                                    category: reward.category,
                                    itemId: slugify(reward.rewardName),
                                    itemName: reward.rewardName,
                                  })
                                }
                                className="underline decoration-dotted underline-offset-2 hover:text-[var(--accent)]"
                                title="View price history"
                              >
                                {reward.rewardName}
                              </button>
                            </div>
                            <div className="text-xs text-[var(--muted)]">
                              {computedRewardValue !== undefined
                                ? `≈ ${formatChaos(computedRewardValue)}c`
                                : "price unavailable"}
                            </div>
                          </>
                        ) : (
                          <span className="text-[var(--muted)]">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={buySliderMax}
                          step={buySliderMax / 200}
                          value={buy}
                          onChange={(e) =>
                            updateOverride(item.id, { buy: Number(e.target.value), sell })
                          }
                          className="w-16"
                        />
                        <input
                          type="number"
                          value={Number(buy.toFixed(2))}
                          onChange={(e) =>
                            updateOverride(item.id, { buy: Number(e.target.value) || 0, sell })
                          }
                          className="w-24 rounded border border-[var(--border)] bg-[var(--surface-alt)] px-1 py-0.5 text-xs"
                        />
                      </div>
                      {reward && reward.stackSize > 1 && (
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          Stack cost ({reward.stackSize}x): {formatChaos(stackCost)}c
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={sellSliderMax}
                          step={sellSliderMax / 200}
                          value={sell}
                          onChange={(e) =>
                            updateOverride(item.id, { buy, sell: Number(e.target.value) })
                          }
                          className="w-16"
                        />
                        <input
                          type="number"
                          value={Number(sell.toFixed(2))}
                          onChange={(e) =>
                            updateOverride(item.id, { buy, sell: Number(e.target.value) || 0 })
                          }
                          className="w-24 rounded border border-[var(--border)] bg-[var(--surface-alt)] px-1 py-0.5 text-xs"
                        />
                      </div>
                      {reward && priceUnknown && (
                        <div className="mt-1 text-xs text-[var(--bad)]">
                          No live price for this reward - set one to compute margin
                        </div>
                      )}
                      {reward && !priceUnknown && reward.rewardQuantity > 1 && (
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          Reward total ({reward.rewardQuantity}x): {formatChaos(rewardTotal)}c
                        </div>
                      )}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${marginColorClass(margin)}`}>
                      {margin === null ? "-" : `${margin >= 0 ? "+" : ""}${formatChaos(margin)}`}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${marginColorClass(margin)}`}>
                      {marginPercent === null ? "-" : `${marginPercent >= 0 ? "+" : ""}${marginPercent.toFixed(0)}%`}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => resetOverride(item.id)}
                        className="text-xs text-[var(--muted)] underline hover:text-[var(--foreground)]"
                      >
                        reset
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="text-sm text-[var(--muted)]">No items matched.</p>
      )}

      {visibleCount < rows.length && (
        <button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="self-start rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
        >
          Show more ({rows.length - visibleCount} remaining)
        </button>
      )}

      {historyTarget && (
        <PriceHistoryModal
          category={historyTarget.category}
          itemId={historyTarget.itemId}
          itemName={historyTarget.itemName}
          league={league}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  );
}
