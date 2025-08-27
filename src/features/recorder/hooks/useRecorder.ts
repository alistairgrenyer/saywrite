/**
 * Hook for managing recording state and audio capture
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioCapture } from '../lib/audioCapture';
import { RecordingState, AudioLevelData } from '@shared/lib/types';
import { ipcClient } from '@shared/lib/ipc-client';

export interface UseRecorderOptions {
  sampleRate?: number;
  channels?: number;
  bufferSize?: number;
  onError?: (error: string) => void;
}

export interface UseRecorderReturn {
  recordingState: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Float32Array | null>;
  dispose: () => void;
}

export const useRecorder = ({
  sampleRate = 16000,
  channels = 1,
  bufferSize = 2048,
  onError
}: UseRecorderOptions = {}): UseRecorderReturn => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isProcessing: false,
    isInitializing: false,
    duration: 0,
    size: 0,
    audioLevel: { rms: 0, peak: 0, timestamp: 0 }
  });

  const audioCapture = useRef<AudioCapture | null>(null);
  const recordingStartTime = useRef<number>(0);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  const handleLevelUpdate = useCallback((level: AudioLevelData) => {
    setRecordingState(prev => ({ ...prev, audioLevel: level }));
  }, []);

  const initializeAudio = async (): Promise<boolean> => {
    if (!audioCapture.current) return false;
    
    try {
      setRecordingState(prev => ({ ...prev, isInitializing: true }));
      await audioCapture.current.initialize();
      audioCapture.current.setLevelCallback(handleLevelUpdate);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to access microphone';
      onError?.(errorMsg);
      return false;
    } finally {
      setRecordingState(prev => ({ ...prev, isInitializing: false }));
    }
  };

  const startRecording = async (): Promise<void> => {
    // Dispose and recreate AudioCapture to ensure clean state
    if (audioCapture.current) {
      audioCapture.current.dispose();
    }
    
    audioCapture.current = new AudioCapture({
      sampleRate,
      channels,
      bufferSize
    });

    const initialized = await initializeAudio();
    if (!initialized) return;

    try {
      // Clear all previous state before starting new recording
      setRecordingState({
        isRecording: false,
        isProcessing: false,
        isInitializing: false,
        duration: 0,
        size: 0,
        audioLevel: { rms: 0, peak: 0, timestamp: 0 }
      });
      
      audioCapture.current.startRecording();
      setRecordingState(prev => ({ ...prev, isRecording: true }));
      recordingStartTime.current = Date.now();
      
      // Start duration timer
      durationInterval.current = setInterval(() => {
        const elapsed = (Date.now() - recordingStartTime.current) / 1000;
        setRecordingState(prev => ({
          ...prev,
          duration: elapsed,
          size: Math.floor(elapsed * sampleRate * 2) // Estimate size: sampleRate * 2 bytes * elapsed seconds
        }));
      }, 100);
      
      ipcClient.startRecording();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start recording';
      onError?.(errorMsg);
    }
  };

  const stopRecording = async (): Promise<Float32Array | null> => {
    if (!audioCapture.current) return null;

    try {
      const pcmData = audioCapture.current.stopRecording();
      setRecordingState(prev => ({ 
        ...prev, 
        isRecording: false,
        audioLevel: { rms: 0, peak: 0, timestamp: 0 }
      }));
      
      // Clear duration timer
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      
      // Send to main process for transcription
      await ipcClient.stopRecording(pcmData);
      
      return pcmData;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to stop recording';
      onError?.(errorMsg);
      setRecordingState(prev => ({ ...prev, isRecording: false }));
      return null;
    }
  };

  const dispose = useCallback(() => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
    if (audioCapture.current) {
      audioCapture.current.dispose();
      audioCapture.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return dispose;
  }, [dispose]);

  return {
    recordingState,
    startRecording,
    stopRecording,
    dispose
  };
};
