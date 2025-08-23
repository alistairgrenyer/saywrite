import { z } from 'zod';
import { ProfileSchema } from './profile.js';

export const RewriteOptionsSchema = z.object({
  temperature: z.number().default(0.5),
  provider_hint: z.string().default('openai'),
});

export const RewriteRequestSchema = z.object({
  transcript: z.string(),
  profile: ProfileSchema,
  options: RewriteOptionsSchema,
});

export const RewriteUsageSchema = z.object({
  stt_ms: z.number(),
  llm_ms: z.number(),
});

export const RewriteResponseSchema = z.object({
  draft: z.string(),
  usage: RewriteUsageSchema,
});

export type RewriteOptions = z.infer<typeof RewriteOptionsSchema>;
export type RewriteRequest = z.infer<typeof RewriteRequestSchema>;
export type RewriteUsage = z.infer<typeof RewriteUsageSchema>;
export type RewriteResponse = z.infer<typeof RewriteResponseSchema>;
