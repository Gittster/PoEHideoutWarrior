import { SectionCard } from "@/components/SectionCard";
import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Your favorited items and the best chaos returns across every technique, live for the
          current league.
        </p>
      </div>

      <Dashboard />

      <div>
        <h2 className="text-lg font-semibold tracking-tight">Sections</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          An index of ways to make currency in Path of Exile, organized by technique.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SectionCard
          title="Arbitrage"
          description="Currency market spreads, div card turn-ins, and bulk-to-retail flips - buy low, sell high on the same item."
          href="/arbitrage"
        />
        <SectionCard
          title="Bossing"
          description="Boss encounters priced by fragment cost vs. drop value, logged fight-by-fight like the variable-reward cards."
          href="/bossing"
        />
        <SectionCard
          title="Crafting"
          description="Turning cheap bases and currency into items worth more than the sum of their inputs."
          comingSoon
        />
        <SectionCard
          title="Flipping"
          description="Buying underpriced listings and reselling at market rate."
          comingSoon
        />
        <SectionCard
          title="Sniping"
          description="Catching mispriced listings before anyone else does."
          comingSoon
        />
      </div>
    </div>
  );
}
