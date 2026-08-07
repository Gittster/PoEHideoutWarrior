"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLeague } from "@/lib/league-context";
import { ARBITRAGE_TECHNIQUES, type ArbitrageTechnique } from "@/lib/arbitrage/techniques";
import { loadOverrides } from "@/lib/arbitrage/overrides";
import { loadBuyOverrides, loadCardLog } from "@/lib/arbitrage/weightedCardData";
import { loadReforgeLog, loadReforgeOverrides } from "@/lib/arbitrage/deliriumReforgeData";
import { goldCostLookupFor } from "@/lib/arbitrage/goldCosts";
import { fetchCategory } from "@/lib/fetchCategory";
import { formatChaos } from "@/lib/format";
import { favoriteKey } from "@/lib/favorites";
import { useFavorites } from "@/lib/useFavorites";
import { buildRow } from "@/components/OpportunityTable";
import { buildCardRow } from "@/components/WeightedCardTable";
import { buildReforgeRow, computeEvPerUnit, computeOutcomes } from "@/components/DeliriumReforgeTable";
import { FavoriteButton } from "@/components/FavoriteButton";

interface DashboardRow {
  techniqueSlug: string;
  techniqueTitle: string;
  itemName: string;
  chaosValue: number;
  margin: number | null;
  marginPercent: number | null;
}

type PriceMap = Record<string, { chaosValue: number; ninjaId: string }>;

// Recomputes every row for one technique using the exact same row-building
// logic (and the user's own saved overrides/logs) as that technique's own
// page - the dashboard is a live re-derivation, not a cache of stale numbers.
async function computeTechniqueRows(
  technique: ArbitrageTechnique,
  league: string,
): Promise<DashboardRow[]> {
  const goldLookup = goldCostLookupFor(technique.goldCostSource);

  if (technique.harvestReforgeConfig) {
    const config = technique.harvestReforgeConfig;
    const [items, ingredientData] = await Promise.all([
      fetchCategory(technique.category, league),
      fetchCategory(config.ingredientCategory, league).catch(() => []),
    ]);
    const ingredient = ingredientData.find((i) => i.name === config.ingredientName);
    const ingredientCostPerUnit =
      ingredient !== undefined
        ? (config.ingredientQuantity / config.referenceStackSize) * ingredient.chaosValue
        : undefined;
    const log = loadReforgeLog(league, technique.slug);
    const totalLogged = Object.values(log).reduce((a, b) => a + b, 0);
    const outcomes = computeOutcomes(items, log);
    const evPerUnit = computeEvPerUnit(outcomes, totalLogged);
    const overrides = loadReforgeOverrides(league, technique.slug);

    return items.map((item) => {
      const row = buildReforgeRow(item, overrides[item.name], ingredientCostPerUnit, evPerUnit);
      return {
        techniqueSlug: technique.slug,
        techniqueTitle: technique.title,
        itemName: item.name,
        chaosValue: item.chaosValue,
        margin: row.margin,
        marginPercent: row.marginPercent,
      };
    });
  }

  if (technique.weightedRewardConfig) {
    const rewards = technique.weightedRewardConfig.rewards;
    const outcomeCategories = [
      ...new Set(Object.values(rewards).flatMap((entry) => entry.outcomes.map((o) => o.category))),
    ];
    const [cardData, outcomeDataByCategory] = await Promise.all([
      fetchCategory(technique.category, league),
      Promise.all(outcomeCategories.map((cat) => fetchCategory(cat, league).catch(() => []))),
    ]);
    const cardPrices: PriceMap = {};
    for (const row of cardData) cardPrices[row.name] = { chaosValue: row.chaosValue, ninjaId: row.ninjaId };
    const outcomePrices: PriceMap = {};
    for (const outcomeData of outcomeDataByCategory) {
      for (const row of outcomeData) {
        outcomePrices[row.name.toLowerCase()] = { chaosValue: row.chaosValue, ninjaId: row.ninjaId };
      }
    }
    const buyOverrides = loadBuyOverrides(league, technique.slug);

    return Object.entries(rewards).map(([cardName, entry]) => {
      const log = loadCardLog(league, technique.slug, cardName);
      const cardPrice = cardPrices[cardName]?.chaosValue ?? 0;
      const row = buildCardRow(cardName, entry, cardPrice, buyOverrides[cardName], outcomePrices, log, goldLookup);
      return {
        techniqueSlug: technique.slug,
        techniqueTitle: technique.title,
        itemName: cardName,
        chaosValue: cardPrice,
        margin: row.margin,
        marginPercent: row.marginPercent,
      };
    });
  }

  const rewardCategories = [
    ...new Set(Object.values(technique.rewardConfig?.rewards ?? {}).map((r) => r.category)),
  ];
  const [items, rewardDataByCategory] = await Promise.all([
    fetchCategory(technique.category, league),
    Promise.all(rewardCategories.map((cat) => fetchCategory(cat, league).catch(() => []))),
  ]);
  const rewardPrices: PriceMap = {};
  for (const rewardData of rewardDataByCategory) {
    for (const row of rewardData) {
      rewardPrices[row.name.toLowerCase()] = { chaosValue: row.chaosValue, ninjaId: row.ninjaId };
    }
  }
  const overrides = loadOverrides(league, technique.slug);

  return items.map((item) => {
    const row = buildRow(item, overrides, technique, rewardPrices);
    return {
      techniqueSlug: technique.slug,
      techniqueTitle: technique.title,
      itemName: item.name,
      chaosValue: item.chaosValue,
      margin: row.margin,
      marginPercent: row.marginPercent,
    };
  });
}

