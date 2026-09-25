import { z } from 'astro/zod';
import { THEME_IDS } from '../config/themes';
import { FORMS, GENRE_IDS } from '../config/genres';

/**
 * Front matter of one reading file (src/content/readings/<slug>.md).
 * Drafts may leave proofread/review/heavy/copyright empty. The §8.5 checklist
 * (src/lib/checklist.ts) decides what may go live.
 */
const day = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.date()])
  .transform((v) => (typeof v === 'string' ? v : v.toISOString().slice(0, 10)));

const person = z.object({
  name: z.string().min(1),
  born: z.number().int().nullable().optional(),
  /** Death year. null = living or unknown (treated as protected). */
  died: z.number().int().nullable(),
  /** Anonymous folk work ("Dân gian"): free everywhere. */
  folk: z.boolean().optional(),
  /** Years are traditional estimates (shown as "khoảng"). */
  approx: z.boolean().optional(),
});

const status = z.enum(['free', 'protected']);

export const readingSchema = z.object({
  title: z.string().min(1),
  status: z.enum(['draft', 'published']),
  theme: z.enum(THEME_IDS),
  genre: z.enum(GENRE_IDS),
  form: z.enum(FORMS),
  authors: z.array(person).min(1),
  translators: z.array(person).default([]),
  retellers: z.array(person).default([]),
  source: z.object({
    name: z.string().min(1),
    url: z.url().nullable(),
    revision: z.union([z.string(), z.number()]).nullable().optional(),
    edition: z.string().nullable().optional(),
  }),
  /** Stored copyright flags (§8.5 item 2). Must never be looser than the computed rule. */
  copyright: z.object({ vn: status, au: status, us: status }).nullable(),
  /** "Nội dung nặng" tag. null = not decided yet (§8.5 item 8 fails). */
  heavy: z.boolean().nullable(),
  /** One sentence written by Nathan. Never copied from a textbook. */
  hook: z.string().nullable().optional(),
  proofread: z.object({ against: z.string().min(1), by: z.string().min(1), date: day }).nullable(),
  review: z.object({ by: z.string().min(1), date: day }).nullable(),
  notes: z.string().optional(),
});

export type ReadingData = z.output<typeof readingSchema>;
export type PersonData = z.output<typeof person>;
