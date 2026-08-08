import { readLocalStorage, removeLocalStorage, scanLocalStorageKeys, writeLocalStorage } from "@/lib/storage";
import { WEIGHTED_CARD_REWARDS } from "@/lib/arbitrage/weightedCardRewards";

// Per-card "your cost" override - just a buy price (no sell override in v1;
// outcome prices always come from live poe.ninja data since there's no
// single "the reward" to override the way the fixed-reward table does).
export type BuyOverrideMap = Record<string, number>;

function buyOverrideKey(league: string, slug: string) {
  return `phw:weightedbuy:v1:${league}:${slug}`;
}

export function loadBuyOverrides(league: string, slug: string): BuyOverrideMap {
  return readLocalStorage(buyOverrideKey(league, slug), {} as BuyOverrideMap);
}

export function saveBuyOverrides(league: string, slug: string, overrides: BuyOverrideMap): void {
  writeLocalStorage(buyOverrideKey(league, slug), overrides);
}

// A running tally of what you've actually pulled from a given card, so the
// documented outcome weights can be sanity-checked against real results.
// Keyed by reward name -> count. Derived from CardSession[] below rather
// than stored directly - sessions are the source of truth.
export type CardLogCounts = Record<string, number>;

// One turn-in session logged through the "Log a session" modal: how many of
// each outcome you actually pulled, plus the buy/sell rates you actually
// used (which may not match today's live prices - the modal pre-fills them
// from the live snapshot but lets you correct them to what you actually
// paid/sold for). Stored per (league, technique), tagged with cardName, so
// the page can both group sessions per card and total them across the whole
// page for an all-time P/L figure.
export interface CardSessionOutcome {
  rewardName: string;
  /** How many stacks turned in during this session resulted in this outcome. */
  timesPulled: number;
  /** Chaos value credited per pull of this outcome (already includes reward quantity), editable at log time. */
  valuePerOccurrence: number;
}

export interface CardSession {
  id: string;
  cardName: string;
  timestamp: number;
  /** Chaos cost per single card, editable at log time in case it differs from the live price. */
  buyPricePerCard: number;
  /** Gold cost per single card through the Currency Exchange, editable at log time - pre-filled from goldCosts.ts, 0 if that card isn't mapped there. */
  goldCostPerCard: number;
  stackSize: number;
  outcomes: CardSessionOutcome[];
}

function sessionsKey(league: string, slug: string) {
  return `phw:cardsessions:v1:${league}:${slug}`;
}

export function loadSessions(league: string, slug: string): CardSession[] {
  return readLocalStorage(sessionsKey(league, slug), [] as CardSession[]);
}

export function appendSession(league: string, slug: string, session: CardSession): CardSession[] {
  const next = [session, ...loadSessions(league, slug)];
  writeLocalStorage(sessionsKey(league, slug), next);
  return next;
}

export function deleteSession(league: string, slug: string, sessionId: string): CardSession[] {
  const next = loadSessions(league, slug).filter((s) => s.id !== sessionId);
  writeLocalStorage(sessionsKey(league, slug), next);
  return next;
}

export function sessionsForCard(sessions: CardSession[], cardName: string): CardSession[] {
  return sessions.filter((s) => s.cardName === cardName);
}

export function tallyFromSessions(sessions: CardSession[]): CardLogCounts {
  const counts: CardLogCounts = {};
  for (const session of sessions) {
    for (const o of session.outcomes) {
      if (o.timesPulled > 0) counts[o.rewardName] = (counts[o.rewardName] ?? 0) + o.timesPulled;
    }
  }
  return counts;
}

/** Kept for callers (Dashboard) that just want cumulative pull counts for one card, same shape as the old per-click tally. */
export function loadCardLog(league: string, slug: string, cardName: string): CardLogCounts {
  return tallyFromSessions(sessionsForCard(loadSessions(league, slug), cardName));
}

export function sessionStacksProcessed(session: CardSession): number {
  return session.outcomes.reduce((sum, o) => sum + o.timesPulled, 0);
}

export function sessionCost(session: CardSession): number {
  return session.buyPricePerCard * session.stackSize * sessionStacksProcessed(session);
}

export function sessionGoldCost(session: CardSession): number {
  return session.goldCostPerCard * session.stackSize * sessionStacksProcessed(session);
}

export function sessionValue(session: CardSession): number {
  return session.outcomes.reduce((sum, o) => sum + o.timesPulled * o.valuePerOccurrence, 0);
}

export function sessionProfit(session: CardSession): number {
  return sessionValue(session) - sessionCost(session);
}

export function totalProfit(sessions: CardSession[]): number {
  return sessions.reduce((sum, s) => sum + sessionProfit(s), 0);
}

export function totalGoldCost(sessions: CardSession[]): number {
  return sessions.reduce((sum, s) => sum + sessionGoldCost(s), 0);
}

const LEGACY_CARD_LOG_PREFIX = "phw:cardlog:v1:";

// Recovers pull counts logged before sessions existed - the old flat
// "Log this result" tally, one key per (league, technique, card). The
// switch to sessions abandoned this key format outright; this migration
// synthesizes one session per card from each old tally so that odds/EV
// math already built up isn't silently lost. Historical cost/value can't be
// recovered (the old tally never recorded rates, only pull counts), so
// migrated sessions carry 0 for those - only the counts (the part that
// actually took real logging effort) carry over.
export function migrateLegacyCardLogs(): void {
  for (const oldKey of scanLocalStorageKeys(LEGACY_CARD_LOG_PREFIX)) {
    const parts = oldKey.slice(LEGACY_CARD_LOG_PREFIX.length).split(":");
    if (parts.length !== 3) continue; // unexpected shape - leave it rather than guess
    const [league, slug, cardName] = parts;

    if (loadSessions(league, slug).some((s) => s.cardName === cardName)) {
      // Real session data already exists for this card - don't clobber it
      // with a migration guess. Leave the old key for manual review.
      continue;
    }

    const oldCounts = readLocalStorage<CardLogCounts>(oldKey, {});
    const entries = Object.entries(oldCounts).filter(([, count]) => count > 0);
    if (entries.length === 0) {
      removeLocalStorage(oldKey);
      continue;
    }

    appendSession(league, slug, {
      id: crypto.randomUUID(),
      cardName,
      timestamp: Date.now(),
      buyPricePerCard: 0,
      goldCostPerCard: 0,
      stackSize: WEIGHTED_CARD_REWARDS[cardName]?.stackSize ?? 1,
      outcomes: entries.map(([rewardName, timesPulled]) => ({
        rewardName,
        timesPulled,
        valuePerOccurrence: 0,
      })),
    });
    removeLocalStorage(oldKey);
  }
}
