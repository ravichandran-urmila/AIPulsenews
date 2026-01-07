import { BriefData } from '../types';

const DB_PREFIX = 'ai_pulse_edition_';

/**
 * Simulates saving the daily brief to a backend database.
 */
export const saveBrief = (dateStr: string, data: BriefData): void => {
  try {
    const record = {
      ...data,
      timestamp: Date.now(), // update timestamp on save
    };
    localStorage.setItem(`${DB_PREFIX}${dateStr}`, JSON.stringify(record));
    console.log(`[DB] Saved brief for ${dateStr}`);
  } catch (e) {
    console.error("Failed to save brief to storage", e);
  }
};

/**
 * Simulates retrieving a specific day's brief from the database.
 */
export const getBrief = (dateStr: string): BriefData | null => {
  try {
    const item = localStorage.getItem(`${DB_PREFIX}${dateStr}`);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error("Failed to load brief from storage", e);
    return null;
  }
};

/**
 * Returns a list of all dates that have stored briefs.
 * Useful for the "Archives" dropdown.
 */
export const getAvailableEditions = (): string[] => {
  try {
    const keys = Object.keys(localStorage);
    const dates = keys
      .filter(k => k.startsWith(DB_PREFIX))
      .map(k => k.replace(DB_PREFIX, ''))
      // Sort descending (newest first)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return dates;
  } catch (e) {
    return [];
  }
};

/**
 * Helper to check if we need to run the "Nightly Job".
 * Returns true if no data exists for today.
 */
export const shouldRunNightlyJob = (todayStr: string): boolean => {
  return !localStorage.getItem(`${DB_PREFIX}${todayStr}`);
};