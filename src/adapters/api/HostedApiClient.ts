import { ApiClient, TranscribeResponse } from '../../core/ports/ApiClient.js';
import { LoginRequest, LoginResponse, AuthState } from '../../core/models/auth.js';
import { RewriteRequest, RewriteResponse } from '../../core/models/rewrite.js';

export class HostedApiClient implements ApiClient {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const result = await window.app.login(request);
    if (!result.success) {
      throw new Error('Login failed');
    }
    // Return a mock response since the actual token is stored in main process
    return { access_token: 'stored-in-main', token_type: 'bearer' };
  }

  async logout(): Promise<void> {
    await window.app.logout();
  }

  async getAuthState(): Promise<AuthState> {
    return await window.app.getAuthState();
  }

  async transcribe(audioBlob: Blob, language?: string): Promise<TranscribeResponse> {
    return await window.app.transcribe(audioBlob, language);
  }

  async rewrite(request: RewriteRequest): Promise<RewriteResponse> {
    return await window.app.rewrite(request);
  }

  onAuthExpired(callback: () => void): void {
    window.app.onAuthExpired(callback);
  }

  removeAuthExpiredListener(callback: () => void): void {
    window.app.removeAuthExpiredListener(callback);
  }
}
