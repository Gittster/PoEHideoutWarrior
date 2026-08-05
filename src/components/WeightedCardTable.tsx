"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLeague } from "@/lib/league-context";
import {
  loadBuyOverrides,
  loadCardLog,
  recordCardResult,
  resetCardLog,
  saveBuyOverrides,
  type BuyOverrideMap,
  type CardLogCounts,
} from "@/lib/arbitrage/weightedCardData";
import type { ArbitrageTechnique } from "@/lib/arbitrage/techniques";
import type { WeightedCardEntry, WeightedCardOutcome } from "@/lib/arbitrage/weightedCardRewards";
import type { PoeNinjaItem } from "@/lib/poeninja";
import { formatChaos } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { PriceHistoryModal } from "@/components/PriceHistoryModal";

const EMPTY_REWARDS: Record<string, WeightedCardEntry> = {};

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

interface OutcomeRow extends WeightedCardOutcome {
  probability: number;
  price: number | undefined;
  ninjaId: string;
  contribution: number | undefined;
}

function buildCardRow(
  cardName: string,
  entry: { stackSize: number; outcomes: WeightedCardOutcome[] },
  cardPrice: number,
  buyOverride: number | undefined,
  priceMap: Record<string, { chaosValue: number; ninjaId: string }>,
) {
  const buy = buyOverride ?? cardPrice;
  const stackCost = buy * entry.stackSize;
  const totalWeight = entry.outcomes.reduce((sum, o) => sum + o.weight, 0);

  const outcomeRows: OutcomeRow[] = entry.outcomes.map((o) => {
    const priceEntry = priceMap[o.rewardName.toLowerCase()];
    const price = priceEntry?.chaosValue;
    const probability = totalWeight > 0 ? o.weight / totalWeight : 0;
    const contribution = price !== undefined ? probability * o.rewardQuantity * price : undefined;
    return { ...o, probability, price, ninjaId: priceEntry?.ninjaId ?? "", contribution };
  });

  const allKnown = outcomeRows.every((o) => o.contribution !== undefined);
  const expectedValue = allKnown
    ? outcomeRows.reduce((sum, o) => sum + (o.contribution ?? 0), 0)
    : null;
  const margin = expectedValue === null ? null : expectedValue - stackCost;
  const marginPercent = margin === null ? null : stackCost > 0 ? (margin / stackCost) * 100 : 0;

  return { cardName, entry, buy, stackCost, outcomeRows, expectedValue, margin, marginPercent };
}

export function WeightedCardTable({ technique }: { technique: ArbitrageTechnique }) {
  const { league } = useLeague();
  return <WeightedCardTableForLeague key={league} technique={technique} league={league} />;
}

