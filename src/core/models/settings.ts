import { z } from 'zod';

export const SettingsSchema = z.object({
  apiBaseUrl: z.string().url().default('https://api.saywrite.nously.io'),
});

export type Settings = z.infer<typeof SettingsSchema>;
