/**
 * Recording button component with visual states
 */
import React from 'react';
import { RecordingState } from '@shared/lib/types';
import '@/styles/shared.css';

interface RecordingButtonProps {
  recordingState: RecordingState;
  onToggleRecording: (e?: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

export function RecordingButton({ 
  recordingState, 
  onToggleRecording, 
  disabled = false,
  className = ''
}: RecordingButtonProps) {
  const { isRecording, isInitializing } = recordingState;
  
  const buttonClass = `main-mic-button ${isRecording ? 'recording' : 'idle'} ${isInitializing ? 'initializing' : ''} ${className}`;
  
  return (
    <button
      onClick={(e) => onToggleRecording(e)}
      disabled={disabled || isInitializing}
      className={buttonClass}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isRecording ? (
        <div className="recording-indicator">
          <div className="pulse-ring"></div>
          <div className="recording-dot"></div>
        </div>
      ) : (
        <div className="mic-icon">
          {!isInitializing && '🎤'}
          {isInitializing && '⏳'}
        </div>
      )}
    </button>
  );
}
