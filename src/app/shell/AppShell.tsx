/**
 * Main application shell that orchestrates all features
 */
import React, { useState, useCallback } from 'react';
import { useRecorder } from '@features/recorder';
import { useTranscript } from '@features/transcript';
import { useSettings } from '@features/settings';
import { useError } from '@shared/hooks/useError';
import { usePosition } from '@shared/hooks/usePosition';
import { DraggableBubble } from '../components/DraggableBubble';
import { TranscriptWindow } from '@features/transcript';
import { SettingsPanel } from '@features/settings';
import { ErrorDisplay } from '../components/ErrorDisplay';
import '@/styles/shared.css';

export function AppShell() {
  const [showSettings, setShowSettings] = useState(false);
  
  // Global error handling
  const { error, setErrorMessage, clearError } = useError();
  
  // Settings management
  const { settings, updateSettings } = useSettings();
  
  // Position management for bubble
  const { position: bubblePosition, setPosition: setBubblePosition } = usePosition({
    initialPosition: settings.uiSettings.bubblePosition,
    onPositionChange: (newPosition) => {
      updateSettings({
        uiSettings: { ...settings.uiSettings, bubblePosition: newPosition }
      });
    }
  });

  // Recording functionality
  const { recordingState, startRecording, stopRecording } = useRecorder({
    sampleRate: settings.audioSettings.sampleRate,
    channels: settings.audioSettings.channels,
    bufferSize: settings.audioSettings.bufferSize,
    onError: setErrorMessage
  });

  // Transcript functionality
  const { transcriptState, setProcessing, setAudioData, clearTranscript } = useTranscript({
    onError: setErrorMessage
  });

  const handleToggleRecording = useCallback(async () => {
    if (recordingState.isRecording) {
      setProcessing(true);
      const pcmData = await stopRecording();
      
      if (pcmData) {
        // Convert Float32Array to Int16Array for playback
        const int16Data = new Int16Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          const sample = Math.max(-1, Math.min(1, pcmData[i]));
          int16Data[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }
        setAudioData(int16Data.buffer.slice(0), recordingState.duration);
      }
    } else {
      // Clear previous transcript and audio data when starting new recording
      clearTranscript();
      await startRecording();
    }
  }, [recordingState.isRecording, recordingState.duration, startRecording, stopRecording, setProcessing, setAudioData, clearTranscript]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      handleToggleRecording();
    } else if (event.code === 'Escape' && recordingState.isRecording) {
      event.preventDefault();
      stopRecording();
    }
  }, [handleToggleRecording, recordingState.isRecording, stopRecording]);

  const handleRetryAudio = useCallback(async () => {
    clearError();
    // Try to reinitialize audio
    if (!recordingState.isRecording) {
      await startRecording();
      await stopRecording();
    }
  }, [clearError, recordingState.isRecording, startRecording, stopRecording]);

  return (
    <>
      {/* Global keyboard handler */}
      <div 
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none',
          outline: 'none'
        }}
      >
        {/* Main draggable bubble */}
        <DraggableBubble
          recordingState={recordingState}
          onToggleRecording={handleToggleRecording}
          onOpenSettings={() => setShowSettings(true)}
          position={bubblePosition}
          onPositionChange={setBubblePosition}
        />
      </div>

      {/* Error display */}
      {error && (
        <ErrorDisplay
          error={error}
          bubblePosition={bubblePosition}
          onClose={clearError}
          onRetry={error.type === 'audio' ? handleRetryAudio : undefined}
        />
      )}

      {/* Transcript window */}
      {transcriptState.text && (
        <TranscriptWindow
          text={transcriptState.text}
          isProcessing={transcriptState.isProcessing}
          bubblePosition={bubblePosition}
          onClose={clearTranscript}
          audioData={transcriptState.audioData || undefined}
          recordingDuration={transcriptState.recordingDuration}
        />
      )}

      {/* Settings panel */}
      <SettingsPanel
        settings={settings}
        onUpdateSettings={updateSettings}
        onClose={() => setShowSettings(false)}
        isVisible={showSettings}
        bubblePosition={bubblePosition}
      />
    </>
  );
}
