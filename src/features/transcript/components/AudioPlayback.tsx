/**
 * Audio playback component with waveform visualization
 * Moved from src/components/AudioPlayback.tsx
 */
import React, { useRef, useEffect, useState } from 'react';
import { formatDuration } from '@shared/lib/utils';
import '@/styles/shared.css';
import './AudioPlayback.css';

interface AudioPlaybackProps {
  audioData: ArrayBuffer;
  duration: number;
}

export function AudioPlayback({ audioData, duration }: AudioPlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Convert PCM data to proper WAV format with correct endianness
  useEffect(() => {
    if (!audioData) return;

    const createWavFile = (pcmData: ArrayBuffer) => {
      const pcmArray = new Int16Array(pcmData);
      // Use the actual sample rate from audio context for playback
      const sampleRate = 16000; // This should match the resampled rate
      const numChannels = 1;
      const bitsPerSample = 16;
      const bytesPerSample = bitsPerSample / 8;
      const blockAlign = numChannels * bytesPerSample;
      const byteRate = sampleRate * blockAlign;
      const dataSize = pcmArray.length * bytesPerSample;
      const fileSize = 36 + dataSize;
      
      const buffer = new ArrayBuffer(44 + dataSize);
      const view = new DataView(buffer);
      
      // RIFF chunk descriptor
      view.setUint32(0, 0x52494646, false); // "RIFF"
      view.setUint32(4, fileSize, true); // File size - 8
      view.setUint32(8, 0x57415645, false); // "WAVE"
      
      // fmt sub-chunk
      view.setUint32(12, 0x666d7420, false); // "fmt "
      view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
      view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
      view.setUint16(22, numChannels, true); // NumChannels
      view.setUint32(24, sampleRate, true); // SampleRate
      view.setUint32(28, byteRate, true); // ByteRate
      view.setUint16(32, blockAlign, true); // BlockAlign
      view.setUint16(34, bitsPerSample, true); // BitsPerSample
      
      // data sub-chunk
      view.setUint32(36, 0x64617461, false); // "data"
      view.setUint32(40, dataSize, true); // Subchunk2Size
      
      // Write PCM data with proper endianness
      const pcmView = new Int16Array(buffer, 44);
      for (let i = 0; i < pcmArray.length; i++) {
        pcmView[i] = pcmArray[i];
      }
      
      return buffer;
    };

    try {
      const wavData = createWavFile(audioData);
      const blob = new Blob([wavData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      // Debug: Log audio info
      console.log('Created WAV file:', {
        originalSize: audioData.byteLength,
        wavSize: wavData.byteLength,
        sampleRate: 16000,
        duration: (new Int16Array(audioData).length / 16000).toFixed(2) + 's',
        samples: new Int16Array(audioData).length
      });
      
      // Test if audio data has actual content
      const samples = new Int16Array(audioData);
      const hasContent = samples.some(sample => Math.abs(sample) > 100);
      const maxSample = Math.max(...Array.from(samples).map(Math.abs));
      console.log('Audio has content:', hasContent, 'Max sample:', maxSample, 'Sample rate in WAV:', 16000);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (error) {
      console.error('Error creating WAV file:', error);
    }
  }, [audioData]);

  // Draw waveform visualization
  useEffect(() => {
    if (!audioData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pcmArray = new Int16Array(audioData);
    const width = canvas.width;
    const height = canvas.height;
    
    const drawWaveform = (showPausedPosition = false) => {
      ctx.clearRect(0, 0, width, height);
      
      const progress = audioRef.current ? currentTime / audioRef.current.duration : 0;
      const progressWidth = width * progress;
      
      // Draw waveform bars
      const samplesPerPixel = Math.floor(pcmArray.length / width);
      const barWidth = Math.max(1, width / Math.min(width, 200)); // Limit bars for performance
      
      for (let x = 0; x < width; x += barWidth) {
        const startSample = Math.floor(x * samplesPerPixel);
        const endSample = Math.min(startSample + samplesPerPixel * barWidth, pcmArray.length);
        
        let max = 0;
        for (let i = startSample; i < endSample; i++) {
          max = Math.max(max, Math.abs(pcmArray[i]));
        }
        
        const normalizedHeight = (max / 32768) * (height * 0.8);
        const barHeight = Math.max(2, normalizedHeight);
        const y = (height - barHeight) / 2;
        
        // Color based on progress when paused or playing
        if (showPausedPosition || isPlaying) {
          if (x < progressWidth) {
            ctx.fillStyle = '#34c759'; // Played portion - green
          } else {
            ctx.fillStyle = '#666'; // Unplayed portion - gray
          }
        } else {
          ctx.fillStyle = '#666'; // Default gray when no position set
        }
        ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
      }
      
      // Draw playhead line when paused or playing
      if ((showPausedPosition || isPlaying) && audioRef.current) {
        ctx.strokeStyle = '#34c759';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(progressWidth, 0);
        ctx.lineTo(progressWidth, height);
        ctx.stroke();
      }
    };
    
    // Show paused position if we have a current time set
    drawWaveform(currentTime > 0);

    // Draw progress overlay during playback - optimized for smoothness
    const drawProgress = () => {
      if (!audioRef.current || !audioRef.current.duration) return;
      
      const progress = audioRef.current.currentTime / audioRef.current.duration;
      const progressWidth = width * progress;
      
      // Only redraw the progress overlay, not the entire waveform
      ctx.clearRect(0, 0, width, height);
      
      // Redraw waveform bars with progress coloring
      const samplesPerPixel = Math.floor(pcmArray.length / width);
      const barWidth = Math.max(1, width / Math.min(width, 200));
      
      for (let x = 0; x < width; x += barWidth) {
        const startSample = Math.floor(x * samplesPerPixel);
        const endSample = Math.min(startSample + samplesPerPixel * barWidth, pcmArray.length);
        
        let max = 0;
        for (let i = startSample; i < endSample; i++) {
          max = Math.max(max, Math.abs(pcmArray[i]));
        }
        
        const normalizedHeight = (max / 32768) * (height * 0.8);
        const barHeight = Math.max(2, normalizedHeight);
        const y = (height - barHeight) / 2;
        
        // Smooth color transition based on progress
        if (x < progressWidth) {
          ctx.fillStyle = '#34c759'; // Played portion - green
        } else {
          ctx.fillStyle = '#666'; // Unplayed portion - gray
        }
        ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
      }
      
      // Draw smooth playhead line
      ctx.strokeStyle = '#34c759';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressWidth, 0);
      ctx.lineTo(progressWidth, height);
      ctx.stroke();
      
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(drawProgress);
      }
    };

    if (isPlaying && audioRef.current) {
      drawProgress();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioData, isPlaying, currentTime]);

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) {
      console.log('Audio not ready:', { audioRef: !!audioRef.current, audioUrl: !!audioUrl });
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Reset to beginning if at end
      if (audioRef.current.ended) {
        audioRef.current.currentTime = 0;
      }
      
      audioRef.current.play().catch(error => {
        console.error('Playback failed:', error);
        console.log('Audio element state:', {
          readyState: audioRef.current?.readyState,
          networkState: audioRef.current?.networkState,
          error: audioRef.current?.error
        });
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleWaveformClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const progress = x / rect.width;
    
    // Seek to clicked position
    const newTime = progress * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    
    // Force redraw to show new position immediately
    if (!isPlaying && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const pcmArray = new Int16Array(audioData);
        const width = canvas.width;
        const height = canvas.height;
        const progressWidth = width * progress;
        
        ctx.clearRect(0, 0, width, height);
        
        const samplesPerPixel = Math.floor(pcmArray.length / width);
        const barWidth = Math.max(1, width / Math.min(width, 200));
        
        for (let x = 0; x < width; x += barWidth) {
          const startSample = Math.floor(x * samplesPerPixel);
          const endSample = Math.min(startSample + samplesPerPixel * barWidth, pcmArray.length);
          
          let max = 0;
          for (let i = startSample; i < endSample; i++) {
            max = Math.max(max, Math.abs(pcmArray[i]));
          }
          
          const normalizedHeight = (max / 32768) * (height * 0.8);
          const barHeight = Math.max(2, normalizedHeight);
          const y = (height - barHeight) / 2;
          
          // Color based on new progress
          if (x < progressWidth) {
            ctx.fillStyle = '#34c759'; // Played portion - green
          } else {
            ctx.fillStyle = '#666'; // Unplayed portion - gray
          }
          ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
        }
        
        // Draw playhead line at new position
        ctx.strokeStyle = '#34c759';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(progressWidth, 0);
        ctx.lineTo(progressWidth, height);
        ctx.stroke();
      }
    }
  };

  return (
    <div className="audio-playback">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onLoadedMetadata={() => console.log('Audio metadata loaded')}
          onCanPlay={() => console.log('Audio can play')}
          onError={(e) => console.error('Audio error:', e)}
          preload="auto"
          controls={false}
        />
      )}
      
      <div className="playback-header">
        <button 
          className="glass-button"
          onClick={togglePlayback}
          disabled={!audioUrl}
          style={{ width: '48px', height: '48px', fontSize: '18px' }}
        >
          {isPlaying ? (
            <span style={{ color: '#ff3b30' }}>II</span>
          ) : (
            <span style={{ color: '#34c759' }}>▶</span>
          )}
        </button>
        
        <div className="waveform-container" onClick={handleWaveformClick}>
          <canvas 
            ref={canvasRef}
            className="waveform-canvas"
            width={400}
            height={50}
          />
        </div>
        
        <div className="time-display">
          <span className="text-secondary">{formatDuration(currentTime)}</span>
          <span className="text-muted">/</span>
          <span className="text-secondary">{formatDuration(duration)}</span>
        </div>
      </div>
    </div>
  );
}
