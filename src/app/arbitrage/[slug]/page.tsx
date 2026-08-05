import { notFound } from "next/navigation";
import Link from "next/link";
import { ARBITRAGE_TECHNIQUES, getArbitrageTechnique } from "@/lib/arbitrage/techniques";
import { OpportunityTable } from "@/components/OpportunityTable";
import { WeightedCardTable } from "@/components/WeightedCardTable";

export function generateStaticParams() {
  return ARBITRAGE_TECHNIQUES.map((t) => ({ slug: t.slug }));
}

export default async function ArbitrageTechniquePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const technique = getArbitrageTechnique(slug);
  if (!technique) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/arbitrage" className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
          &larr; Arbitrage
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{technique.title}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{technique.shortDescription}</p>
      </div>

      <section className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-[var(--accent)]">Overview</h2>
          <div className="flex flex-col gap-3 text-sm leading-relaxed text-[var(--foreground)]">
            {technique.overview.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-[var(--accent)]">How it works</h2>
            <ul className="flex flex-col gap-1.5 text-sm text-[var(--muted)]">
              {technique.mechanics.map((m, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[var(--accent)]">-</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-semibold text-[var(--accent)]">Risks</h2>
            <ul className="flex flex-col gap-1.5 text-sm text-[var(--muted)]">
              {technique.risks.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[var(--bad)]">!</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--accent)]">Live prices &amp; opportunity finder</h2>
        {technique.weightedRewardConfig ? (
          <WeightedCardTable technique={technique} />
        ) : (
          <OpportunityTable technique={technique} />
        )}
      </section>
    </div>
  );
}
