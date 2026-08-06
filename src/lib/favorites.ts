import { readLocalStorage, writeLocalStorage } from "@/lib/storage";

// A favorited item is identified by which technique it's tracked under (so
// the dashboard knows which reward/category/margin logic to recompute it
// with) plus its own name. Not scoped to a league - which items you care
// about doesn't change when you switch leagues, only their live prices do.
export interface FavoriteItem {
  techniqueSlug: string;
  itemName: string;
}

export type FavoriteMap = Record<string, FavoriteItem>;

const KEY = "phw:favorites:v1";

export function favoriteKey(techniqueSlug: string, itemName: string): string {
  return `${techniqueSlug}::${itemName}`;
}

export function loadFavorites(): FavoriteMap {
  return readLocalStorage(KEY, {} as FavoriteMap);
}

export function saveFavorites(favorites: FavoriteMap): void {
  writeLocalStorage(KEY, favorites);
}
