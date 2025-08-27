/**
 * Hook for managing error state across features
 */
import { useState, useCallback } from 'react';
import { AppError } from '../lib/types';

export interface UseErrorReturn {
  error: AppError | null;
  setError: (error: AppError | null) => void;
  clearError: () => void;
  setErrorMessage: (message: string, type?: AppError['type']) => void;
}

export const useError = (): UseErrorReturn => {
  const [error, setErrorState] = useState<AppError | null>(null);

  const setError = useCallback((error: AppError | null) => {
    setErrorState(error);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const setErrorMessage = useCallback((message: string, type: AppError['type'] = 'general') => {
    setErrorState({ message, type });
  }, []);

  return {
    error,
    setError,
    clearError,
    setErrorMessage
  };
};
