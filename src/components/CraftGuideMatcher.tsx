"use client";

import { useMemo, useState } from "react";
import { useLeague } from "@/lib/league-context";
import { parseItemText } from "@/lib/crafting/itemParser";
import { getCraftGuide, matchCurrentStep } from "@/lib/crafting/guides";
import { TwilightRegaliaAcquisition } from "@/components/TwilightRegaliaAcquisition";

export function CraftGuideMatcher({ slug }: { slug: string }) {
  const guide = getCraftGuide(slug);
  const { league } = useLeague();
  const [pasted, setPasted] = useState("");
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (n: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const parsed = useMemo(() => (pasted.trim() ? parseItemText(pasted) : null), [pasted]);
  const match = useMemo(() => (parsed && guide ? matchCurrentStep(guide, parsed) : null), [guide, parsed]);

  const wrongClass = parsed?.itemClass && parsed.itemClass !== "Body Armours";

  if (!guide) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <label className="text-xs text-[var(--muted)]">Paste your item text (Ctrl+C on the item in-game)</label>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={8}
          placeholder={"Item Class: Body Armours\nRarity: Rare\n..."}
          className="mt-2 w-full rounded border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 font-mono text-xs leading-relaxed"
        />

        {pasted.trim() && !parsed && (
          <p className="mt-3 text-xs text-[var(--bad)]">
            Couldn&apos;t parse that as item text - make sure you copied the whole item (Ctrl+C over it in-game).
          </p>
        )}

        {wrongClass && (
          <p className="mt-3 text-xs text-[var(--bad)]">
            This looks like a {parsed!.itemClass}, not a Body Armours - double check you copied the right item.
            Still attempting a match below.
          </p>
        )}

        {parsed && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
            <span>Rarity: {parsed.rarity ?? "unknown"}</span>
            <span>Item level: {parsed.itemLevel ?? "unknown"}</span>
            <span>Quality: {parsed.quality !== undefined ? `+${parsed.quality}%` : "unknown"}</span>
            <span>Mod lines detected: {parsed.modLines.length}</span>
            {parsed.corrupted && <span className="text-[var(--bad)]">Corrupted</span>}
          </div>
        )}

        {parsed && (
          <div className="mt-3 rounded-md border border-[var(--border)] bg-[var(--surface-alt)] p-3 text-sm">
            {match ? (
              <>
                <span className="font-semibold text-[var(--accent)]">
                  Step {match.step.n}: {match.step.title}
                </span>
                {match.confidence === "low" && (
                  <span className="ml-2 text-xs text-[var(--muted)]">(low-confidence match - verify manually)</span>
                )}
                <p className="mt-1 text-[var(--foreground)]">{match.step.detail}</p>
              </>
            ) : (
              <p className="text-[var(--muted)]">
                Couldn&apos;t confidently match this item to a step - check it against the list below by hand.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {guide.receiverSteps.map((step) => {
          const isCurrent = match?.step.n === step.n;
          const isExpanded = expandedSteps.has(step.n);
          const hasExtra = guide.slug === "double-elevated-necro-body" && step.n === 1;
          return (
            <div
              key={step.n}
              className={`rounded-lg border p-3 text-sm ${
                isCurrent
                  ? "border-[var(--accent)] bg-[var(--surface-alt)]"
                  : "border-[var(--border)] bg-[var(--surface)]"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleStep(step.n)}
                className="flex w-full items-start gap-3 text-left"
              >
                <div
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-semibold ${
                    isCurrent
                      ? "bg-[var(--accent)] text-[var(--surface)]"
                      : "bg-[var(--surface-alt)] text-[var(--muted)]"
                  }`}
                >
                  {step.n}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{step.title}</span>
                    {!step.autoDetectable && (
                      <span className="rounded-full bg-[var(--surface-alt)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
                        manual
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[var(--muted)]">{step.detail}</p>
                </div>
                <span className="flex-none text-[var(--muted)]">{isExpanded ? "−" : "+"}</span>
              </button>

              {isExpanded && hasExtra && <TwilightRegaliaAcquisition league={league} />}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <h3 className="text-sm font-semibold text-[var(--accent)]">{guide.donorBase.title}</h3>
        <div className="mt-2 flex flex-col gap-2 text-sm text-[var(--muted)]">
          {guide.donorBase.description.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
