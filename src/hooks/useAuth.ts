import { useState, useEffect, useCallback } from 'react';
import { HostedApiClient } from '../adapters/api/HostedApiClient.js';
import { LoginRequest, AuthState } from '../core/models/auth.js';

const apiClient = new HostedApiClient();

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({ authenticated: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthState = useCallback(async () => {
    try {
      const state = await apiClient.getAuthState();
      setAuthState(state);
    } catch (err) {
      console.error('Failed to check auth state:', err);
      setAuthState({ authenticated: false });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (request: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await apiClient.login(request);
      setAuthState({ authenticated: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.logout();
      setAuthState({ authenticated: false });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAuthExpired = useCallback(() => {
    setAuthState({ authenticated: false });
    setError('Your session has expired. Please sign in again.');
  }, []);

  useEffect(() => {
    checkAuthState();
    
    // Listen for auth expiration
    apiClient.onAuthExpired(handleAuthExpired);
    
    return () => {
      apiClient.removeAuthExpiredListener(handleAuthExpired);
    };
  }, [checkAuthState, handleAuthExpired]);

  return {
    authState,
    isLoading,
    error,
    login,
    logout,
    clearError: () => setError(null)
  };
};
