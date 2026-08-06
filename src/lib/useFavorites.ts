"use client";

import { useCallback, useState } from "react";
import { favoriteKey, loadFavorites, saveFavorites, type FavoriteItem, type FavoriteMap } from "@/lib/favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteMap>(() => loadFavorites());

  const toggle = useCallback((item: FavoriteItem) => {
    setFavorites((prev) => {
      const key = favoriteKey(item.techniqueSlug, item.itemName);
      const next = { ...prev };
      if (key in next) {
        delete next[key];
      } else {
        next[key] = item;
      }
      saveFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (techniqueSlug: string, itemName: string) => favoriteKey(techniqueSlug, itemName) in favorites,
    [favorites],
  );

  return { favorites, toggle, isFavorite };
}
