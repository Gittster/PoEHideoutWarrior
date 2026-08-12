import { notFound } from "next/navigation";
import Link from "next/link";
import { CRAFT_GUIDES, getCraftGuide } from "@/lib/crafting/guides";
import { CraftGuideMatcher } from "@/components/CraftGuideMatcher";

export function generateStaticParams() {
  return CRAFT_GUIDES.map((g) => ({ slug: g.slug }));
}

export default async function CraftGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getCraftGuide(slug);
  if (!guide) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/crafting" className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
          &larr; Crafting
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{guide.title}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{guide.shortDescription}</p>
      </div>

      <section className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-[var(--accent)]">Overview</h2>
          <div className="flex flex-col gap-3 text-sm leading-relaxed text-[var(--foreground)]">
            {guide.overview.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-[var(--accent)]">Risks</h2>
          <ul className="flex flex-col gap-1.5 text-sm text-[var(--muted)]">
            {guide.risks.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[var(--bad)]">!</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--accent)]">Find your step</h2>
        <CraftGuideMatcher slug={guide.slug} />
      </section>
    </div>
  );
}