function marginColorClass(margin: number | null): string {
  if (margin === null) return "text-[var(--muted)]";
  if (margin > 0) return "text-[var(--good)]";
  if (margin < 0) return "text-[var(--bad)]";
  return "text-[var(--muted)]";
}

export function Dashboard() {
  const { league } = useLeague();
  return <DashboardForLeague key={league} league={league} />;
}

function DashboardForLeague({ league }: { league: string }) {
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [allFailed, setAllFailed] = useState(false);
  const { favorites, toggle: toggleFavorite } = useFavorites();

  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setAllFailed(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    Promise.allSettled(ARBITRAGE_TECHNIQUES.map((t) => computeTechniqueRows(t, league))).then((results) => {
      if (cancelled) return;
      const flattened = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
      setRows(flattened);
      setAllFailed(results.every((r) => r.status === "rejected"));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [league]);

  const favoriteRows = useMemo(
    () => rows.filter((r) => favoriteKey(r.techniqueSlug, r.itemName) in favorites),
    [rows, favorites],
  );

  const bestReturns = useMemo(
    () =>
      [...rows]
        .filter((r) => r.margin !== null && r.margin > 0)
        .sort((a, b) => (b.margin ?? 0) - (a.margin ?? 0))
        .slice(0, 10),
    [rows],
  );

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading dashboard for {league}...</p>;
  }

  if (allFailed) {
    return (
      <p className="text-sm text-[var(--bad)]">
        Couldn&apos;t load prices for any technique. Double check the league name on the{" "}
        <Link href="/config" className="underline">
          config page
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-[var(--accent)]">Your favorites</h2>
        {favoriteRows.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No favorites yet - star an item on any Arbitrage page or the Card Reference page to pin
            it here.
          </p>
        ) : (
          <DashboardTable rows={favoriteRows} favorites={favorites} onToggleFavorite={toggleFavorite} />
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-[var(--accent)]">Best chaos returns right now</h2>
        {bestReturns.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No priced opportunities found.</p>
        ) : (
          <DashboardTable rows={bestReturns} favorites={favorites} onToggleFavorite={toggleFavorite} />
        )}
      </section>
    </div>
  );
}

function DashboardTable({
  rows,
  favorites,
  onToggleFavorite,
}: {
  rows: DashboardRow[];
  favorites: Record<string, unknown>;
  onToggleFavorite: (item: { techniqueSlug: string; itemName: string }) => void;
}) {
  return (
    <div className="scroll-x-visible overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface-alt)] text-left text-xs text-[var(--muted)]">
            <th className="px-3 py-2 font-medium">Item</th>
            <th className="px-3 py-2 font-medium">Technique</th>
            <th className="px-3 py-2 font-medium">Market (chaos)</th>
            <th className="px-3 py-2 font-medium">Margin</th>
            <th className="px-3 py-2 font-medium">Margin %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.techniqueSlug}:${r.itemName}`} className="border-b border-[var(--border)] last:border-0">
              <td className="px-3 py-2">
                <FavoriteButton
                  active={favoriteKey(r.techniqueSlug, r.itemName) in favorites}
                  onClick={() => onToggleFavorite({ techniqueSlug: r.techniqueSlug, itemName: r.itemName })}
                />{" "}
                <span className="font-medium">{r.itemName}</span>
              </td>
              <td className="px-3 py-2">
                <Link
                  href={`/arbitrage/${r.techniqueSlug}`}
                  className="underline decoration-dotted underline-offset-2 hover:text-[var(--accent)]"
                >
                  {r.techniqueTitle}
                </Link>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{formatChaos(r.chaosValue)}</td>
              <td className={`px-3 py-2 whitespace-nowrap ${marginColorClass(r.margin)}`}>
                {r.margin === null ? "-" : `${r.margin >= 0 ? "+" : ""}${formatChaos(r.margin)}`}
              </td>
              <td className={`px-3 py-2 whitespace-nowrap ${marginColorClass(r.margin)}`}>
                {r.marginPercent === null
                  ? "-"
                  : `${r.marginPercent >= 0 ? "+" : ""}${r.marginPercent.toFixed(0)}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
