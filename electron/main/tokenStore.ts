import * as keytar from 'keytar';

const SERVICE_NAME = 'saywrite';
const ACCOUNT_NAME = 'default';

export class TokenStore {
  private cachedToken: string | null = null;

  constructor() {
    // Initialize with dev token if available
    this.initializeDevToken();
  }

  private initializeDevToken(): void {
    // Check CLI args first (highest priority)
    const cliToken = this.getCliToken();
    if (cliToken) {
      this.cachedToken = cliToken;
      return;
    }

    // Check environment variable
    const envToken = process.env.DEV_JWT;
    if (envToken) {
      this.cachedToken = envToken;
      return;
    }
  }

  private getCliToken(): string | null {
    const args = process.argv;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--dev-token=')) {
        return arg.split('=')[1];
      }
      if (arg === '--dev-token' && i + 1 < args.length) {
        return args[i + 1];
      }
    }
    return null;
  }

  async getToken(): Promise<string | null> {
    // Return cached token if available (dev override)
    if (this.cachedToken) {
      return this.cachedToken;
    }

    // Try to get from keytar
    try {
      const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      return token;
    } catch (error) {
      console.error('Failed to get token from keytar:', error);
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    // Don't store dev tokens in keytar
    if (this.isDevToken()) {
      this.cachedToken = token;
      return;
    }

    try {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
      this.cachedToken = null; // Clear cache to use keytar
    } catch (error) {
      console.error('Failed to set token in keytar:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  async clearToken(): Promise<void> {
    // Clear cached token
    this.cachedToken = null;

    // Clear from keytar
    try {
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    } catch (error) {
      console.error('Failed to clear token from keytar:', error);
      // Don't throw here as clearing should be best-effort
    }
  }

  private isDevToken(): boolean {
    return !!(process.env.DEV_JWT || this.getCliToken());
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}
