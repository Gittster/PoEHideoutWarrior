import { DivinationCardReferenceTable } from "@/components/DivinationCardReferenceTable";

export default function DivinationCardReferencePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Divination Card Reference</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Every card poe.ninja currently prices, with its known reward, stack size, live cost per
          card, and gold cost. Gold cost is missing for most cards - values live in
          src/lib/arbitrage/goldCosts.ts and get added there directly as they&apos;re confirmed.
        </p>
      </div>
      <DivinationCardReferenceTable />
    </div>
  );
}
