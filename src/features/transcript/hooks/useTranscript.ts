/**
 * Hook for managing transcript state and STT results
 */
import { useState, useEffect, useCallback } from 'react';
import { TranscriptState } from '@shared/lib/types';
import { ipcClient } from '@shared/lib/ipc-client';

export interface UseTranscriptOptions {
  onError?: (error: string) => void;
}

export interface UseTranscriptReturn {
  transcriptState: TranscriptState;
  setProcessing: (isProcessing: boolean) => void;
  setAudioData: (audioData: ArrayBuffer | null, duration: number) => void;
  clearTranscript: () => void;
  updateText: (text: string) => void;
}

export const useTranscript = ({ onError }: UseTranscriptOptions = {}): UseTranscriptReturn => {
  const [transcriptState, setTranscriptState] = useState<TranscriptState>({
    text: '',
    isProcessing: false,
    audioData: null,
    recordingDuration: 0
  });

  const setProcessing = useCallback((isProcessing: boolean) => {
    setTranscriptState(prev => ({ ...prev, isProcessing }));
  }, []);

  const setAudioData = useCallback((audioData: ArrayBuffer | null, duration: number) => {
    setTranscriptState(prev => ({ 
      ...prev, 
      audioData, 
      recordingDuration: duration 
    }));
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscriptState({
      text: '',
      isProcessing: false,
      audioData: null,
      recordingDuration: 0
    });
  }, []);

  const updateText = useCallback((text: string) => {
    setTranscriptState(prev => ({ ...prev, text }));
  }, []);

  // Set up IPC listeners for STT results
  useEffect(() => {
    const handleFinal = (text: string) => {
      setTranscriptState(prev => ({
        ...prev,
        text,
        isProcessing: false
      }));
    };

    const handleError = (error: string) => {
      setTranscriptState(prev => ({ ...prev, isProcessing: false }));
      onError?.(error);
    };

    ipcClient.onFinal(handleFinal);
    ipcClient.onSTTError(handleError);

    // Note: IPC listeners are persistent, no cleanup needed
  }, [onError]);

  return {
    transcriptState,
    setProcessing,
    setAudioData,
    clearTranscript,
    updateText
  };
};
