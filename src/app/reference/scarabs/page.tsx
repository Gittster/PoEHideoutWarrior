import { ScarabReferenceTable } from "@/components/ScarabReferenceTable";

export default function ScarabReferencePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Scarab Reference</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Every scarab poe.ninja currently prices, with its live cost and gold cost. Gold cost
          starts empty for all of them - use Export CSV to get a full worksheet, fill in the Gold
          Cost column as you confirm values in-game, then hand it back to have goldCosts.ts
          updated.
        </p>
      </div>
      <ScarabReferenceTable />
    </div>
  );
}
