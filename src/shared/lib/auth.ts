/**
 * Authentication service for handling login flow and token management
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  tokens: AuthTokens | null;
  user: {
    id: string;
    email: string;
  } | null;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    tokens: null,
    user: null
  };

  private readonly LOGIN_URL = 'https://app.saywrite.com/auth/login';
  private readonly REFRESH_URL = 'https://api.saywrite.com/auth/refresh';
  private readonly TOKEN_STORAGE_KEY = 'saywrite_auth_tokens';
  private readonly USER_STORAGE_KEY = 'saywrite_user';

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.loadStoredAuth();
  }

  /**
   * Open login portal in user's default browser
   */
  async openLoginPortal(): Promise<void> {
    try {
      // Use Electron IPC if available
      if ((window as any).electronAPI?.openExternal) {
        await (window as any).electronAPI.openExternal(this.LOGIN_URL);
      } else {
        // Fallback for web environment
        window.open(this.LOGIN_URL, '_blank');
      }
    } catch (error) {
      console.error('Failed to open login portal:', error);
      throw new Error('Failed to open login portal');
    }
  }

  /**
   * Store authentication tokens
   */
  setTokens(tokens: AuthTokens): void {
    this.authState.tokens = tokens;
    this.authState.isAuthenticated = true;
    
    try {
      localStorage.setItem(this.TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.error('Failed to store auth tokens:', error);
    }
  }

  /**
   * Store user information
   */
  setUser(user: { id: string; email: string }): void {
    this.authState.user = user;
    
    try {
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user info:', error);
    }
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Get access token if available and not expired
   * Automatically attempts to refresh if expired
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.authState.tokens) return null;
    
    const now = Date.now();
    if (now >= this.authState.tokens.expiresAt) {
      // Token expired, try to refresh
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        // Refresh failed, user needs to login again
        this.logout();
        return null;
      }
    }
    
    return this.authState.tokens.accessToken;
  }

  /**
   * Get access token synchronously (without refresh attempt)
   */
  getAccessTokenSync(): string | null {
    if (!this.authState.tokens) return null;
    
    const now = Date.now();
    if (now >= this.authState.tokens.expiresAt) {
      return null;
    }
    
    return this.authState.tokens.accessToken;
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return this.authState.tokens?.refreshToken || null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && this.getAccessTokenSync() !== null;
  }

  /**
   * Logout user and clear stored data
   */
  logout(): void {
    this.authState = {
      isAuthenticated: false,
      tokens: null,
      user: null
    };

    try {
      localStorage.removeItem(this.TOKEN_STORAGE_KEY);
      localStorage.removeItem(this.USER_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  /**
   * Load stored authentication data on initialization
   */
  private loadStoredAuth(): void {
    try {
      const storedTokens = localStorage.getItem(this.TOKEN_STORAGE_KEY);
      const storedUser = localStorage.getItem(this.USER_STORAGE_KEY);

      if (storedTokens) {
        const tokens: AuthTokens = JSON.parse(storedTokens);
        const now = Date.now();
        
        // Check if access token is still valid
        if (now < tokens.expiresAt) {
          this.authState.tokens = tokens;
          this.authState.isAuthenticated = true;
        }
      }

      if (storedUser) {
        this.authState.user = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Failed to load stored auth data:', error);
      // Clear corrupted data
      this.logout();
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(this.REFRESH_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        console.error('Refresh token request failed:', response.status, response.statusText);
        return false;
      }

      const data = await response.json();
      
      // Expected response format: { accessToken: string, refreshToken: string, expiresIn: number }
      if (data.accessToken && data.refreshToken && data.expiresIn) {
        const newTokens: AuthTokens = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: Date.now() + (data.expiresIn * 1000) // Convert seconds to milliseconds
        };

        this.setTokens(newTokens);
        console.log('Access token refreshed successfully');
        return true;
      } else {
        console.error('Invalid refresh response format:', data);
        return false;
      }
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      return false;
    }
  }
}

export const authService = AuthService.getInstance();
