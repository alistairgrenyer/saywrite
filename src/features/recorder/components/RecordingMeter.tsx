/**
 * Recording meter component with waveform visualization
 * Moved from src/components/RecordingMeter.tsx
 */
import React from 'react';
import { AudioLevelData } from '@shared/lib/types';
import { formatDuration, formatFileSize } from '@shared/lib/utils';
import '@/styles/shared.css';
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
        <span className="size">{formatFileSize(recordingSize)}</span>
      </div>
    </div>
  );
}
