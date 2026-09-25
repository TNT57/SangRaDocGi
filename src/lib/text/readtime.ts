import type { Form } from '../../config/genres';
import speed from '../../../data/reading-speed.json';

/**
 * CLAUDE.md §8.4: read time = syllables ÷ measured speed.
 * `data/reading-speed.json` holds Nathan's measured averages (syllables per minute).
 * Until he measures, the file says `measured: false` and §8.5 item 7 fails for every reading.
 */
export type ReadingSpeed = {
  measured: boolean;
  proseSyllablesPerMinute: number;
  verseSyllablesPerMinute: number;
  measuredBy: string | null;
  measuredOn: string | null;
  note?: string;
};

export const readingSpeed: ReadingSpeed = speed;

export function readSeconds(syllables: number, form: Form, s: ReadingSpeed = readingSpeed): number {
  const perMinute = form === 'prose' ? s.proseSyllablesPerMinute : s.verseSyllablesPerMinute;
  return Math.round((syllables / perMinute) * 60);
}

/** Whole minutes shown on cards. Under 30 s shows "< 1 phút". */
export function displayMinutes(seconds: number): number {
  return seconds < 30 ? 0 : Math.max(1, Math.round(seconds / 60));
}
