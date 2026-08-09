"use client";

import { useEffect, useState } from "react";
import { formatChaos } from "@/lib/format";
import type { BossSession, BossSessionOutcome } from "@/lib/bossing/bossData";

interface OutcomeInput {
  rewardName: string;
  timesReceived: number;
  valuePerOccurrence: number;
}

interface Props {
  defaultCostPerFight: number;
  defaultFightsRun: number;
  outcomes: { rewardName: string; rewardQuantity: number; price: number | undefined }[];
  onSubmit: (session: BossSession) => void;
  onClose: () => void;
}

function marginColorClass(value: number): string {
  if (value > 0) return "text-[var(--good)]";
  if (value < 0) return "text-[var(--bad)]";
  return "text-[var(--muted)]";
}

export function BossSessionModal({ defaultCostPerFight, defaultFightsRun, outcomes, onSubmit, onClose }: Props) {
  const [costPerFight, setCostPerFight] = useState(defaultCostPerFight);
  const [fightsRun, setFightsRun] = useState(defaultFightsRun);
  const [rows, setRows] = useState<OutcomeInput[]>(() =>
    [...outcomes]
      .sort((a, b) => a.rewardName.localeCompare(b.rewardName))
      .map((o) => ({
        rewardName: o.rewardName,
        timesReceived: 0,
        // Snapshot of the live rate at log time - editable below in case
        // what you actually got/sold at differs from the current market.
        valuePerOccurrence: o.price !== undefined ? o.price * o.rewardQuantity : 0,
      })),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const updateRow = (rewardName: string, patch: Partial<OutcomeInput>) => {
    setRows((prev) => prev.map((r) => (r.rewardName === rewardName ? { ...r, ...patch } : r)));
  };

  const totalCost = fightsRun * costPerFight;
  const totalValue = rows.reduce((sum, r) => sum + r.timesReceived * r.valuePerOccurrence, 0);
  const profit = totalValue - totalCost;

  const submit = () => {
    if (fightsRun <= 0) return;
    const sessionOutcomes: BossSessionOutcome[] = rows
      .filter((r) => r.timesReceived > 0)
      .map((r) => ({
        rewardName: r.rewardName,
        timesReceived: r.timesReceived,
        valuePerOccurrence: r.valuePerOccurrence,
      }));
    onSubmit({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      fightsRun,
      costPerFight,
      outcomes: sessionOutcomes,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Log a boss session"
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">Log a session</h3>
            <p className="text-xs text-[var(--muted)]">
              Enter how many fights you ran and how many of those fights dropped each reward - a
              fight can drop several, or none. Rates below are pre-filled from live prices - edit
              them if that isn&apos;t what you actually received.
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)]" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--muted)]">Fights run</label>
            <input
              type="number"
              min={0}
              value={fightsRun}
              onChange={(e) => setFightsRun(Math.max(0, Number(e.target.value) || 0))}
              className="w-20 rounded border border-[var(--border)] bg-[var(--surface-alt)] px-1 py-0.5 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--muted)]">Cost per fight (chaos)</label>
            <input
              type="number"
              value={costPerFight}
              onChange={(e) => setCostPerFight(Number(e.target.value) || 0)}
              className="w-24 rounded border border-[var(--border)] bg-[var(--surface-alt)] px-1 py-0.5 text-xs"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted)]">
                <th className="px-2 py-1 font-medium">Possible reward</th>
                <th className="px-2 py-1 font-medium">Times received</th>
                <th className="px-2 py-1 font-medium">Value per drop (chaos)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.rewardName} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-2 py-1">{r.rewardName}</td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={0}
                      value={r.timesReceived}
                      onChange={(e) => updateRow(r.rewardName, { timesReceived: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-16 rounded border border-[var(--border)] bg-[var(--surface-alt)] px-1 py-0.5 text-xs"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      value={r.valuePerOccurrence}
                      onChange={(e) => updateRow(r.rewardName, { valuePerOccurrence: Number(e.target.value) || 0 })}
                      className="w-24 rounded border border-[var(--border)] bg-[var(--surface-alt)] px-1 py-0.5 text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2">
          <div className="text-xs text-[var(--muted)]">
            {fightsRun} fight{fightsRun === 1 ? "" : "s"} - cost {formatChaos(totalCost)}c, value{" "}
            {formatChaos(totalValue)}c
          </div>
          <div className={`text-sm font-semibold ${marginColorClass(profit)}`}>
            {profit >= 0 ? "+" : ""}
            {formatChaos(profit)}c profit
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs hover:border-[var(--accent)]"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={fightsRun <= 0}
            className="rounded-md border border-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[var(--accent)]"
          >
            Submit session
          </button>
        </div>
      </div>
    </div>
  );
}
