"use client";

import { useEffect, useState } from "react";
import { formatChaos } from "@/lib/format";
import type { ReforgeSession, ReforgeSessionOutcome } from "@/lib/arbitrage/deliriumReforgeData";

interface OutcomeInput {
  itemName: string;
  timesPulled: number;
  pricePerUnit: number;
}

interface Props {
  defaultBuyPrice: number;
  defaultIngredientCost: number;
  defaultQuantity: number;
  outcomes: { itemName: string; price: number | undefined }[];
  onSubmit: (session: ReforgeSession) => void;
  onClose: () => void;
}

function marginColorClass(value: number): string {
  if (value > 0) return "text-[var(--good)]";
  if (value < 0) return "text-[var(--bad)]";
  return "text-[var(--muted)]";
}

export function ReforgeSessionModal({
  defaultBuyPrice,
  defaultIngredientCost,
  defaultQuantity,
  outcomes,
  onSubmit,
  onClose,
}: Props) {
  const [buyPricePerOrb, setBuyPricePerOrb] = useState(defaultBuyPrice);
  const [ingredientCostPerReforge, setIngredientCostPerReforge] = useState(defaultIngredientCost);
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [rows, setRows] = useState<OutcomeInput[]>(() =>
    [...outcomes]
      .sort((a, b) => a.itemName.localeCompare(b.itemName))
      .map((o) => ({
        itemName: o.itemName,
        timesPulled: 0,
        pricePerUnit: o.price ?? 0,
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

  const updateRow = (itemName: string, patch: Partial<OutcomeInput>) => {
    setRows((prev) => prev.map((r) => (r.itemName === itemName ? { ...r, ...patch } : r)));
  };

  const reforgeCount = rows.reduce((sum, r) => sum + r.timesPulled, 0);
  const totalCost = reforgeCount * (buyPricePerOrb * quantity + ingredientCostPerReforge);
  const totalValue = rows.reduce((sum, r) => sum + r.timesPulled * quantity * r.pricePerUnit, 0);
  const profit = totalValue - totalCost;

  const submit = () => {
    if (reforgeCount <= 0) return;
    const sessionOutcomes: ReforgeSessionOutcome[] = rows
      .filter((r) => r.timesPulled > 0)
      .map((r) => ({
        itemName: r.itemName,
        timesPulled: r.timesPulled,
        pricePerUnit: r.pricePerUnit,
      }));
    onSubmit({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      buyPricePerOrb,
      ingredientCostPerReforge,
      quantity,
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
        aria-label="Log a reforge session"
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">Log a reforge session</h3>
            <p className="text-xs text-[var(--muted)]">
              Enter how many reforges produced each outcome this session. Rates below are pre-filled
              from live prices - edit them if that isn&apos;t what you actually paid/sold for.
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)]" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--muted)]">Your cost per orb (chaos)</label>
            <input
              type="number"
              value={buyPricePerOrb}
              onChange={(e) => setBuyPricePerOrb(Number(e.target.value) || 0)}
              className="w-24 rounded border border-[var(--border)] bg-[var(--surface-alt)] px-1 py-0.5 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--muted)]">Ingredient cost per reforge (chaos)</label>
            <input
              type="number"
              value={ingredientCostPerReforge}
              onChange={(e) => setIngredientCostPerReforge(Number(e.target.value) || 0)}
              className="w-24 rounded border border-[var(--border)] bg-[var(--surface-alt)] px-1 py-0.5 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--muted)]">Orbs per reforge</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="w-20 rounded border border-[var(--border)] bg-[var(--surface-alt)] px-1 py-0.5 text-xs"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted)]">
                <th className="px-2 py-1 font-medium">Outcome</th>
                <th className="px-2 py-1 font-medium">Reforges</th>
                <th className="px-2 py-1 font-medium">Price per unit (chaos)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.itemName} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-2 py-1">{r.itemName}</td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      min={0}
                      value={r.timesPulled}
                      onChange={(e) => updateRow(r.itemName, { timesPulled: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-16 rounded border border-[var(--border)] bg-[var(--surface-alt)] px-1 py-0.5 text-xs"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      value={r.pricePerUnit}
                      onChange={(e) => updateRow(r.itemName, { pricePerUnit: Number(e.target.value) || 0 })}
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
            {reforgeCount} reforge{reforgeCount === 1 ? "" : "s"} - cost {formatChaos(totalCost)}c, value{" "}
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
            disabled={reforgeCount <= 0}
            className="rounded-md border border-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[var(--accent)]"
          >
            Submit session
          </button>
        </div>
      </div>
    </div>
  );
}
