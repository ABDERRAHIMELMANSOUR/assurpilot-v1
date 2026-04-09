// src/lib/utils.ts — Shared formatting utilities

const fullDateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/**
 * Format a date as DD/MM/YYYY HH:mm:ss (French locale).
 * Handles null, undefined, empty string, and invalid dates gracefully.
 */
export function formatGlobalDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";
  return fullDateFmt.format(d);
}

/**
 * Format seconds as M:SS (e.g. 374 → "6:14").
 */
export function formatDuration(s: number): string {
  if (!s) return "—";
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}