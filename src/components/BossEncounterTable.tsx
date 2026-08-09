"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLeague } from "@/lib/league-context";
import {
  appendBossSession,
  bossSessionCost,
  bossSessionProfit,
  bossSessionValue,
  deleteBossSession,
  loadBossSessions,
  tallyBossOutcomes,
  totalBossProfit,
  totalFightsRun,
  type BossSession,
} from "@/lib/bossing/bossData";
import type { BossEncounter } from "@/lib/bossing/encounters";
import { formatChaos } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { fetchCategory } from "@/lib/fetchCategory";
import { useCopyToClipboard } from "@/lib/useCopyToClipboard";
import { PriceHistoryModal } from "@/components/PriceHistoryModal";
import { BossSessionModal } from "@/components/BossSessionModal";

function marginColorClass(value: number | null): string {
  if (value === null) return "text-[var(--muted)]";
  if (value > 0) return "text-[var(--good)]";
  if (value < 0) return "text-[var(--bad)]";
  return "text-[var(--muted)]";
}

interface OutcomeRow {
  rewardName: string;
  rewardQuantity: number;
  category: string;
  price: number | undefined;
  ninjaId: string;
  timesReceived: number;
  probability: number | null;
  contribution: number | undefined;
}

export function BossEncounterTable({ encounter }: { encounter: BossEncounter }) {
  const { league } = useLeague();
  return <BossEncounterTableForLeague key={league} encounter={encounter} league={league} />;
}

