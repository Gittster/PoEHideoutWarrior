import Link from "next/link";

interface SectionCardProps {
  title: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
}

export function SectionCard({ title, description, href, comingSoon }: SectionCardProps) {
  const inner = (
    <div className="group h-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 transition-colors hover:border-[var(--accent)]">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {comingSoon && (
          <span className="rounded-full bg-[var(--surface-alt)] px-2 py-0.5 text-xs text-[var(--muted)]">
            Coming soon
          </span>
        )}
      </div>
      <p className="text-sm text-[var(--muted)]">{description}</p>
    </div>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  );
}
