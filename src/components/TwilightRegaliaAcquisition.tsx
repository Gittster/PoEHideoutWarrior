"use client";

import { useEffect, useState } from "react";
import { fetchCategory } from "@/lib/fetchCategory";
import { formatChaos } from "@/lib/format";

const QUALITY_THRESHOLDS = [24, 25, 26, 27, 28];
const CRUSADERS_EXALTED_ORB = "Crusader's Exalted Orb";

// Community trade tools (Awakened PoE Trade and similar) deep-link into
// pathofexile.com/trade by putting the same JSON query body the site's own
// search POSTs as a `q` query-string param - the site reads it on load and
// runs the search. That format is reproduced here rather than guessed at
// from scratch, but it's unverified against the live site from this
// sandbox (no network egress to pathofexile.com), so if a link doesn't
// land on the right filters, that's the thing to double check first.
function buildTradeSearchUrl(league: string, minQuality: number): string {
  const query = {
    query: {
      status: { option: "any" },
      type: "Twilight Regalia",
      stats: [{ type: "and", filters: [] }],
      filters: {
        type_filters: { filters: { rarity: { option: "normal" } } },
        misc_filters: { filters: { quality: { min: minQuality } } },
      },
    },
    sort: { price: "asc" },
  };
  return `https://www.pathofexile.com/trade/search/${encodeURIComponent(league)}?q=${encodeURIComponent(
    JSON.stringify(query),
  )}`;
}

export function TwilightRegaliaAcquisition({ league }: { league: string }) {
  const [orbPrice, setOrbPrice] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    fetchCategory("Currency", league)
      .then((items) => {
        if (cancelled) return;
        const orb = items.find((i) => i.name === CRUSADERS_EXALTED_ORB);
        setOrbPrice(orb?.chaosValue);
      })
      .catch(() => {
        if (!cancelled) setOrbPrice(undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [league]);

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-[var(--border)] pt-3 text-sm">
      <p className="text-[var(--muted)]">
        Base is a <span className="text-[var(--foreground)]">Twilight Regalia</span>, and it needs to be{" "}
        <span className="text-[var(--foreground)]">Normal</span> rarity - either buy one that&apos;s already
        Crusader-influenced, or buy an uninfluenced one and apply a Crusader&apos;s Exalted Orb yourself.
      </p>

      <div className="flex flex-wrap gap-2">
        {QUALITY_THRESHOLDS.map((q) => (
          <a
            key={q}
            href={buildTradeSearchUrl(league, q)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:border-[var(--accent)] hover:text-[var(--foreground)]"
          >
            {q}q min
          </a>
        ))}
      </div>

      <div className="text-xs text-[var(--muted)]">
        {CRUSADERS_EXALTED_ORB} ({league}):{" "}
        {loading ? "loading..." : orbPrice !== undefined ? `${formatChaos(orbPrice)}c` : "unavailable"}
      </div>

      <p className="text-xs text-[var(--muted)]">
        Trade links are built the same way third-party price-check tools do it, but haven&apos;t been
        verified against the live trade site from this environment - if the filters don&apos;t land right,
        that&apos;s the first thing to check.
      </p>
    </div>
  );
}
