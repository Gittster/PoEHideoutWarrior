import { NextRequest, NextResponse } from "next/server";
import { fetchPoeNinjaCategory } from "@/lib/poeninja";

// Very small in-memory cache to smooth over repeated requests within the
// same server instance between poe.ninja's own revalidate window.
const cache = new Map<string, { expires: number; data: unknown }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");
  const league = request.nextUrl.searchParams.get("league");

  if (!category) {
    return NextResponse.json({ error: "category parameter is required" }, { status: 400 });
  }
  if (!league) {
    return NextResponse.json({ error: "league parameter is required" }, { status: 400 });
  }

  const cacheKey = `${category}:${league}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ items: cached.data, cached: true });
  }

  const items = await fetchPoeNinjaCategory(category, league);
  if (items.length === 0) {
    return NextResponse.json(
      { error: `No data returned for category "${category}" in league "${league}"` },
      { status: 502 },
    );
  }

  cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, data: items });
  return NextResponse.json({ items, cached: false });
}
