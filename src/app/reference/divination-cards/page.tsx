import { DivinationCardReferenceTable } from "@/components/DivinationCardReferenceTable";

export default function DivinationCardReferencePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Divination Card Reference</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Every card poe.ninja currently prices, with its known reward, stack size, live cost per
          card, and gold cost. Gold cost is missing for most cards - use Export CSV to get a full
          worksheet, fill in the Gold Cost column as you confirm values in-game, then hand it back
          to have goldCosts.ts updated.
        </p>
      </div>
      <DivinationCardReferenceTable />
    </div>
  );
}