function WeightedCardTableForLeague({
  technique,
  league,
}: {
  technique: ArbitrageTechnique;
  league: string;
}) {
  const rewards = technique.weightedRewardConfig?.rewards ?? EMPTY_REWARDS;
  const [cardPrices, setCardPrices] = useState<Record<string, { chaosValue: number; ninjaId: string }>>(
    {},
  );
  const [outcomePrices, setOutcomePrices] = useState<
    Record<string, { chaosValue: number; ninjaId: string }>
  >({});
  const [historyTarget, setHistoryTarget] = useState<{
    category: string;
    itemId: string;
    itemName: string;
    rawId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [buyOverrides, setBuyOverrides] = useState<BuyOverrideMap>(() =>
    loadBuyOverrides(league, technique.slug),
  );
  const [logsByCard, setLogsByCard] = useState<Record<string, CardLogCounts>>(() => {
    const initial: Record<string, CardLogCounts> = {};
    for (const cardName of Object.keys(rewards)) {
      initial[cardName] = loadCardLog(league, technique.slug, cardName);
    }
    return initial;
  });
  const [pendingLogChoice, setPendingLogChoice] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    const outcomeCategories = [
      ...new Set(Object.values(rewards).flatMap((entry) => entry.outcomes.map((o) => o.category))),
    ];

    Promise.all([
      fetchCategory(technique.category, league),
      Promise.all(outcomeCategories.map((cat) => fetchCategory(cat, league).catch(() => []))),
    ])
      .then(([cardData, outcomeDataByCategory]) => {
        if (cancelled) return;
        const cardMap: Record<string, { chaosValue: number; ninjaId: string }> = {};
        for (const row of cardData) {
          cardMap[row.name] = { chaosValue: row.chaosValue, ninjaId: row.ninjaId };
        }
        setCardPrices(cardMap);

        const outcomeMap: Record<string, { chaosValue: number; ninjaId: string }> = {};
        for (const outcomeData of outcomeDataByCategory) {
          for (const row of outcomeData) {
            outcomeMap[row.name.toLowerCase()] = { chaosValue: row.chaosValue, ninjaId: row.ninjaId };
          }
        }
        setOutcomePrices(outcomeMap);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `rewards` is static per technique
  }, [league, technique]);

  const updateBuyOverride = (cardName: string, value: number) => {
    setBuyOverrides((prev) => {
      const merged = { ...prev, [cardName]: value };
      saveBuyOverrides(league, technique.slug, merged);
      return merged;
    });
  };

  const resetBuyOverride = (cardName: string) => {
    setBuyOverrides((prev) => {
      const merged = { ...prev };
      delete merged[cardName];
      saveBuyOverrides(league, technique.slug, merged);
      return merged;
    });
  };

  const logResult = (cardName: string) => {
    const choice = pendingLogChoice[cardName];
    if (!choice) return;
    const next = recordCardResult(league, technique.slug, cardName, choice);
    setLogsByCard((prev) => ({ ...prev, [cardName]: next }));
  };

  const clearLog = (cardName: string) => {
    resetCardLog(league, technique.slug, cardName);
    setLogsByCard((prev) => ({ ...prev, [cardName]: {} }));
  };

  const rows = useMemo(
    () =>
      Object.entries(rewards).map(([cardName, entry]) =>
        buildCardRow(
          cardName,
          entry,
          cardPrices[cardName]?.chaosValue ?? 0,
          buyOverrides[cardName],
          outcomePrices,
        ),
      ),
    [rewards, cardPrices, buyOverrides, outcomePrices],
  );

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading live prices for {league}...</p>;
  }
  if (error) {
    return (
      <p className="text-sm text-[var(--bad)]">
        {error}. Double check the league name on the{" "}
        <Link href="/config" className="underline">
          config page
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {rows.map((row) => {
        const cardPrice = cardPrices[row.cardName]?.chaosValue ?? 0;
        const cardNinjaId = cardPrices[row.cardName]?.ninjaId ?? "";
        const buySliderMax = Math.max(cardPrice * 2, 10);
        const log = logsByCard[row.cardName] ?? {};
        const totalLogged = Object.values(log).reduce((a, b) => a + b, 0);

        return (
          <div
            key={row.cardName}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <button
                  onClick={() =>
                    setHistoryTarget({
                      category: technique.category,
                      itemId: slugify(row.cardName),
                      itemName: row.cardName,
                      rawId: cardNinjaId,
                    })
                  }
                  className="text-base font-semibold underline decoration-dotted underline-offset-2 hover:text-[var(--accent)]"
                  title="View price history"
                >
                  {row.cardName}
                </button>
                <div className="text-xs text-[var(--muted)]">Market: {formatChaos(cardPrice)}c</div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--muted)]">Your cost per card (chaos)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={buySliderMax}
                    step={buySliderMax / 200}
                    value={row.buy}
                    onChange={(e) => updateBuyOverride(row.cardName, Number(e.target.value))}
                    className="w-24"
                  />
                  <input
                    type="number"
                    value={Number(row.buy.toFixed(2))}
                    onChange={(e) => updateBuyOverride(row.cardName, Number(e.target.value) || 0)}
                    className="w-20 rounded border border-[var(--border)] bg-[var(--surface-alt)] px-1 py-0.5 text-xs"
                  />
                  <button
                    onClick={() => resetBuyOverride(row.cardName)}
                    className="text-xs text-[var(--muted)] underline hover:text-[var(--foreground)]"
                  >
                    reset
                  </button>
                </div>
                <div className="text-xs text-[var(--muted)]">
                  Stack cost ({row.entry.stackSize}x): {formatChaos(row.stackCost)}c
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-[var(--muted)]">Expected value</div>
                <div className="text-base font-semibold">
                  {row.expectedValue === null ? "unavailable" : `${formatChaos(row.expectedValue)}c`}
                </div>
                <div className={`text-sm ${marginColorClass(row.margin)}`}>
                  {row.margin === null
                    ? "-"
                    : `${row.margin >= 0 ? "+" : ""}${formatChaos(row.margin)} (${
                        row.marginPercent !== null && row.marginPercent >= 0 ? "+" : ""
                      }${row.marginPercent?.toFixed(0)}%)`}
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted)]">
                    <th className="px-2 py-1 font-medium">Possible outcome</th>
                    <th className="px-2 py-1 font-medium">Weight</th>
                    <th className="px-2 py-1 font-medium">Probability</th>
                    <th className="px-2 py-1 font-medium">Live price</th>
                    <th className="px-2 py-1 font-medium">EV contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {row.outcomeRows.map((o) => (
                    <tr key={o.rewardName} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-2 py-1">
                        <button
                          onClick={() =>
                            setHistoryTarget({
                              category: o.category,
                              itemId: slugify(o.rewardName),
                              itemName: o.rewardName,
                              rawId: o.ninjaId,
                            })
                          }
                          className="underline decoration-dotted underline-offset-2 hover:text-[var(--accent)]"
                          title="View price history"
                        >
                          {o.rewardName}
                        </button>
                        {o.rewardQuantity > 1 && (
                          <span className="text-xs text-[var(--muted)]"> x{o.rewardQuantity}</span>
                        )}
                      </td>
                      <td className="px-2 py-1">{o.weight}</td>
                      <td className="px-2 py-1">{(o.probability * 100).toFixed(1)}%</td>
                      <td className="px-2 py-1">
                        {o.price !== undefined ? `${formatChaos(o.price)}c` : "unavailable"}
                      </td>
                      <td className="px-2 py-1">
                        {o.contribution !== undefined ? `${formatChaos(o.contribution)}c` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-[var(--border)] pt-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--muted)]">Log a result</label>
                <div className="flex items-center gap-2">
                  <select
                    value={pendingLogChoice[row.cardName] ?? ""}
                    onChange={(e) =>
                      setPendingLogChoice((prev) => ({ ...prev, [row.cardName]: e.target.value }))
                    }
                    className="rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">Select what you got...</option>
                    {row.entry.outcomes.map((o) => (
                      <option key={o.rewardName} value={o.rewardName}>
                        {o.rewardName}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => logResult(row.cardName)}
                    disabled={!pendingLogChoice[row.cardName]}
                    className="rounded-md border border-[var(--border)] px-3 py-1 text-xs hover:border-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-40"
                  >
                    Log
                  </button>
                </div>
              </div>

              <div className="ml-auto text-xs text-[var(--muted)]">
                {totalLogged === 0 ? (
                  "No results logged yet."
                ) : (
                  <>
                    Your results ({totalLogged}):{" "}
                    {row.entry.outcomes
                      .map((o) => {
                        const count = log[o.rewardName] ?? 0;
                        const pct = totalLogged > 0 ? ((count / totalLogged) * 100).toFixed(0) : "0";
                        return `${o.rewardName.replace("Divination Scarab of ", "")} ${count} (${pct}%)`;
                      })
                      .join(" | ")}{" "}
                    <button
                      onClick={() => clearLog(row.cardName)}
                      className="underline hover:text-[var(--foreground)]"
                    >
                      reset
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

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
