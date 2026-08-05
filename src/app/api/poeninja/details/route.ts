import { NextRequest, NextResponse } from "next/server";
import { fetchPoeNinjaItemHistory } from "@/lib/poeninja";

const cache = new Map<string, { expires: number; data: unknown }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");
  const id = request.nextUrl.searchParams.get("id");
  const league = request.nextUrl.searchParams.get("league");
  const rawId = request.nextUrl.searchParams.get("rawId") || undefined;

  if (!category || !id || !league) {
    return NextResponse.json(
      { error: "category, id, and league parameters are required" },
      { status: 400 },
    );
  }

  const cacheKey = `${category}:${id}:${rawId ?? ""}:${league}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const history = await fetchPoeNinjaItemHistory(category, id, league, rawId);
  if (!history) {
    return NextResponse.json(
      { error: `No price history available for "${id}" in league "${league}"` },
      { status: 502 },
    );
  }

  const body = { itemName: history.itemName, points: history.points };
  cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, data: body });
  return NextResponse.json(body);
}
