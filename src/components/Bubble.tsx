import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioCapture, AudioLevelData } from '../utils/audioCapture';
import './Bubble.css';

function Bubble() {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [, setAudioLevel] = useState<AudioLevelData>({ rms: 0, peak: 0, timestamp: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [bubblePosition, setBubblePosition] = useState({ x: 0, y: 0 });
  
  const audioCapture = useRef<AudioCapture | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const lastUpdateTime = useRef<number>(0);

  useEffect(() => {
    // Initialize audio capture
    audioCapture.current = new AudioCapture({
      sampleRate: 16000,
      channels: 1,
      bufferSize: 2048
    });

    // Set up IPC listeners
    window.app.onFinal((text) => {
      console.log('Received transcription:', text);
      setTranscript(text);
      setRecording(false);
      setAudioLevel({ rms: 0, peak: 0, timestamp: 0 });
    });

    window.app.onSTTError((errorMsg) => {
      console.error('STT Error:', errorMsg);
      setError(errorMsg);
      setRecording(false);
      setAudioLevel({ rms: 0, peak: 0, timestamp: 0 });
    });

    return () => {
      if (audioCapture.current) {
        audioCapture.current.dispose();
      }
    };
  }, []);

  const handleLevelUpdate = useCallback((level: AudioLevelData) => {
    setAudioLevel(level);
  }, []);

  const initializeAudio = async () => {
    if (!audioCapture.current) return false;
    
    try {
      setIsInitializing(true);
      setError(null);
      await audioCapture.current.initialize();
      audioCapture.current.setLevelCallback(handleLevelUpdate);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMsg);
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  const startRecording = async () => {
    if (!audioCapture.current) return;

    const initialized = await initializeAudio();
    if (!initialized) return;

    try {
      audioCapture.current.startRecording();
      setRecording(true);
      setTranscript("");
      setError(null);
      window.app.startRecording();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMsg);
    }
  };

  const stopRecording = async () => {
    if (!audioCapture.current) return;

    try {
      const pcmData = audioCapture.current.stopRecording();
      setRecording(false); // Set recording to false immediately for UI feedback
      setAudioLevel({ rms: 0, peak: 0, timestamp: 0 });
      
      // Send PCM data to main process for transcription
      await window.app.stopRecording(pcmData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(errorMsg);
      setRecording(false);
    }
  };

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      toggleRecording();
    } else if (event.code === 'Escape' && recording) {
      event.preventDefault();
      setRecording(false);
      setAudioLevel({ rms: 0, peak: 0, timestamp: 0 });
      if (audioCapture.current) {
        audioCapture.current.dispose();
        audioCapture.current = new AudioCapture({
          sampleRate: 16000,
          channels: 1,
          bufferSize: 2048
        });
      }
    }
  };

  const clearError = () => {
    setError(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!bubbleRef.current) return;
    
    // Skip resize handling since we removed resize functionality
    
    const rect = bubbleRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && bubbleRef.current) {
      // Use transform directly for better performance
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      bubbleRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
      
      // Throttle state updates to reduce re-renders
      if (Date.now() - lastUpdateTime.current > 16) { // ~60fps
        setBubblePosition({ x: newX, y: newY });
        lastUpdateTime.current = Date.now();
      }
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      className={`bubble ${isDragging ? 'dragging' : ''}`}
      ref={bubbleRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      style={{
        transform: `translate3d(${bubblePosition.x}px, ${bubblePosition.y}px, 0)`,
        width: '120px',
        height: '120px',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <div className="bubble-content">
        {/* Main Microphone Button */}
        <button
          onClick={toggleRecording}
          disabled={isInitializing}
          className={`main-mic-button ${recording ? 'recording' : 'idle'} ${isInitializing ? 'initializing' : ''}`}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
        >
          {recording ? (
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
        
        {/* Settings Cog - Only visible on hover */}
        <button className="settings-button" aria-label="Settings">
          ⚙️
        </button>
      </div>
      

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={clearError} className="error-close">×</button>
          {error.includes('microphone') && (
            <button onClick={initializeAudio} className="retry-button">
              Retry
            </button>
          )}
        </div>
      )}

      {transcript && (
        <div 
          ref={transcriptRef}
          className="transcript-bubble"
        >
          <div className="transcript-content" title="Click to select text">
            {transcript}
          </div>
        </div>
      )}
    </div>
  );
}

export default Bubble;
