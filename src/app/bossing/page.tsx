import Link from "next/link";
import { BOSS_ENCOUNTERS } from "@/lib/bossing/encounters";

export default function BossingPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bossing</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Boss encounters priced by the fragments/keys they cost to open against what they actually
          drop, logged fight-by-fight the same way variable-reward divination cards are.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {BOSS_ENCOUNTERS.map((e) => (
          <Link
            key={e.slug}
            href={`/bossing/${e.slug}`}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--accent)]"
          >
            <h3 className="mb-2 text-lg font-semibold">{e.title}</h3>
            <p className="text-sm text-[var(--muted)]">{e.shortDescription}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
