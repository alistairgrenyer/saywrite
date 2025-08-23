import { z } from 'zod';

export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  tone: z.string(),
  constraints: z.array(z.string()),
  format: z.string().optional(),
  audience: z.string().optional(),
  glossary: z.record(z.string()).optional(),
  max_words: z.number().optional().default(350),
});

export type Profile = z.infer<typeof ProfileSchema>;
