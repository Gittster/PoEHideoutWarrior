"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLeague } from "@/lib/league-context";
import {
  loadReforgeLog,
  loadReforgeOverrides,
  recordReforgeResult,
  resetReforgeLog,
  saveReforgeOverrides,
  type ReforgeLogCounts,
  type ReforgeOverrideMap,
} from "@/lib/arbitrage/deliriumReforgeData";
import type { ArbitrageTechnique } from "@/lib/arbitrage/techniques";
import type { PoeNinjaItem } from "@/lib/poeninja";
import { formatChaos } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { fetchCategory } from "@/lib/fetchCategory";
import { useCopyToClipboard } from "@/lib/useCopyToClipboard";
import { useFavorites } from "@/lib/useFavorites";
import { PriceHistoryModal } from "@/components/PriceHistoryModal";
import { FavoriteButton } from "@/components/FavoriteButton";

const DEFAULT_QUANTITY = 20;

function marginColorClass(margin: number | null): string {
  if (margin === null) return "text-[var(--muted)]";
  if (margin > 0) return "text-[var(--good)]";
  if (margin < 0) return "text-[var(--bad)]";
  return "text-[var(--muted)]";
}

interface OutcomeInfo {
  name: string;
  price: number | undefined;
  timesLogged: number;
  probability: number | null;
  contribution: number | undefined;
}

// Pure computation helpers, exported so the dashboard can recompute the same
// numbers for favorited/best-return rows without duplicating this logic.
export function computeOutcomes(items: PoeNinjaItem[], log: ReforgeLogCounts): OutcomeInfo[] {
  const totalLogged = Object.values(log).reduce((a, b) => a + b, 0);
  return items.map((item) => {
    const timesLogged = log[item.name] ?? 0;
    const probability = totalLogged > 0 ? timesLogged / totalLogged : null;
    const contribution = probability !== null ? probability * item.chaosValue : undefined;
    return { name: item.name, price: item.chaosValue, timesLogged, probability, contribution };
  });
}

export function computeEvPerUnit(outcomes: OutcomeInfo[], totalLogged: number): number | null {
  if (totalLogged === 0) return null;
  const observed = outcomes.filter((o) => o.timesLogged > 0);
  const allKnown = observed.every((o) => o.contribution !== undefined);
  if (!allKnown) return null;
  return outcomes.reduce((sum, o) => sum + (o.contribution ?? 0), 0);
}

export function buildReforgeRow(
  item: PoeNinjaItem,
  override: { buy: number; quantity: number } | undefined,
  ingredientCost: number | undefined,
  evPerUnit: number | null,
) {
  const buy = override?.buy ?? item.chaosValue;
  const quantity = override?.quantity ?? DEFAULT_QUANTITY;
  const stackCost = buy * quantity;
  const totalCost = ingredientCost !== undefined ? stackCost + ingredientCost : undefined;
  const evTotal = evPerUnit !== null ? evPerUnit * quantity : null;
  const margin = totalCost !== undefined && evTotal !== null ? evTotal - totalCost : null;
  const marginPercent = margin === null ? null : totalCost! > 0 ? (margin / totalCost!) * 100 : 0;
  return { item, buy, quantity, stackCost, totalCost, evTotal, margin, marginPercent };
}

export function DeliriumReforgeTable({ technique }: { technique: ArbitrageTechnique }) {
  const { league } = useLeague();
  return <DeliriumReforgeTableForLeague key={league} technique={technique} league={league} />;
}

