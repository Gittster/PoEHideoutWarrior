# PoE Hideout Warrior
 
An index of ways to make currency in Path of Exile, organized by technique. The first section,
**Arbitrage**, tracks currency-market spreads, divination card turn-ins, and bulk-to-retail flips
against live [poe.ninja](https://poe.ninja) prices, with per-item sliders so you can model your
own buy/sell assumptions and flag opportunities against a margin threshold.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- No database - the league setting and your manual price overrides/thresholds live in
  `localStorage`, per browser
- A server-side API route (`/api/poeninja`) proxies poe.ninja's economy-overview endpoints -
  poe.ninja doesn't send CORS headers, so the browser can't call it directly; the route runs
  server-to-server instead

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

This needs a host that runs the `/api/poeninja` route as a server function, not a static file
host (GitHub Pages can't do this). [Vercel](https://vercel.com) is the natural fit for a Next.js
app and has a free tier:

1. Sign up at vercel.com with your GitHub account.
2. "Add New Project" -> import this repo. Vercel auto-detects Next.js, no config needed.
3. Every push to `main` auto-deploys.

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
