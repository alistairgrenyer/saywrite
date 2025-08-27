import React from 'react';
import { AudioLevelData } from '../utils/audioCapture';
import '../styles/shared.css';
import './RecordingMeter.css';

interface RecordingMeterProps {
  audioLevel: AudioLevelData;
  recordingDuration: number;
  recordingSize: number;
  isVisible: boolean;
}

export function RecordingMeter({ 
  audioLevel, 
  recordingDuration, 
  recordingSize, 
  isVisible 
}: RecordingMeterProps) {
  if (!isVisible) return null;

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };
  
  // Generate waveform bars based on audio level
  const generateWaveformBars = () => {
    const bars = [];
    const barCount = 20;
    const baseHeight = 2;
    const maxHeight = 20;
    
    for (let i = 0; i < barCount; i++) {
      // Create a wave pattern with some randomness based on audio level
      const waveOffset = Math.sin((i / barCount) * Math.PI * 2) * 0.5 + 0.5;
      const levelMultiplier = audioLevel.rms * 100 + 0.1;
      const height = baseHeight + (waveOffset * levelMultiplier * (maxHeight - baseHeight));
      
      bars.push(
        <div
          key={i}
          className="waveform-bar"
          style={{
            height: `${Math.max(baseHeight, Math.min(maxHeight, height))}px`,
            animationDelay: `${i * 0.1}s`
          }}
        />
      );
    }
    return bars;
  };

  return (
    <div className="recording-meter">
      <div className="waveform">
        {generateWaveformBars()}
      </div>
      <div className="recording-stats">
        <span className="duration">{formatDuration(recordingDuration)}</span>
        <span className="size">{formatSize(recordingSize)}</span>
      </div>
    </div>
  );
}
