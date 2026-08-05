# PoE Hideout Warrior

An index of ways to make currency in Path of Exile, organized by technique. The first section,
**Arbitrage**, tracks currency-market spreads, divination card turn-ins, and bulk-to-retail flips
against live [poe.ninja](https://poe.ninja) prices, with per-item sliders so you can model your
own buy/sell assumptions and flag opportunities against a margin threshold.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS, built as a fully static site (`output: "export"`)
- No backend, no database - the league setting and your manual price overrides/thresholds live in
  `localStorage`, per browser
- The browser calls poe.ninja's economy-overview endpoints directly (no server-side proxy) - see
  `src/lib/poeninja.ts`

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to GitHub Pages

`.github/workflows/deploy-pages.yml` builds the static export and publishes it on every push to
`main` (or manually via the Actions tab's "Run workflow" button). One-time setup in the repo:

1. Settings -> Pages -> Source -> **GitHub Actions**.
2. Push to `main` (or run the workflow manually) - the site deploys to
   `https://<owner>.github.io/<repo>/`.

`next.config.ts` derives the `/<repo>/` base path automatically from `GITHUB_REPOSITORY` when
building in Actions, so local `npm run dev`/`npm run build` are unaffected and nothing needs to be
hardcoded if the repo is ever renamed.

To build the static export locally (e.g. to check the `out/` folder before pushing):

```bash
npm run build   # outputs to ./out
npx serve out   # preview it as plain static files
```

## Project structure

- `src/app/page.tsx` - home page listing sections (Arbitrage live; Crafting/Flipping/Sniping
  are placeholders for future sections)
- `src/app/config` - set the active league (persisted to `localStorage`)
- `src/app/arbitrage` - arbitrage technique index and `[slug]` detail pages
- `src/lib/poeninja.ts` - poe.ninja fetch/parse logic (ported from a working Google Apps Script
  that hits the stash/item/exchange economy-overview endpoints in order), called directly from
  the browser
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
