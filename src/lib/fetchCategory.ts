import type { PoeNinjaItem } from "@/lib/poeninja";

export async function fetchCategory(category: string, league: string): Promise<PoeNinjaItem[]> {
  const res = await fetch(
    `/api/poeninja?category=${encodeURIComponent(category)}&league=${encodeURIComponent(league)}`,
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Failed to load prices");
  return body.items as PoeNinjaItem[];
}
