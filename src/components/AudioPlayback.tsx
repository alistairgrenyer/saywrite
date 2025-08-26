import { useState, useRef, useEffect } from 'react';
import './AudioPlayback.css';

interface AudioPlaybackProps {
  audioData: ArrayBuffer;
  duration: number;
  onClose: () => void;
}

export function AudioPlayback({ audioData, duration, onClose }: AudioPlaybackProps) {
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
      const sampleRate = 16000;
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
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    const samplesPerPixel = Math.floor(pcmArray.length / width);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      const startSample = x * samplesPerPixel;
      const endSample = Math.min(startSample + samplesPerPixel, pcmArray.length);
      
      let max = 0;
      for (let i = startSample; i < endSample; i++) {
        max = Math.max(max, Math.abs(pcmArray[i]));
      }
      
      const normalizedHeight = (max / 32768) * (height / 2);
      const y1 = (height / 2) - normalizedHeight;
      const y2 = (height / 2) + normalizedHeight;
      
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
    }
    ctx.stroke();

    // Draw progress overlay
    const drawProgress = () => {
      if (!audioRef.current || !audioRef.current.duration) return;
      
      const progress = audioRef.current.currentTime / audioRef.current.duration;
      const progressWidth = width * progress;
      
      // Redraw waveform first
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, width, height);
      
      // Redraw waveform bars
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const startSample = x * samplesPerPixel;
        const endSample = Math.min(startSample + samplesPerPixel, pcmArray.length);
        
        let max = 0;
        for (let i = startSample; i < endSample; i++) {
          max = Math.max(max, Math.abs(pcmArray[i]));
        }
        
        const normalizedHeight = (max / 32768) * (height / 2);
        const y1 = (height / 2) - normalizedHeight;
        const y2 = (height / 2) + normalizedHeight;
        
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
      }
      ctx.stroke();
      
      // Draw progress overlay
      ctx.fillStyle = 'rgba(52, 199, 89, 0.3)';
      ctx.fillRect(0, 0, progressWidth, height);
      
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
  }, [audioData, isPlaying]);

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Playback failed:', error);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          preload="metadata"
        />
      )}
      
      <div className="playback-header">
        <button 
          className="play-button"
          onClick={togglePlayback}
          disabled={!audioUrl}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="time-display">
          <span>{formatTime(currentTime)}</span>
          <span className="separator">/</span>
          <span>{formatTime(duration)}</span>
        </div>
        
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <canvas 
        ref={canvasRef}
        className="waveform-canvas"
        width={280}
        height={60}
      />
    </div>
  );
}
