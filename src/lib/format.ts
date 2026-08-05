export function formatChaos(value: number): string {
  if (!Number.isFinite(value)) return "-";
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (value >= 10) return value.toFixed(1);
  return value.toFixed(2);
}
