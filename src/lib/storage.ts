import type { DailyState } from './daily';

/**
 * Browser storage (CLAUDE.md §5.6: no accounts). Versioned keys. Every value read back is
 * validated. If storage is blocked, values live in memory for this visit and the site still works.
 */
const PREFIX = 'ketsach:v1:';
const memory = new Map<string, string>();

function getRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function setRaw(key: string, value: string): void {
  memory.set(key, value);
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch {
    /* blocked or full: memory copy is enough for this visit */
  }
}

function readJson(key: string): unknown {
  const raw = getRaw(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const SLUG = /^[a-z0-9-]{1,80}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function isSlugList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 5000 && value.every((v) => typeof v === 'string' && SLUG.test(v));
}

export function isDailyState(value: unknown): value is DailyState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.day === 'string' && DAY.test(v.day) && isSlugList(v.opens) && v.opens.length <= 100;
}

export function loadOpened(): Set<string> {
  const value = readJson('opened');
  return new Set(isSlugList(value) ? value : []);
}

export function saveOpened(opened: Set<string>): void {
  setRaw('opened', JSON.stringify([...opened]));
}

export function loadDaily(): DailyState | null {
  const value = readJson('daily');
  return isDailyState(value) ? value : null;
}

export function saveDaily(state: DailyState): void {
  setRaw('daily', JSON.stringify(state));
}

export function loadDay(key: 'first-visit' | 'last-active'): string | null {
  const value = readJson(key);
  return typeof value === 'string' && DAY.test(value) ? value : null;
}

export function saveDay(key: 'first-visit' | 'last-active', day: string): void {
  setRaw(key, JSON.stringify(day));
}

/** Test helper: forget the in-memory fallback. */
export function _resetMemory(): void {
  memory.clear();
}
