import { readLocalStorage, writeLocalStorage } from "@/lib/storage";

// A boss fight can drop several of these possible rewards in the same
// kill (or none), unlike a divination card stack/reforge which always
// resolves to exactly one outcome - so each outcome's count is independent
// rather than all summing to the number of fights. "Your odds" for an
// outcome is therefore timesReceived / fightsRun, not timesReceived /
// (sum of every outcome's timesReceived).
export interface BossSessionOutcome {
  rewardName: string;
  /** How many of this session's fights dropped this reward. */
  timesReceived: number;
  /** Chaos value credited per single drop of this outcome, editable at log time. */
  valuePerOccurrence: number;
}

export interface BossSession {
  id: string;
  timestamp: number;
  /** How many times you ran/fought this encounter in this session. */
  fightsRun: number;
  /** Total chaos cost of the fragment(s) consumed per single fight, editable at log time. */
  costPerFight: number;
  outcomes: BossSessionOutcome[];
}

function sessionsKey(league: string, encounterSlug: string) {
  return `phw:bosssessions:v1:${league}:${encounterSlug}`;
}

export function loadBossSessions(league: string, encounterSlug: string): BossSession[] {
  return readLocalStorage(sessionsKey(league, encounterSlug), [] as BossSession[]);
}

export function appendBossSession(league: string, encounterSlug: string, session: BossSession): BossSession[] {
  const next = [session, ...loadBossSessions(league, encounterSlug)];
  writeLocalStorage(sessionsKey(league, encounterSlug), next);
  return next;
}

export function deleteBossSession(league: string, encounterSlug: string, sessionId: string): BossSession[] {
  const next = loadBossSessions(league, encounterSlug).filter((s) => s.id !== sessionId);
  writeLocalStorage(sessionsKey(league, encounterSlug), next);
  return next;
}

export function bossSessionCost(session: BossSession): number {
  return session.fightsRun * session.costPerFight;
}

export function bossSessionValue(session: BossSession): number {
  return session.outcomes.reduce((sum, o) => sum + o.timesReceived * o.valuePerOccurrence, 0);
}

export function bossSessionProfit(session: BossSession): number {
  return bossSessionValue(session) - bossSessionCost(session);
}

export function totalBossProfit(sessions: BossSession[]): number {
  return sessions.reduce((sum, s) => sum + bossSessionProfit(s), 0);
}

export function totalFightsRun(sessions: BossSession[]): number {
  return sessions.reduce((sum, s) => sum + s.fightsRun, 0);
}

/** Cumulative "times received" per reward name, across every logged session. */
export function tallyBossOutcomes(sessions: BossSession[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const session of sessions) {
    for (const o of session.outcomes) {
      if (o.timesReceived > 0) counts[o.rewardName] = (counts[o.rewardName] ?? 0) + o.timesReceived;
    }
  }
  return counts;
}
