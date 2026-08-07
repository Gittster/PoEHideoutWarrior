"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLeague } from "@/lib/league-context";
import {
  appendReforgeSession,
  deleteReforgeSession,
  loadReforgeBuyPreview,
  loadReforgeSessions,
  reforgeCount as sessionReforgeCount,
  reforgeSessionCost,
  reforgeSessionProfit,
  reforgeSessionValue,
  saveReforgeBuyPreview,
  tallyFromReforgeSessions,
  totalReforgeProfit,
  type ReforgeLogCounts,
  type ReforgeSession,
} from "@/lib/arbitrage/deliriumReforgeData";
import type { ArbitrageTechnique } from "@/lib/arbitrage/techniques";
import type { PoeNinjaItem } from "@/lib/poeninja";
import { formatChaos } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { fetchCategory } from "@/lib/fetchCategory";
import { useCopyToClipboard } from "@/lib/useCopyToClipboard";
import { PriceHistoryModal } from "@/components/PriceHistoryModal";
import { ReforgeSessionModal } from "@/components/ReforgeSessionModal";

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
  ninjaId: string;
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
    return {
      name: item.name,
      price: item.chaosValue,
      ninjaId: item.ninjaId,
      timesLogged,
      probability,
      contribution,
    };
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
  const [historyTarget, setHistoryTarget] = useState<{
    category: string;
    itemId: string;
    itemName: string;
    rawId: string;
  } | null>(null);

  const [sessions, setSessions] = useState<ReforgeSession[]>(() => loadReforgeSessions(league, technique.slug));
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [buyPreview, setBuyPreview] = useState(() =>
    loadReforgeBuyPreview(league, technique.slug, { buy: 0, quantity: DEFAULT_QUANTITY }),
  );

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

  const log = useMemo(() => tallyFromReforgeSessions(sessions), [sessions]);
  const totalLogged = useMemo(() => Object.values(log).reduce((a, b) => a + b, 0), [log]);
  const outcomes = useMemo<OutcomeInfo[]>(() => (items ? computeOutcomes(items, log) : []), [items, log]);
  const evPerUnit = useMemo(() => computeEvPerUnit(outcomes, totalLogged), [outcomes, totalLogged]);

  // Flat fee per reforge operation - independent of stack size, so
  // rerolling a stack of 10 costs exactly the same as rerolling a stack of
  // 100.
  const ingredientCost =
    config && ingredientPrice !== undefined ? config.ingredientQuantity * ingredientPrice : undefined;

  const updateBuyPreview = (patch: Partial<{ buy: number; quantity: number }>) => {
    setBuyPreview((prev) => {
      const next = { ...prev, ...patch };
      saveReforgeBuyPreview(league, technique.slug, next);
      return next;
    });
  };

  const submitSession = (session: ReforgeSession) => {
    setSessions(appendReforgeSession(league, technique.slug, session));
    setSessionModalOpen(false);
  };

  const removeSession = (sessionId: string) => {
    setSessions(deleteReforgeSession(league, technique.slug, sessionId));
  };

  const allTimeProfit = useMemo(() => totalReforgeProfit(sessions), [sessions]);

  const stackCost = buyPreview.buy * buyPreview.quantity + (ingredientCost ?? 0);
  const evTotal = evPerUnit !== null ? evPerUnit * buyPreview.quantity : null;
  const margin = evTotal !== null ? evTotal - stackCost : null;
  const marginPercent = margin === null ? null : stackCost > 0 ? (margin / stackCost) * 100 : 0;

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
      {sessions.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="text-sm text-[var(--muted)]">
            All-time, across {sessions.length} logged session{sessions.length === 1 ? "" : "s"}
          </div>
          <div className={`text-lg font-semibold ${marginColorClass(allTimeProfit)}`}>
            {allTimeProfit >= 0 ? "+" : ""}
            {formatChaos(allTimeProfit)}c profit
          </div>
        </div>
      )}

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--muted)]">Your cost per orb (chaos)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={buyPreview.buy}
                onChange={(e) => updateBuyPreview({ buy: Number(e.target.value) || 0 })}
                className="w-20 rounded border border-[var(--border)] bg-[var(--surface-alt)] px-1 py-0.5 text-xs"
              />
              <span className="text-xs text-[var(--muted)]">x</span>
              <input
                type="number"
                min={1}
                value={buyPreview.quantity}
                onChange={(e) => updateBuyPreview({ quantity: Math.max(1, Number(e.target.value) || 1) })}
                className="w-16 rounded border border-[var(--border)] bg-[var(--surface-alt)] px-1 py-0.5 text-xs"
              />
              <span className="text-xs text-[var(--muted)]">orbs per reforge</span>
            </div>
            <div className="text-xs text-[var(--muted)]">
              {config?.ingredientName} ({config?.ingredientQuantity.toLocaleString()}x, flat per reforge):{" "}
              {ingredientCost !== undefined ? `${formatChaos(ingredientCost)}c` : "unknown"}
            </div>
            <div className="text-xs text-[var(--muted)]">Stack cost: {formatChaos(stackCost)}c</div>
          </div>

          <div className="text-right">
            <div className="text-xs text-[var(--muted)]">Expected value (batch)</div>
            <div className="text-base font-semibold">{evTotal === null ? "unavailable" : `${formatChaos(evTotal)}c`}</div>
            <div className={`text-sm ${marginColorClass(margin)}`}>
              {margin === null
                ? "-"
                : `${margin >= 0 ? "+" : ""}${formatChaos(margin)} (${
                    marginPercent !== null && marginPercent >= 0 ? "+" : ""
                  }${marginPercent?.toFixed(0)}%)`}
            </div>
            {totalLogged > 0 && <div className="text-xs text-[var(--muted)]">from {totalLogged} logged results</div>}
            <button
              onClick={() => setSessionModalOpen(true)}
              className="mt-2 rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            >
              Log a session
            </button>
          </div>
        </div>

        {totalLogged === 0 && (
          <p className="mt-3 text-xs text-[var(--bad)]">
            No odds are known yet - log a session below to start computing an expected value.
          </p>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted)]">
                <th className="px-2 py-1 font-medium">Possible outcome</th>
                <th className="px-2 py-1 font-medium">Times logged</th>
                <th className="px-2 py-1 font-medium">Your odds</th>
                <th className="px-2 py-1 font-medium">Live price</th>
                <th className="px-2 py-1 font-medium">EV contribution</th>
              </tr>
            </thead>
            <tbody>
              {outcomes.map((o) => (
                <tr key={o.name} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-2 py-1">
                    <button
                      onClick={() => {
                        copy(o.name, o.name);
                        setHistoryTarget({
                          category: technique.category,
                          itemId: slugify(o.name),
                          itemName: o.name,
                          rawId: o.ninjaId,
                        });
                      }}
                      className="underline decoration-dotted underline-offset-2 hover:text-[var(--accent)]"
                      title="Click to copy name, view price history"
                    >
                      {o.name}
                    </button>
                    {copiedKey === o.name && <span className="ml-1 text-xs text-[var(--good)]">Copied!</span>}
                  </td>
                  <td className="px-2 py-1">{o.timesLogged}</td>
                  <td className="px-2 py-1">
                    {o.probability === null ? "-" : `${(o.probability * 100).toFixed(1)}%`}
                  </td>
                  <td className="px-2 py-1">{formatChaos(o.price ?? 0)}c</td>
                  <td className="px-2 py-1">
                    {o.contribution !== undefined ? `${formatChaos(o.contribution)}c` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sessions.length > 0 && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Sessions ({sessions.length})</span>
              <span className={marginColorClass(allTimeProfit)}>
                {allTimeProfit >= 0 ? "+" : ""}
                {formatChaos(allTimeProfit)}c all-time
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                    <th className="px-2 py-1 font-medium">Logged</th>
                    <th className="px-2 py-1 font-medium">Reforges</th>
                    <th className="px-2 py-1 font-medium">Cost</th>
                    <th className="px-2 py-1 font-medium">Value</th>
                    <th className="px-2 py-1 font-medium">Profit</th>
                    <th className="px-2 py-1 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
                    const cost = reforgeSessionCost(session);
                    const value = reforgeSessionValue(session);
                    const profit = reforgeSessionProfit(session);
                    return (
                      <tr key={session.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-2 py-1">{new Date(session.timestamp).toLocaleString()}</td>
                        <td className="px-2 py-1">{sessionReforgeCount(session)}</td>
                        <td className="px-2 py-1">{formatChaos(cost)}c</td>
                        <td className="px-2 py-1">{formatChaos(value)}c</td>
                        <td className={`px-2 py-1 ${marginColorClass(profit)}`}>
                          {profit >= 0 ? "+" : ""}
                          {formatChaos(profit)}c
                        </td>
                        <td className="px-2 py-1">
                          <button
                            onClick={() => removeSession(session.id)}
                            className="text-[var(--muted)] underline hover:text-[var(--bad)]"
                          >
                            delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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

      {sessionModalOpen && (
        <ReforgeSessionModal
          defaultBuyPrice={buyPreview.buy}
          defaultIngredientCost={ingredientCost ?? 0}
          defaultQuantity={buyPreview.quantity}
          outcomes={outcomes.map((o) => ({ itemName: o.name, price: o.price }))}
          onSubmit={submitSession}
          onClose={() => setSessionModalOpen(false)}
        />
      )}
    </div>
  );
}
