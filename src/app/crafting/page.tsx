import Link from "next/link";
import { CRAFT_GUIDES } from "@/lib/crafting/guides";

export default function CraftingPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Crafting</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Step-by-step crafting guides - paste your item&apos;s copied text and get pointed to where you are in
          the process.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CRAFT_GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/crafting/${g.slug}`}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--accent)]"
          >
            <h3 className="mb-2 text-lg font-semibold">{g.title}</h3>
            <p className="text-sm text-[var(--muted)]">{g.shortDescription}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
