"use client";

import { useEffect, useState } from "react";
import { fetchCategory } from "@/lib/fetchCategory";

/** Live chaos price of a single named currency item, by exact poe.ninja name. */
export function useCurrencyPrice(itemName: string, league: string): { price: number | undefined; loading: boolean } {
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    fetchCategory("Currency", league)
      .then((items) => {
        if (cancelled) return;
        const match = items.find((i) => i.name === itemName);
        setPrice(match?.chaosValue);
      })
      .catch(() => {
        if (!cancelled) setPrice(undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [itemName, league]);

  return { price, loading };
}
