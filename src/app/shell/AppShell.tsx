/**
 * Main application shell that orchestrates all features
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useRecorder } from '@features/recorder';
import { useTranscript } from '@features/transcript';
import { useSettings } from '@features/settings';
import { useError } from '@shared/hooks/useError';
import { useBubblePosition } from '@shared/layout/useBubblePosition';
import { DraggableBubble } from '../components/DraggableBubble';
import { TranscriptWindow } from '@features/transcript';
import { SettingsPanel } from '@features/settings';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { ContextMenu } from '@shared/components/ContextMenu';
import { authService } from '@shared/lib/auth';
import '@/styles/shared.css';

export function AppShell() {
  const [showSettings, setShowSettings] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [userEmail, setUserEmail] = useState<string>(authService.getAuthState().user?.email || '');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false
  });
  
  // Global error handling
  const { error, setErrorMessage, clearError } = useError();
  
  // Settings management
  const { settings, updateSettings } = useSettings();
  
  // Simplified bubble position management
  const { bubblePosition, updateBubblePosition } = useBubblePosition(
    settings.uiSettings.bubblePosition
  );
  

  // Recording functionality
  const { recordingState, startRecording, stopRecording } = useRecorder({
    sampleRate: settings.audioSettings.sampleRate,
    channels: settings.audioSettings.channels,
    bufferSize: 2048,
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

  const handleLogin = useCallback(async () => {
    try {
      await authService.openLoginPortal();
      setContextMenu(prev => ({ ...prev, visible: false }));
    } catch (error) {
      setErrorMessage('Failed to open login portal');
    }
  }, [setErrorMessage]);

  const handleLogout = useCallback(() => {
    authService.logout();
    setIsAuthenticated(false);
    setUserEmail('');
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // Subscribe to deep-link auth tokens sent from main via preload
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.onAuthTokens) return;
    const unsubscribe = api.onAuthTokens((payload: { accessToken: string; refreshToken: string; expiresAt: number; user?: { id: string; email: string } }) => {
      // Do not log tokens. Persist via authService
      authService.setTokens({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        expiresAt: payload.expiresAt,
      });
      if (payload.user && payload.user.id) {
        authService.setUser({ id: payload.user.id, email: payload.user.email || '' });
        setUserEmail(payload.user.email || '');
      } else {
        // If deep link didn't include user info, fetch profile to populate email/id
        (async () => {
          try {
            const access = await authService.getAccessToken();
            if (!access) return;
            const res = await fetch('https://api.saywrite.nously.io/api/v1/users/me', {
              headers: { Authorization: `Bearer ${access}` },
            });
            if (res.ok) {
              const me = await res.json(); // expects { id, email, ... }
              if (me?.id || me?.email) {
                authService.setUser({ id: String(me.id || ''), email: String(me.email || '') });
                setUserEmail(String(me.email || ''));
              }
            }
          } catch {}
        })();
      }
      setIsAuthenticated(true);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleExit = useCallback(() => {
    // Close the application via Electron IPC
    if ((window as any).electronAPI?.closeApp) {
      (window as any).electronAPI.closeApp();
    } else {
      // Fallback for development/web environment
      window.close();
    }
  }, []);

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
          position={bubblePosition}
          onPositionChange={updateBubblePosition}
          onContextMenu={(x: number, y: number) => setContextMenu({ x, y, visible: true })}
        />
      </div>

      {/* Error display */}
      {error && (
        <ErrorDisplay
          error={error}
          onClose={clearError}
          onRetry={error.type === 'audio' ? handleRetryAudio : undefined}
          bubblePosition={bubblePosition}
        />
      )}

      {/* Transcript window */}
      {transcriptState.text && (
        <TranscriptWindow
          text={transcriptState.text}
          isProcessing={transcriptState.isProcessing}
          onClose={clearTranscript}
          audioData={transcriptState.audioData || undefined}
          recordingDuration={recordingState.duration}
          bubblePosition={bubblePosition}
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

      {/* Context menu - rendered at app level to avoid stacking context issues */}
      <ContextMenu
        items={[
          {
            label: 'Settings',
            icon: '⚙️',
            onClick: () => {
              setShowSettings(true);
              setContextMenu(prev => ({ ...prev, visible: false }));
            }
          },
          ...(isAuthenticated
            ? [
                // Show the signed-in email as an info item
                {
                  label: userEmail || 'Signed in',
                  icon: '👤',
                  onClick: () => setContextMenu(prev => ({ ...prev, visible: false }))
                },
                {
                  label: 'Logout',
                  icon: '🚪',
                  onClick: handleLogout
                }
              ]
            : [
                // Show Login labeled with email if we have one from stored refresh token
                {
                  label: userEmail || 'Login',
                  icon: '🔑',
                  onClick: handleLogin
                }
              ]
          ),
          {
            label: 'Exit',
            icon: '🚪',
            onClick: () => {
              handleExit();
              setContextMenu(prev => ({ ...prev, visible: false }));
            }
          }
        ]}
        isVisible={contextMenu.visible}
        onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        bubblePosition={bubblePosition}
      />
    </>
  );
}
