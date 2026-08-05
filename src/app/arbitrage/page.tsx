import Link from "next/link";
import { ARBITRAGE_TECHNIQUES } from "@/lib/arbitrage/techniques";

export default function ArbitragePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Arbitrage</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Opportunities where the same value (currency, div card reward, essence, scarab) can be
          bought in one place and sold for more in another.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ARBITRAGE_TECHNIQUES.map((t) => (
          <Link
            key={t.slug}
            href={`/arbitrage/${t.slug}`}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--accent)]"
          >
            <h3 className="mb-2 text-lg font-semibold">{t.title}</h3>
            <p className="text-sm text-[var(--muted)]">{t.shortDescription}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
