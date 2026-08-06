"use client";

export function FavoriteButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={active ? "Remove from favorites" : "Add to favorites"}
      className={`text-sm leading-none ${
        active ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {active ? "★" : "☆"}
    </button>
  );
}
