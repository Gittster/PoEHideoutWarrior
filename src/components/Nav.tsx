"use client";

import Link from "next/link";
import { useLeague } from "@/lib/league-context";

export function Nav() {
  const { league } = useLeague();

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          <span className="text-[var(--accent)]">Hideout</span> Warrior
        </Link>
        <nav className="flex items-center gap-6 text-sm text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--foreground)]">
            Sections
          </Link>
          <Link href="/arbitrage" className="hover:text-[var(--foreground)]">
            Arbitrage
          </Link>
          <Link href="/reference/divination-cards" className="hover:text-[var(--foreground)]">
            Card Reference
          </Link>
          <Link
            href="/config"
            className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1 hover:border-[var(--accent)] hover:text-[var(--foreground)]"
          >
            League: <span className="text-[var(--accent)]">{league}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
