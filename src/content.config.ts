import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const publications = defineCollection({
  loader: glob({ base: './src/content/publications', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().min(1),
    authors: z.array(z.string().min(1)).min(1),
    year: z.number().int().min(2000).max(2100),
    status: z.enum(['Preprint', 'Published']),
    venue: z.string().min(1),
    citationLabel: z.string().min(1),
    publicationUrl: z.url(),
    codeUrl: z.url().optional(),
    summary: z.string().min(1),
    selected: z.boolean().default(false),
    instrument: z.enum(['route', 'measurement']).optional(),
    award: z.string().optional(),
    bibtex: z.string().min(1),
  }),
});
export const collections = { publications };
