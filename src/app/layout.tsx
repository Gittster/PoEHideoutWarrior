import type { Metadata } from "next";
import "./globals.css";
import { LeagueProvider } from "@/lib/league-context";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "PoE Hideout Warrior",
  description: "An index of currency arbitrage, crafting, flipping, and sniping techniques for Path of Exile.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <LeagueProvider>
          <Nav />
          <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
          <footer className="border-t border-[var(--border)] px-6 py-6 text-center text-xs text-[var(--muted)]">
            Prices from poe.ninja. Not affiliated with Grinding Gear Games.
          </footer>
        </LeagueProvider>
      </body>
    </html>
  );
}
