import { readLocalStorage, writeLocalStorage } from "@/lib/storage";

// Per-orb "your cost" + "how many are you reforging" overrides. Kept only
// for the Dashboard's per-item margin recompute (it shows every Delirium
// Orb type as its own favoritable row) - the technique page itself no
// longer has a per-item table to write these from, so this map only ever
// grows from data logged before that table was removed.
export interface ReforgeOverride {
  buy: number;
  quantity: number;
}

export type ReforgeOverrideMap = Record<string, ReforgeOverride>;

function overridesKey(league: string, slug: string) {
  return `phw:reforgeoverrides:v1:${league}:${slug}`;
}

export function loadReforgeOverrides(league: string, slug: string): ReforgeOverrideMap {
  return readLocalStorage(overridesKey(league, slug), {} as ReforgeOverrideMap);
}

export function saveReforgeOverrides(league: string, slug: string, overrides: ReforgeOverrideMap): void {
  writeLocalStorage(overridesKey(league, slug), overrides);
}

// The technique page's own "buy price / batch size" preview (shown before
// you've logged anything) - one shared value for the whole page, not
// per-item, since the arbitrage is "buy whichever orb is cheapest right
// now" rather than any specific starting type.
export interface ReforgeBuyPreview {
  buy: number;
  quantity: number;
}

function buyPreviewKey(league: string, slug: string) {
  return `phw:reforgebuypreview:v1:${league}:${slug}`;
}

export function loadReforgeBuyPreview(
  league: string,
  slug: string,
  fallback: ReforgeBuyPreview,
): ReforgeBuyPreview {
  return readLocalStorage(buyPreviewKey(league, slug), fallback);
}

export function saveReforgeBuyPreview(league: string, slug: string, preview: ReforgeBuyPreview): void {
  writeLocalStorage(buyPreviewKey(league, slug), preview);
}

// A running tally of what you've actually pulled from reforging, so the
// unknown odds can be estimated from real results. Keyed by outcome item
// name -> count. Derived from ReforgeSession[] below rather than stored
// directly - sessions are the source of truth.
export type ReforgeLogCounts = Record<string, number>;

// One batch of reforges logged through the "Log a session" modal: how many
// reforge operations you actually performed and what each one produced,
// plus the rates you actually used (pre-filled from the live snapshot at
// log time, editable in case that's not what you actually paid/sold for).
// One shared session list for the whole technique, not per starting orb -
// same "shared output pool" assumption as the old flat log.
export interface ReforgeSessionOutcome {
  itemName: string;
  /** How many reforge operations in this session resulted in this outcome. */
  timesPulled: number;
  /** Chaos value of a single unit of this outcome item, editable at log time. */
  pricePerUnit: number;
}

export interface ReforgeSession {
  id: string;
  timestamp: number;
  /** Chaos cost per single starting orb, editable at log time. */
  buyPricePerOrb: number;
  /** Flat chaos cost of the crafting ingredient per reforge operation, editable at log time. */
  ingredientCostPerReforge: number;
  /** Orbs per stack/reforge operation - a full stack converts to this many units of one output type. */
  quantity: number;
  outcomes: ReforgeSessionOutcome[];
}

function reforgeSessionsKey(league: string, slug: string) {
  return `phw:reforgesessions:v1:${league}:${slug}`;
}

export function loadReforgeSessions(league: string, slug: string): ReforgeSession[] {
  return readLocalStorage(reforgeSessionsKey(league, slug), [] as ReforgeSession[]);
}

export function appendReforgeSession(league: string, slug: string, session: ReforgeSession): ReforgeSession[] {
  const next = [session, ...loadReforgeSessions(league, slug)];
  writeLocalStorage(reforgeSessionsKey(league, slug), next);
  return next;
}

export function deleteReforgeSession(league: string, slug: string, sessionId: string): ReforgeSession[] {
  const next = loadReforgeSessions(league, slug).filter((s) => s.id !== sessionId);
  writeLocalStorage(reforgeSessionsKey(league, slug), next);
  return next;
}

export function tallyFromReforgeSessions(sessions: ReforgeSession[]): ReforgeLogCounts {
  const counts: ReforgeLogCounts = {};
  for (const session of sessions) {
    for (const o of session.outcomes) {
      if (o.timesPulled > 0) counts[o.itemName] = (counts[o.itemName] ?? 0) + o.timesPulled;
    }
  }
  return counts;
}

/** Kept for callers (Dashboard) that just want cumulative pull counts, same shape as the old flat tally. */
export function loadReforgeLog(league: string, slug: string): ReforgeLogCounts {
  return tallyFromReforgeSessions(loadReforgeSessions(league, slug));
}

export function reforgeCount(session: ReforgeSession): number {
  return session.outcomes.reduce((sum, o) => sum + o.timesPulled, 0);
}

export function reforgeSessionCost(session: ReforgeSession): number {
  return reforgeCount(session) * (session.buyPricePerOrb * session.quantity + session.ingredientCostPerReforge);
}

export function reforgeSessionValue(session: ReforgeSession): number {
  return session.outcomes.reduce((sum, o) => sum + o.timesPulled * session.quantity * o.pricePerUnit, 0);
}

export function reforgeSessionProfit(session: ReforgeSession): number {
  return reforgeSessionValue(session) - reforgeSessionCost(session);
}

export function totalReforgeProfit(sessions: ReforgeSession[]): number {
  return sessions.reduce((sum, s) => sum + reforgeSessionProfit(s), 0);
}
