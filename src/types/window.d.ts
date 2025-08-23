import { LoginRequest, AuthState } from '../core/models/auth.js';
import { RewriteRequest, RewriteResponse } from '../core/models/rewrite.js';

declare global {
  interface Window {
    app: {
      login(request: LoginRequest): Promise<{ ok: true } | { ok: false; error: string }>;
      logout(): Promise<void>;
      getAuthState(): Promise<AuthState>;
      rewrite(request: RewriteRequest): Promise<RewriteResponse>;
      onAuthExpired(callback: () => void): void;
      removeAuthExpiredListener(callback: () => void): void;
    };
  }
}

export {};
