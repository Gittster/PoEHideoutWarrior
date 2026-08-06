"use client";

import { useCallback, useRef, useState } from "react";

// Shared "click a name, copy it, show a brief confirmation" behavior for the
// clickable item/reward/card names across the opportunity tables - keyed so
// multiple copyable names on the same page don't fight over one indicator.
export function useCopyToClipboard(timeoutMs = 1200) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    (key: string, text: string) => {
      navigator.clipboard?.writeText(text).catch(() => {
        // Clipboard access can fail (permissions, insecure context, ...) -
        // the price-history click still goes through either way, so this
        // is safe to silently ignore rather than surface as an error.
      });
      setCopiedKey(key);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiedKey(null), timeoutMs);
    },
    [timeoutMs],
  );

  return { copiedKey, copy };
}
