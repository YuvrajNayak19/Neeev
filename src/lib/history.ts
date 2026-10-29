import type { Assignment } from "./substitution";

export type SavedSchedule = {
  date: string;
  savedAt: string;
  rows: Assignment[];
};

const KEY = "neev.savedSchedules";

export function loadSaved(): SavedSchedule[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedSchedule[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(list: SavedSchedule[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

/** Upserts by date (one saved schedule per day) and returns the new list. */
export function saveSchedule(date: string, rows: Assignment[]): SavedSchedule[] {
  const entry: SavedSchedule = { date, savedAt: new Date().toISOString(), rows };
  const next = [entry, ...loadSaved().filter((s) => s.date !== date)].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  persist(next);
  return next;
}

export function deleteSaved(date: string): SavedSchedule[] {
  const next = loadSaved().filter((s) => s.date !== date);
  persist(next);
  return next;
}
