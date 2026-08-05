# PoE Hideout Warrior

An index of ways to make currency in Path of Exile, organized by technique. The first section,
**Arbitrage**, tracks currency-market spreads, divination card turn-ins, and bulk-to-retail flips
against live [poe.ninja](https://poe.ninja) prices, with per-item sliders so you can model your
own buy/sell assumptions and flag opportunities against a margin threshold.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- No database - the league setting and your manual price overrides/thresholds are stored in
  `localStorage`, per browser
- A server-side API route (`/api/poeninja`) proxies poe.ninja so requests aren't blocked by
  browser CORS

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `src/app/page.tsx` - home page listing sections (Arbitrage live; Crafting/Flipping/Sniping
  are placeholders for future sections)
- `src/app/config` - set the active league (persisted to `localStorage`)
- `src/app/arbitrage` - arbitrage technique index and `[slug]` detail pages
- `src/app/api/poeninja/route.ts` - server-side poe.ninja proxy with a short in-memory cache
- `src/lib/poeninja.ts` - poe.ninja fetch/parse logic (ported from a working Google Apps Script
  that hits the stash/item/exchange economy-overview endpoints in order)
- `src/lib/arbitrage/techniques.ts` - the static list of arbitrage techniques (overview, how it
  works, risks, poe.ninja category, default threshold)
- `src/components/OpportunityTable.tsx` - live price table with per-item buy/sell sliders,
  margin calculation, and threshold-based opportunity highlighting

## Adding a new arbitrage technique

Add an entry to `ARBITRAGE_TECHNIQUES` in `src/lib/arbitrage/techniques.ts` with a poe.ninja
`category` (e.g. `"Scarab"`, `"Essence"`, `"DivinationCard"`, `"Currency"`, `"SkillGem"`, or any
other category poe.ninja's economy-overview endpoints support) - the detail page and price table
are generated automatically from that config.

## Notes

- Trade-link building (deep links into pathofexile.com/trade for a given item) is intentionally
  not implemented yet - flagged as a follow-up rather than shipping a guessed link format.
- The league name must match what poe.ninja uses internally (visible in poe.ninja's own league
  dropdown). If prices fail to load, double-check the spelling on the Config page.
