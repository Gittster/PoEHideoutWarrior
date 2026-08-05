"use client";

import { useState } from "react";
import { useLeague } from "@/lib/league-context";
import { SUGGESTED_LEAGUES } from "@/lib/leagues";

export default function ConfigPage() {
  const { league, setLeague } = useLeague();
  const [draft, setDraft] = useState(league);
  const [saved, setSaved] = useState(false);

  const save = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setLeague(trimmed);
    setDraft(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">Config</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Set the league used for live poe.ninja prices across the whole site. This is stored only
        in your browser.
      </p>

      <form
        className="mt-6 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          save(draft);
        }}
      >
        <label className="text-sm text-[var(--muted)]" htmlFor="league-input">
          League name
        </label>
        <input
          id="league-input"
          list="league-suggestions"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          placeholder="e.g. Allflame"
        />
        <datalist id="league-suggestions">
          {SUGGESTED_LEAGUES.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <button
          type="submit"
          className="mt-1 self-start rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#141414] hover:brightness-110"
        >
          Save league
        </button>
        {saved && <span className="text-sm text-[var(--good)]">Saved.</span>}
      </form>

      <p className="mt-6 text-xs text-[var(--muted)]">
        This must match the league name poe.ninja uses internally (e.g. the current challenge
        league or &quot;Standard&quot;) - if prices fail to load, double-check the exact spelling
        on poe.ninja&apos;s own site.
      </p>
    </div>
  );
}
