"use client";

import { useCurrencyPrice } from "@/lib/crafting/useCurrencyPrice";
import { formatChaos } from "@/lib/format";

const ORB_OF_REMEMBRANCE = "Orb of Remembrance";

export function OrbOfRemembrancePrice({ league }: { league: string }) {
  const { price, loading } = useCurrencyPrice(ORB_OF_REMEMBRANCE, league);

  return (
    <div className="mt-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
      {ORB_OF_REMEMBRANCE} ({league}): {loading ? "loading..." : price !== undefined ? `${formatChaos(price)}c` : "unavailable"}
    </div>
  );
}
