// Small helpers around localStorage that no-op safely during SSR.
//
// Convention: never change what an existing key name means, and never
// abandon one for a new key without migrating it. Renaming a key or
// changing its stored shape is a breaking change for anyone who already has
// data under the old key - "just start reading/writing a new key" silently
// strands whatever they'd logged. Instead:
//   - A straightforward rename/reshape -> migrateLocalStorageKey below.
//   - Several old keys collapsing into one new key (e.g. per-item keys
//     merging into a single shared list), or any other shape that doesn't
//     fit a 1:1 rename -> write a bespoke migration next to the data it
//     migrates, using scanLocalStorageKeys to find every old key regardless
//     of what league/item it belongs to, and removeLocalStorage to clean up
//    only after a successful write to the new key.
// Either way, run it once per app load (see runStorageMigrations in
// storageMigrations.ts) rather than only when the affected page happens to
// be visited.

export function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable (private browsing, etc.) - ignore.
  }
}

export function removeLocalStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Every localStorage key starting with `prefix` - the way to find "all old keys for every league/item" without knowing those values ahead of time. */
export function scanLocalStorageKeys(prefix: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    return keys;
  } catch {
    return [];
  }
}

/**
 * One-time migration for a plain key rename, with an optional shape
 * transform. Safe to call on every app load: once the old key is gone
 * (never existed, or a previous call already migrated it), it's a single
 * localStorage read and nothing else.
 *
 * Never overwrites existing data already under `newKey` - if something's
 * there (a previous migration ran, or the app already wrote fresh data),
 * the old key is left untouched rather than guessed at, so real data is
 * never clobbered.
 */
export function migrateLocalStorageKey<Old, New>(
  oldKey: string,
  newKey: string,
  transform: (old: Old) => New,
): void {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(newKey) !== null) return;
    const raw = window.localStorage.getItem(oldKey);
    if (raw === null) return;
    const migrated = transform(JSON.parse(raw) as Old);
    window.localStorage.setItem(newKey, JSON.stringify(migrated));
    window.localStorage.removeItem(oldKey);
  } catch {
    // Corrupt old data, or storage unavailable - leave both keys as they are.
  }
}
