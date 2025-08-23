// @ts-ignore - Ignore zod module resolution issues
import { z } from 'zod';

// Zod schema for validation
export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  tone: z.string(),
  constraints: z.array(z.string()),
  format: z.string().optional(),
  audience: z.string().optional(),
  glossary: z.record(z.string()).optional(),
  max_words: z.number().optional(),
});

// TypeScript type derived from the schema
export type Profile = z.infer<typeof ProfileSchema>;
