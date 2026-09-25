import { getCollection } from 'astro:content';
import fame from '../../data/fame.json';
import { readingSpeed } from './text/readtime';
import { buildViews, type FameTable, type ReadingView } from './readings';

/**
 * Drafts show up in `astro dev` and in builds with INCLUDE_DRAFTS=1 (private previews only).
 * A normal production build ships only readings that pass CLAUDE.md §8.5.
 */
export const includeDrafts = import.meta.env.DEV || process.env.INCLUDE_DRAFTS === '1';

let cache: Promise<ReadingView[]> | null = null;

export function loadPool(): Promise<ReadingView[]> {
  cache ??= getCollection('readings').then((entries) =>
    buildViews(
      entries.map((e) => ({ slug: e.id, data: e.data, body: e.body ?? '' })),
      fame as FameTable,
      readingSpeed,
      includeDrafts,
    ),
  );
  return cache;
}
