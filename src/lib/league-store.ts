import { DEFAULT_LEAGUE, LEAGUE_STORAGE_KEY } from "@/lib/leagues";

// Plain external store (not React state) so the league can be read via
// useSyncExternalStore without ever calling setState from an effect.
type Listener = () => void;
const listeners = new Set<Listener>();
let cached: string | null = null;

function readFromStorage(): string {
  if (typeof window === "undefined") return DEFAULT_LEAGUE;
  try {
    const raw = window.localStorage.getItem(LEAGUE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string) : DEFAULT_LEAGUE;
  } catch {
    return DEFAULT_LEAGUE;
  }
}

export function getLeagueSnapshot(): string {
  if (cached === null) cached = readFromStorage();
  return cached;
}

export function getServerLeagueSnapshot(): string {
  return DEFAULT_LEAGUE;
}

export function setLeagueValue(next: string): void {
  cached = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LEAGUE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage full or unavailable - the in-memory cache still updates.
    }
  }
  listeners.forEach((listener) => listener());
}

export function subscribeLeague(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
