import { LoginRequest, LoginResponse, AuthState } from '../models/auth.js';
import { RewriteRequest, RewriteResponse } from '../models/rewrite.js';

export interface ApiClient {
  login(request: LoginRequest): Promise<LoginResponse>;
  logout(): Promise<void>;
  getAuthState(): Promise<AuthState>;
  rewrite(request: RewriteRequest): Promise<RewriteResponse>;
  onAuthExpired(callback: () => void): void;
  removeAuthExpiredListener(callback: () => void): void;
}
