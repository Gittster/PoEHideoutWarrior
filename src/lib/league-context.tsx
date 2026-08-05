"use client";

import { createContext, useContext, useSyncExternalStore, ReactNode } from "react";
import {
  getLeagueSnapshot,
  getServerLeagueSnapshot,
  setLeagueValue,
  subscribeLeague,
} from "@/lib/league-store";

interface LeagueContextValue {
  league: string;
  setLeague: (league: string) => void;
}

const LeagueContext = createContext<LeagueContextValue | null>(null);

export function LeagueProvider({ children }: { children: ReactNode }) {
  const league = useSyncExternalStore(subscribeLeague, getLeagueSnapshot, getServerLeagueSnapshot);

  return (
    <LeagueContext.Provider value={{ league, setLeague: setLeagueValue }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const ctx = useContext(LeagueContext);
  if (!ctx) throw new Error("useLeague must be used within a LeagueProvider");
  return ctx;
}
