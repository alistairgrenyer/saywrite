import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.literal('bearer'),
});

export const AuthStateSchema = z.object({
  authenticated: z.boolean(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type AuthState = z.infer<typeof AuthStateSchema>;
