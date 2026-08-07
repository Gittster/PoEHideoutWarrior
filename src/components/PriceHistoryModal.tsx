"use client";

import { useEffect, useMemo, useState } from "react";
import { formatChaos } from "@/lib/format";
import type { PriceHistoryPoint } from "@/lib/poeninja";
import { buildTradeSearchUrl } from "@/lib/tradeLink";

interface Props {
  category: string;
  itemId: string;
  itemName: string;
  /** poe.ninja's internal numeric id, used as a fallback lookup for items
   * (uniques, gems, ...) priced via the "stash" pipeline rather than the
   * slug-keyed "exchange" one. Empty string if unavailable. */
  rawId: string;
  league: string;
  onClose: () => void;
}

const CHART_WIDTH = 560;
const CHART_HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 56 };
const PLOT_WIDTH = CHART_WIDTH - PAD.left - PAD.right;
const PLOT_HEIGHT = CHART_HEIGHT - PAD.top - PAD.bottom;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Chart({ points }: { points: PriceHistoryPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { minV, maxV, xFor, yFor } = useMemo(() => {
    const values = points.map((p) => p.chaosValue);
    let lo = Math.min(...values);
    let hi = Math.max(...values);
    if (lo === hi) {
      lo -= Math.abs(lo) * 0.1 || 1;
      hi += Math.abs(hi) * 0.1 || 1;
    } else {
      const pad = (hi - lo) * 0.1;
      lo -= pad;
      hi += pad;
    }
    const n = points.length;
    return {
      minV: lo,
      maxV: hi,
      xFor: (i: number) => PAD.left + (n === 1 ? PLOT_WIDTH / 2 : (i / (n - 1)) * PLOT_WIDTH),
      yFor: (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * PLOT_HEIGHT,
    };
  }, [points]);

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xFor(i).toFixed(1)},${yFor(p.chaosValue).toFixed(1)}`)
    .join(" ");
  const bottomY = PAD.top + PLOT_HEIGHT;
  const areaPath =
    points.length > 0
      ? `${linePath} L${xFor(points.length - 1).toFixed(1)},${bottomY} L${xFor(0).toFixed(1)},${bottomY} Z`
      : "";

  const gridLines = [minV, (minV + maxV) / 2, maxV];
  const last = points[points.length - 1];
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  const handleMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * CHART_WIDTH;
    const n = points.length;
    const idx = n === 1 ? 0 : Math.round(((relX - PAD.left) / PLOT_WIDTH) * (n - 1));
    setHoverIndex(Math.min(n - 1, Math.max(0, idx)));
  };

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      className="w-full"
      role="img"
      aria-label={`Chaos value over time, currently ${formatChaos(last.chaosValue)}`}
    >
      {gridLines.map((v, i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            x2={CHART_WIDTH - PAD.right}
            y1={yFor(v)}
            y2={yFor(v)}
            stroke="var(--border)"
            strokeWidth={1}
          />
          <text x={PAD.left - 8} y={yFor(v)} textAnchor="end" dominantBaseline="middle" className="fill-[var(--muted)] text-[9px]">
            {formatChaos(v)}
          </text>
        </g>
      ))}

      <text x={xFor(0)} y={CHART_HEIGHT - 8} textAnchor="start" className="fill-[var(--muted)] text-[9px]">
        {formatDate(points[0].date)}
      </text>
      <text x={xFor(points.length - 1)} y={CHART_HEIGHT - 8} textAnchor="end" className="fill-[var(--muted)] text-[9px]">
        {formatDate(points[points.length - 1].date)}
      </text>

      <path d={areaPath} fill="color-mix(in srgb, var(--accent) 10%, transparent)" stroke="none" />
      <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {/* End dot + direct label, per the "label the endpoint" rule. */}
      <circle cx={xFor(points.length - 1)} cy={yFor(last.chaosValue)} r={4} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
      <text
        x={xFor(points.length - 1) - 6}
        y={yFor(last.chaosValue) - 10}
        textAnchor="end"
        className="fill-[var(--foreground)] text-[10px] font-medium"
      >
        {formatChaos(last.chaosValue)}c
      </text>

      {hovered &&
        (() => {
          const px = xFor(hoverIndex!);
          const py = yFor(hovered.chaosValue);
          const boxW = 84;
          const boxH = 36;
          const boxX = Math.min(Math.max(px - boxW / 2, PAD.left), CHART_WIDTH - PAD.right - boxW);
          const boxY = Math.max(py - boxH - 12, PAD.top);
          return (
            <>
              <line x1={px} x2={px} y1={PAD.top} y2={bottomY} stroke="var(--muted)" strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={px} cy={py} r={4} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
              <g pointerEvents="none">
                <rect x={boxX} y={boxY} width={boxW} height={boxH} rx={4} fill="var(--surface-alt)" stroke="var(--border)" strokeWidth={1} />
                <text x={boxX + 8} y={boxY + 14} className="fill-[var(--muted)] text-[9px]">
                  {formatDate(hovered.date)}
                </text>
                <text x={boxX + 8} y={boxY + 28} className="fill-[var(--foreground)] text-[11px] font-semibold">
                  {formatChaos(hovered.chaosValue)}c
                </text>
              </g>
            </>
          );
        })()}

      {/* Full-height hover target, wider than the line itself. */}
      <rect
        x={PAD.left}
        y={PAD.top}
        width={PLOT_WIDTH}
        height={PLOT_HEIGHT}
        fill="transparent"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      />
    </svg>
  );
}

export function PriceHistoryModal({ category, itemId, itemName, rawId, league, onClose }: Props) {
  const [points, setPoints] = useState<PriceHistoryPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const rawIdParam = rawId ? `&rawId=${encodeURIComponent(rawId)}` : "";
    fetch(
      `/api/poeninja/details?category=${encodeURIComponent(category)}&id=${encodeURIComponent(itemId)}&league=${encodeURIComponent(league)}${rawIdParam}`,
    )
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to load price history");
        return body.points as PriceHistoryPoint[];
      })
      .then((data) => {
        if (!cancelled) setPoints(data);
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
  }, [category, itemId, league, rawId]);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-xl rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${itemName} price history`}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">{itemName}</h3>
            <p className="text-xs text-[var(--muted)]">Chaos value, last {points?.length ?? "..."} days</p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {loading && <p className="py-8 text-center text-sm text-[var(--muted)]">Loading...</p>}
        {error && (
          <>
            <p className="py-8 text-center text-sm text-[var(--bad)]">{error}</p>
            <a
              href={buildTradeSearchUrl(itemName, category, league)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--accent)] underline hover:text-[var(--foreground)]"
            >
              Search trade site ↗
            </a>
          </>
        )}

        {!loading && !error && points && points.length > 0 && (
          <>
            <Chart points={points} />
            <div className="mt-2 flex items-center gap-4">
              <button
                onClick={() => setShowTable((v) => !v)}
                className="text-xs text-[var(--muted)] underline hover:text-[var(--foreground)]"
              >
                {showTable ? "Hide" : "View"} as table
              </button>
              <a
                href={buildTradeSearchUrl(itemName, category, league)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--accent)] underline hover:text-[var(--foreground)]"
              >
                Search trade site ↗
              </a>
            </div>
            {showTable && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded border border-[var(--border)]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                      <th className="px-2 py-1 font-medium">Date</th>
                      <th className="px-2 py-1 font-medium">Chaos value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...points].reverse().map((p) => (
                      <tr key={p.date} className="border-b border-[var(--border)] last:border-0">
                        <td className="px-2 py-1">{formatDate(p.date)}</td>
                        <td className="px-2 py-1">{formatChaos(p.chaosValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {!loading && !error && points && points.length === 0 && (
          <>
            <p className="py-8 text-center text-sm text-[var(--muted)]">No history available.</p>
            <a
              href={buildTradeSearchUrl(itemName, category, league)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--accent)] underline hover:text-[var(--foreground)]"
            >
              Search trade site ↗
            </a>
          </>
        )}
      </div>
    </div>
  );
}