function DeliriumReforgeTableForLeague({
  technique,
  league,
}: {
  technique: ArbitrageTechnique;
  league: string;
}) {
  const config = technique.harvestReforgeConfig;
  const [items, setItems] = useState<PoeNinjaItem[] | null>(null);
  const [ingredientPrice, setIngredientPrice] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { copiedKey, copy } = useCopyToClipboard();
  const { toggle: toggleFavorite, isFavorite } = useFavorites();

  const [overrides, setOverrides] = useState<ReforgeOverrideMap>(() =>
    loadReforgeOverrides(league, technique.slug),
  );
  const [log, setLog] = useState<ReforgeLogCounts>(() => loadReforgeLog(league, technique.slug));
  const [pendingOutcome, setPendingOutcome] = useState("");
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

    Promise.all([
      fetchCategory(technique.category, league),
      config ? fetchCategory(config.ingredientCategory, league).catch(() => []) : Promise.resolve([]),
    ])
      .then(([data, ingredientData]) => {
        if (cancelled) return;
        setItems(data);
        const ingredient = config
          ? ingredientData.find((i) => i.name === config.ingredientName)
          : undefined;
        setIngredientPrice(ingredient?.chaosValue);
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
  }, [league, technique, config]);

  const updateOverride = (itemName: string, next: ReforgeOverrideMap[string]) => {
    setOverrides((prev) => {
      const merged = { ...prev, [itemName]: next };
      saveReforgeOverrides(league, technique.slug, merged);
      return merged;
    });
  };

  const resetOverride = (itemName: string) => {
    setOverrides((prev) => {
      const merged = { ...prev };
      delete merged[itemName];
      saveReforgeOverrides(league, technique.slug, merged);
      return merged;
    });
  };

  const logResult = () => {
    if (!pendingOutcome) return;
    const next = recordReforgeResult(league, technique.slug, pendingOutcome);
    setLog(next);
  };

  const clearLog = () => {
    resetReforgeLog(league, technique.slug);
    setLog({});
  };

  const totalLogged = useMemo(() => Object.values(log).reduce((a, b) => a + b, 0), [log]);

  const outcomes = useMemo<OutcomeInfo[]>(() => (items ? computeOutcomes(items, log) : []), [items, log]);

  const evPerUnit = useMemo(
    () => computeEvPerUnit(outcomes, totalLogged),
    [outcomes, totalLogged],
  );

  const ingredientCost =
    config && ingredientPrice !== undefined ? config.ingredientQuantity * ingredientPrice : undefined;

  const rows = useMemo(() => {
    if (!items) return [];
    return items.map((item) => buildReforgeRow(item, overrides[item.name], ingredientCost, evPerUnit));
  }, [items, overrides, ingredientCost, evPerUnit]);

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
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-[var(--muted)]">
            {config?.ingredientName} cost per reforge ({config?.ingredientQuantity.toLocaleString()}x):{" "}
            <span className="font-medium text-[var(--foreground)]">
              {ingredientCost !== undefined ? `${formatChaos(ingredientCost)}c` : "unknown"}
            </span>
          </div>
          <div className="text-sm text-[var(--muted)]">
            Expected value per orb reforged:{" "}
            <span className="font-medium text-[var(--foreground)]">
              {evPerUnit === null ? "unavailable" : `${formatChaos(evPerUnit)}c`}
            </span>
            {totalLogged > 0 && <span> (from {totalLogged} logged results)</span>}
          </div>
        </div>

        {totalLogged === 0 && (
          <p className="mt-3 text-xs text-[var(--bad)]">
            No odds are known yet - log a reforge result below to start computing an expected value.
          </p>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted)]">
                <th className="px-2 py-1 font-medium">Possible outcome</th>
                <th className="px-2 py-1 font-medium">Times logged</th>
                <th className="px-2 py-1 font-medium">Your odds</th>
                <th className="px-2 py-1 font-medium">Live price</th>
              </tr>
            </thead>
            <tbody>
              {outcomes.map((o) => (
                <tr key={o.name} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-2 py-1">{o.name}</td>
                  <td className="px-2 py-1">{o.timesLogged}</td>
                  <td className="px-2 py-1">
                    {o.probability === null ? "-" : `${(o.probability * 100).toFixed(1)}%`}
                  </td>
                  <td className="px-2 py-1">{formatChaos(o.price ?? 0)}c</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-[var(--border)] pt-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted)]">Log a reforge result</label>
            <div className="flex items-center gap-2">
              <select
                value={pendingOutcome}
                onChange={(e) => setPendingOutcome(e.target.value)}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
              >
                <option value="">Select what you got...</option>
                {outcomes.map((o) => (
                  <option key={o.name} value={o.name}>
                    {o.name}
                  </option>
                ))}
              </select>
              <button
                onClick={logResult}
                disabled={!pendingOutcome}
                className="rounded-md border border-[var(--border)] px-3 py-1 text-xs hover:border-[var(--accent)] hover:text-[var(--foreground)] disabled:opacity-40"
              >
                Log
              </button>
            </div>
          </div>
          {totalLogged > 0 && (
            <button
              onClick={clearLog}
              className="ml-auto text-xs text-[var(--muted)] underline hover:text-[var(--foreground)]"
            >
              Reset log ({totalLogged} results)
            </button>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="scroll-x-visible overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)] text-left text-xs text-[var(--muted)]">
                <th className="px-3 py-2 font-medium">Orb</th>
                <th className="px-3 py-2 font-medium">Market (chaos)</th>
                <th className="px-3 py-2 font-medium">{technique.buyLabel}</th>
                <th className="px-3 py-2 font-medium">Quantity</th>
                <th className="px-3 py-2 font-medium">Total cost</th>
                <th className="px-3 py-2 font-medium">Expected value (batch)</th>
                <th className="px-3 py-2 font-medium">Margin</th>
                <th className="px-3 py-2 font-medium">Margin %</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ item, buy, quantity, stackCost, totalCost, evTotal, margin, marginPercent }) => {
                const buySliderMax = Math.max(item.chaosValue * 2, 10);
                return (
                  <tr key={item.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-3 py-2">
                      <FavoriteButton
                        active={isFavorite(technique.slug, item.name)}
                        onClick={() => toggleFavorite({ techniqueSlug: technique.slug, itemName: item.name })}
                      />{" "}
                      <button
                        onClick={() => {
                          copy(item.id, item.name);
                          setHistoryTarget({
                            category: technique.category,
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
                    <td className="px-3 py-2 whitespace-nowrap">{formatChaos(item.chaosValue)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={buySliderMax}
                          step={buySliderMax / 200}
                          value={buy}
                          onChange={(e) =>
                            updateOverride(item.name, { buy: Number(e.target.value), quantity })
                          }
                          className="w-16"
                        />
                        <input
                          type="number"
                          value={Number(buy.toFixed(2))}
                          onChange={(e) =>
                            updateOverride(item.name, { buy: Number(e.target.value) || 0, quantity })
                          }
                          className="w-20 rounded border border-[var(--border)] bg-[var(--surface-alt)] px-1 py-0.5 text-xs"
                        />
                      </div>
                      <div className="mt-1 text-xs text-[var(--muted)]">
                        Stack cost: {formatChaos(stackCost)}c
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={quantity}
                        onChange={(e) =>
                          updateOverride(item.name, { buy, quantity: Math.max(1, Number(e.target.value) || 1) })
                        }
                        className="w-20 rounded border border-[var(--border)] bg-[var(--surface-alt)] px-1 py-0.5 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {totalCost === undefined ? "unknown" : `${formatChaos(totalCost)}c`}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {evTotal === null ? "unavailable" : `${formatChaos(evTotal)}c`}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${marginColorClass(margin)}`}>
                      {margin === null ? "-" : `${margin >= 0 ? "+" : ""}${formatChaos(margin)}`}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap ${marginColorClass(margin)}`}>
                      {marginPercent === null ? "-" : `${marginPercent >= 0 ? "+" : ""}${marginPercent.toFixed(0)}%`}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => resetOverride(item.name)}
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
