import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { readingSchema } from './lib/schema';

const readings = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/readings' }),
  schema: readingSchema,
});

export const collections = { readings };