function BossEncounterTableForLeague({ encounter, league }: { encounter: BossEncounter; league: string }) {
  const [fragmentPrice, setFragmentPrice] = useState<{ chaosValue: number; ninjaId: string } | undefined>(
    undefined,
  );
  const [rewardPrices, setRewardPrices] = useState<Record<string, { chaosValue: number; ninjaId: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { copiedKey, copy } = useCopyToClipboard();
  const [historyTarget, setHistoryTarget] = useState<{
    category: string;
    itemId: string;
    itemName: string;
    rawId: string;
  } | null>(null);

  const [sessions, setSessions] = useState<BossSession[]>(() => loadBossSessions(league, encounter.slug));
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [fightsPreview, setFightsPreview] = useState(1);

  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    const rewardCategories = [...new Set(encounter.possibleRewards.map((r) => r.category))];

    Promise.all([
      fetchCategory(encounter.fragmentCategory, league),
      Promise.all(rewardCategories.map((cat) => fetchCategory(cat, league).catch(() => []))),
    ])
      .then(([fragmentData, rewardDataByCategory]) => {
        if (cancelled) return;
        const fragment = fragmentData.find((i) => i.name === encounter.fragmentName);
        setFragmentPrice(fragment ? { chaosValue: fragment.chaosValue, ninjaId: fragment.ninjaId } : undefined);

        const rewardMap: Record<string, { chaosValue: number; ninjaId: string }> = {};
        for (const rewardData of rewardDataByCategory) {
          for (const row of rewardData) {
            rewardMap[row.name.toLowerCase()] = { chaosValue: row.chaosValue, ninjaId: row.ninjaId };
          }
        }
        setRewardPrices(rewardMap);
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
  }, [league, encounter]);

  const submitSession = (session: BossSession) => {
    setSessions(appendBossSession(league, encounter.slug, session));
    setSessionModalOpen(false);
  };

  const removeSession = (sessionId: string) => {
    setSessions(deleteBossSession(league, encounter.slug, sessionId));
  };

  const fightsLogged = useMemo(() => totalFightsRun(sessions), [sessions]);
  const outcomeCounts = useMemo(() => tallyBossOutcomes(sessions), [sessions]);
  const allTimeProfit = useMemo(() => totalBossProfit(sessions), [sessions]);

  const outcomeRows = useMemo<OutcomeRow[]>(() => {
    return encounter.possibleRewards.map((r) => {
      const priceEntry = rewardPrices[r.rewardName.toLowerCase()];
      const price = priceEntry?.chaosValue;
      const timesReceived = outcomeCounts[r.rewardName] ?? 0;
      const probability = fightsLogged > 0 ? timesReceived / fightsLogged : null;
      const contribution =
        probability !== null && price !== undefined ? probability * r.rewardQuantity * price : undefined;
      return {
        rewardName: r.rewardName,
        rewardQuantity: r.rewardQuantity,
        category: r.category,
        price,
        ninjaId: priceEntry?.ninjaId ?? "",
        timesReceived,
        probability,
        contribution,
      };
    });
  }, [encounter.possibleRewards, rewardPrices, outcomeCounts, fightsLogged]);

  // EV per fight only makes sense once at least one fight is logged, and
  // only if every reward that's actually been received has a live price -
  // one never received yet just contributes 0 rather than blocking the
  // whole calculation.
  const receivedRows = outcomeRows.filter((r) => r.timesReceived > 0);
  const allReceivedKnown = receivedRows.every((r) => r.contribution !== undefined);
  const evPerFight =
    fightsLogged > 0 && allReceivedKnown ? outcomeRows.reduce((sum, r) => sum + (r.contribution ?? 0), 0) : null;

  const fragmentCostPerFight =
    fragmentPrice !== undefined ? fragmentPrice.chaosValue * encounter.fragmentQuantity : undefined;
  const stackCost = fragmentCostPerFight !== undefined ? fragmentCostPerFight * fightsPreview : undefined;
  const evTotal = evPerFight !== null ? evPerFight * fightsPreview : null;
  const margin = stackCost !== undefined && evTotal !== null ? evTotal - stackCost : null;
  const marginPercent = margin === null ? null : stackCost! > 0 ? (margin / stackCost!) * 100 : 0;

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
            All-time, across {sessions.length} logged session{sessions.length === 1 ? "" : "s"} ({fightsLogged}{" "}
            fight{fightsLogged === 1 ? "" : "s"})
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
            <label className="text-xs text-[var(--muted)]">Fights to run</label>
            <input
              type="number"
              min={1}
              value={fightsPreview}
              onChange={(e) => setFightsPreview(Math.max(1, Number(e.target.value) || 1))}
              className="w-20 rounded border border-[var(--border)] bg-[var(--surface-alt)] px-1 py-0.5 text-xs"
            />
            <div className="text-xs text-[var(--muted)]">
              {encounter.fragmentName} ({encounter.fragmentQuantity}x per fight):{" "}
              {fragmentCostPerFight !== undefined ? `${formatChaos(fragmentCostPerFight)}c` : "unknown"}
            </div>
            <div className="text-xs text-[var(--muted)]">
              Total cost: {stackCost !== undefined ? `${formatChaos(stackCost)}c` : "unknown"}
            </div>
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
            {fightsLogged > 0 && <div className="text-xs text-[var(--muted)]">from {fightsLogged} logged fights</div>}
            <button
              onClick={() => setSessionModalOpen(true)}
              className="mt-2 rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            >
              Log a session
            </button>
          </div>
        </div>

        {fightsLogged === 0 && (
          <p className="mt-3 text-xs text-[var(--bad)]">
            No odds are known yet - log a session below to start computing an expected value.
          </p>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted)]">
                <th className="px-2 py-1 font-medium">Possible reward</th>
                <th className="px-2 py-1 font-medium">Times received</th>
                <th className="px-2 py-1 font-medium">Your odds</th>
                <th className="px-2 py-1 font-medium">Live price</th>
                <th className="px-2 py-1 font-medium">EV contribution</th>
              </tr>
            </thead>
            <tbody>
              {outcomeRows.map((o) => (
                <tr key={o.rewardName} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-2 py-1">
                    <button
                      onClick={() => {
                        copy(o.rewardName, o.rewardName);
                        setHistoryTarget({
                          category: o.category,
                          itemId: slugify(o.rewardName),
                          itemName: o.rewardName,
                          rawId: o.ninjaId,
                        });
                      }}
                      className="underline decoration-dotted underline-offset-2 hover:text-[var(--accent)]"
                      title="Click to copy name, view price history"
                    >
                      {o.rewardName}
                    </button>
                    {copiedKey === o.rewardName && <span className="ml-1 text-xs text-[var(--good)]">Copied!</span>}
                    {o.rewardQuantity > 1 && <span className="text-xs text-[var(--muted)]"> x{o.rewardQuantity}</span>}
                  </td>
                  <td className="px-2 py-1">{o.timesReceived}</td>
                  <td className="px-2 py-1">
                    {o.probability === null ? "-" : `${(o.probability * 100).toFixed(1)}%`}
                  </td>
                  <td className="px-2 py-1">{o.price !== undefined ? `${formatChaos(o.price)}c` : "unavailable"}</td>
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
                    <th className="px-2 py-1 font-medium">Fights</th>
                    <th className="px-2 py-1 font-medium">Cost</th>
                    <th className="px-2 py-1 font-medium">Value</th>
                    <th className="px-2 py-1 font-medium">Profit</th>
                    <th className="px-2 py-1 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
                    const cost = bossSessionCost(session);
                    const value = bossSessionValue(session);
                    const profit = bossSessionProfit(session);
                    return (
                      <tr key={session.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-2 py-1">{new Date(session.timestamp).toLocaleString()}</td>
                        <td className="px-2 py-1">{session.fightsRun}</td>
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
        <BossSessionModal
          defaultCostPerFight={fragmentCostPerFight ?? 0}
          defaultFightsRun={fightsPreview}
          outcomes={outcomeRows.map((o) => ({ rewardName: o.rewardName, rewardQuantity: o.rewardQuantity, price: o.price }))}
          onSubmit={submitSession}
          onClose={() => setSessionModalOpen(false)}
        />
      )}
    </div>
  );
}
