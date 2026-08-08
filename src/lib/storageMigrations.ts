import { migrateLegacyCardLogs } from "@/lib/arbitrage/weightedCardData";
import { migrateLegacyReforgeLogs } from "@/lib/arbitrage/deliriumReforgeData";

// Runs every one-time localStorage migration. Each migration only touches
// its own legacy key prefix and becomes a no-op once those keys are gone,
// so this is safe (and cheap) to call on every app load rather than only
// once. Called from LeagueProvider, which mounts once for the whole app -
// this sweeps every league/item, not just whatever page happened to load
// first.
export function runStorageMigrations(): void {
  migrateLegacyCardLogs();
  migrateLegacyReforgeLogs();
}
